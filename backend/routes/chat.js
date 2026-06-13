const express = require('express');
const path = require('path');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');
const { canJoinRoom } = require('../lib/chat');
const { UPLOAD_ROOT } = require('../lib/upload');

const router = express.Router();

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '');
}

// Авторизованная отдача файлов чата
router.get('/files/:filename', authenticate, async (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename);
    if (!filename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const pattern = `%/chat/${filename}`;
    const messages = await prisma.$queryRaw`
      SELECT id, "senderId", "rfqId", "productId", attachments
      FROM "Message"
      WHERE EXISTS (
        SELECT 1 FROM unnest(attachments) AS url
        WHERE url LIKE ${pattern}
      )
      LIMIT 1
    `;

    const message = messages[0];
    if (!message) {
      return res.status(404).json({ error: 'File not found' });
    }

    const roomType = message.rfqId ? 'rfq' : 'product';
    const roomId = message.rfqId || message.productId;

    const allowed = await canJoinRoom(req.tenantId, roomType, roomId);
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(UPLOAD_ROOT, 'chat', filename);
    res.sendFile(filePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).json({ error: 'File not found' });
        }
        console.error('[chat/files] sendFile error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to send file' });
      }
    });
  } catch (err) {
    console.error('[chat/files] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Список чатов текущего пользователя
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Product chats
    const productRooms = await prisma.$queryRaw`
      SELECT DISTINCT m."productId" AS "roomId", p.name AS title, p."tenantId" AS "ownerId"
      FROM "Message" m
      JOIN "Product" p ON m."productId" = p.id
      WHERE m."productId" IS NOT NULL
        AND (p."tenantId" = ${tenantId} OR m."senderId" = ${tenantId})
    `;

    // RFQ chats
    const rfqRooms = await prisma.$queryRaw`
      SELECT DISTINCT m."rfqId" AS "roomId", r.title, r."buyerId" AS "buyerId"
      FROM "Message" m
      JOIN "Rfq" r ON m."rfqId" = r.id
      LEFT JOIN "Quote" q ON q."rfqId" = r.id AND q."sellerId" = ${tenantId}
      WHERE m."rfqId" IS NOT NULL
        AND (r."buyerId" = ${tenantId} OR q."sellerId" = ${tenantId})
    `;

    const buildRoom = async (roomType, roomId, title, counterpartId) => {
      const [lastMessage, unreadCount, counterpart] = await Promise.all([
        prisma.message.findFirst({
          where: roomType === 'product' ? { productId: roomId } : { rfqId: roomId },
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, name: true } } }
        }),
        prisma.message.count({
          where: {
            ...(roomType === 'product' ? { productId: roomId } : { rfqId: roomId }),
            senderId: { not: tenantId },
            readAt: null
          }
        }),
        prisma.tenant.findUnique({ where: { id: counterpartId }, select: { id: true, name: true, avatarUrl: true } })
      ]);
      return { roomType, roomId, title, counterpart, lastMessage, unreadCount };
    };

    const rooms = await Promise.all([
      ...productRooms.map(r => {
        const counterpartId = r.ownerId === tenantId
          ? null // определим позже, возьмём первого писавшего покупателя
          : r.ownerId;
        return (async () => {
          let cid = counterpartId;
          if (!cid) {
            const msg = await prisma.message.findFirst({
              where: { productId: r.roomId, senderId: { not: tenantId } },
              orderBy: { createdAt: 'desc' },
              select: { senderId: true }
            });
            cid = msg?.senderId;
          }
          return buildRoom('product', r.roomId, r.title, cid);
        })();
      }),
      ...rfqRooms.map(r => {
        const counterpartId = r.buyerId === tenantId
          ? null
          : r.buyerId;
        return (async () => {
          let cid = counterpartId;
          if (!cid) {
            // buyer — ищем seller из quotes, который писал
            const msg = await prisma.message.findFirst({
              where: { rfqId: r.roomId, senderId: { not: tenantId } },
              orderBy: { createdAt: 'desc' },
              select: { senderId: true }
            });
            cid = msg?.senderId;
          }
          return buildRoom('rfq', r.roomId, r.title, cid);
        })();
      })
    ]);

    rooms.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));

    res.json({ rooms });
  } catch (err) {
    console.error('[chat/rooms] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Поиск по сообщениям (в конкретном диалоге или по всем чатам пользователя)
router.get('/search', authenticate, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const query = String(req.query.query || '').trim();
    const roomType = req.query.roomType;
    const roomId = req.query.roomId;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    if (!query || query.length > 200) {
      return res.status(400).json({ error: 'Invalid query' });
    }

    let productRoomIds = [];
    let rfqRoomIds = [];

    if (roomType && roomId) {
      const allowed = await canJoinRoom(tenantId, roomType, roomId);
      if (!allowed) return res.status(403).json({ error: 'Access denied' });
      if (roomType === 'product') productRoomIds = [roomId];
      else if (roomType === 'rfq') rfqRoomIds = [roomId];
    } else {
      const [productRooms, rfqRooms] = await Promise.all([
        prisma.$queryRaw`
          SELECT DISTINCT m."productId" AS "roomId"
          FROM "Message" m
          JOIN "Product" p ON m."productId" = p.id
          WHERE m."productId" IS NOT NULL
            AND (p."tenantId" = ${tenantId} OR m."senderId" = ${tenantId})
        `,
        prisma.$queryRaw`
          SELECT DISTINCT m."rfqId" AS "roomId"
          FROM "Message" m
          JOIN "Rfq" r ON m."rfqId" = r.id
          LEFT JOIN "Quote" q ON q."rfqId" = r.id AND q."sellerId" = ${tenantId}
          WHERE m."rfqId" IS NOT NULL
            AND (r."buyerId" = ${tenantId} OR q."sellerId" = ${tenantId})
        `
      ]);
      productRoomIds = productRooms.map(r => r.roomId);
      rfqRoomIds = rfqRooms.map(r => r.roomId);
    }

    const orConditions = [];
    if (productRoomIds.length > 0) {
      orConditions.push({ productId: { in: productRoomIds } });
    }
    if (rfqRoomIds.length > 0) {
      orConditions.push({ rfqId: { in: rfqRoomIds } });
    }

    if (orConditions.length === 0) {
      return res.json({ messages: [], total: 0, hasMore: false });
    }

    const where = {
      isDeleted: false,
      content: { contains: query, mode: 'insensitive' },
      OR: orConditions,
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          sender: { select: { id: true, name: true } },
          product: { select: { id: true, name: true } },
          rfq: { select: { id: true, title: true } },
        },
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      messages,
      total,
      hasMore: offset + messages.length < total,
    });
  } catch (err) {
    console.error('[chat/search] error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
