const { Server } = require('socket.io');
const cookie = require('cookie');
const prisma = require('../lib/prisma');
const { verifyAccessToken } = require('../utils/jwt');
const { canJoinRoom, getRoomName } = require('../lib/chat');

async function getRecipientId(roomType, roomId, senderTenantId) {
  if (roomType === 'rfq') {
    const rfq = await prisma.rfq.findUnique({
      where: { id: roomId },
      select: { buyerId: true, quotes: { select: { sellerId: true } } }
    });
    if (!rfq) return null;
    const sellerIds = rfq.quotes.map(q => q.sellerId);
    if (rfq.buyerId === senderTenantId) {
      // Buyer пишет первому seller из quotes (обычно один seller)
      return sellerIds.find(id => id !== senderTenantId) || null;
    }
    // Seller пишет buyer
    return rfq.buyerId !== senderTenantId ? rfq.buyerId : null;
  }

  if (roomType === 'product') {
    const product = await prisma.product.findUnique({
      where: { id: roomId },
      select: { tenantId: true }
    });
    if (!product) return null;
    if (product.tenantId !== senderTenantId) {
      // Покупатель пишет владельцу
      return product.tenantId;
    }
    // Владелец пишет покупателю (последнему, кто писал в чат)
    const lastBuyerMessage = await prisma.message.findFirst({
      where: { productId: roomId, senderId: { not: senderTenantId } },
      orderBy: { createdAt: 'desc' },
      select: { senderId: true }
    });
    return lastBuyerMessage?.senderId || null;
  }

  return null;
}

function parseAccessTokenFromCookie(handshake) {
  const raw = handshake.headers?.cookie;
  if (!raw) return null;
  try {
    const parsed = cookie.parse(raw);
    return parsed.accessToken || null;
  } catch {
    return null;
  }
}

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware для аутентификации сокетов
  io.use(async (socket, next) => {
    const token = parseAccessTokenFromCookie(socket.handshake);
    if (!token) return next(new Error('No token'));

    const decoded = verifyAccessToken(token);
    if (decoded?.error) return next(new Error('Invalid token'));

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true, tenantId: true, tenant: { select: { role: true } } }
      });
      if (!user || !user.isActive) return next(new Error('User inactive'));

      socket.userId = user.id;
      socket.tenantId = user.tenantId;
      socket.role = user.tenant?.role;
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message);
      next(new Error('Auth error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.tenantId}`);

    // Каждый пользователь присоединяется к своей персональной комнате для уведомлений
    socket.join(`tenant:${socket.tenantId}`);

    // Присоединение к универсальной комнате (rfq или product)
    socket.on('join:room', async ({ type, id }) => {
      const allowed = await canJoinRoom(socket.tenantId, type, id);
      if (!allowed) {
        return socket.emit('error', { message: 'Нет доступа к чату' });
      }
      const room = getRoomName(type, id);
      socket.join(room);
      console.log(`📡 ${socket.tenantId} joined room ${room}`);
    });

    // Отправка сообщения
    socket.on('message:send', async ({ roomType, roomId, content, attachments = [] }) => {
      if (!content?.trim() && (!attachments || attachments.length === 0)) return;
      if (!roomType || !roomId) return;

      const allowed = await canJoinRoom(socket.tenantId, roomType, roomId);
      if (!allowed) {
        return socket.emit('error', { message: 'Нет доступа для отправки сообщения' });
      }

      try {
        const data = {
          content: content?.trim() || '',
          senderId: socket.tenantId,
          attachments: Array.isArray(attachments) ? attachments.filter(url => typeof url === 'string' && url.startsWith('/uploads/')) : [],
        };
        if (roomType === 'rfq') data.rfqId = roomId;
        else if (roomType === 'product') data.productId = roomId;
        else return;

        const message = await prisma.message.create({
          data,
          include: { sender: { select: { name: true } } }
        });

        io.to(getRoomName(roomType, roomId)).emit('message:receive', message);

        // Определяем получателя сообщения и создаём уведомление
        try {
          const recipientId = await getRecipientId(roomType, roomId, socket.tenantId);
          if (!recipientId) return;

          let title = '';
          let link = '';

          if (roomType === 'rfq') {
            const rfq = await prisma.rfq.findUnique({ where: { id: roomId }, select: { title: true } });
            title = `Новое сообщение по заявке «${rfq?.title || roomId}»`;
            link = `/rfq/${roomId}`;
          } else if (roomType === 'product') {
            const product = await prisma.product.findUnique({ where: { id: roomId }, select: { name: true } });
            title = `Новое сообщение по товару «${product?.name || roomId}»`;
            link = `/product/${roomId}`;
          }

          const notification = await prisma.notification.create({
            data: {
              title,
              message: `${message.sender.name}: ${(content?.trim() || 'Файл').slice(0, 120)}${(content?.trim()?.length || 0) > 120 ? '...' : ''}`,
              type: 'chat',
              link,
              recipientId,
              metadata: { roomType, roomId, senderId: socket.tenantId },
            },
          });
          io.to(`tenant:${recipientId}`).emit('notification:new', notification);
        } catch (notifyErr) {
          console.error('❌ Notification error:', notifyErr.message);
        }
      } catch (err) {
        console.error('❌ Message error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Редактирование сообщения
    socket.on('message:edit', async ({ messageId, content }) => {
      if (!content?.trim()) return;
      try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.senderId !== socket.tenantId) {
          return socket.emit('error', { message: 'Нет доступа' });
        }
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { content: content.trim(), isEdited: true, editedAt: new Date() },
          include: { sender: { select: { name: true } } }
        });
        const roomType = updated.rfqId ? 'rfq' : 'product';
        const roomId = updated.rfqId || updated.productId;
        io.to(getRoomName(roomType, roomId)).emit('message:edited', updated);
      } catch (err) {
        console.error('❌ Edit error:', err.message);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Удаление сообщения (мягкое)
    socket.on('message:delete', async ({ messageId }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.senderId !== socket.tenantId) {
          return socket.emit('error', { message: 'Нет доступа' });
        }
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true },
          include: { sender: { select: { name: true } } }
        });
        const roomType = updated.rfqId ? 'rfq' : 'product';
        const roomId = updated.rfqId || updated.productId;
        io.to(getRoomName(roomType, roomId)).emit('message:deleted', updated);
      } catch (err) {
        console.error('❌ Delete error:', err.message);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Загрузка истории сообщений
    socket.on('messages:load', async ({ roomType, roomId, limit = 50, before, offset = 0 }) => {
      try {
        const allowed = await canJoinRoom(socket.tenantId, roomType, roomId);
        if (!allowed) {
          return socket.emit('error', { message: 'Нет доступа к истории сообщений' });
        }

        const where = {};
        if (roomType === 'rfq') where.rfqId = roomId;
        else if (roomType === 'product') where.productId = roomId;
        else return;

        if (before) {
          where.createdAt = { lt: new Date(before) };
        }

        const take = Math.min(parseInt(limit) || 50, 100);
        const skip = Math.max(parseInt(offset) || 0, 0);

        const messages = await prisma.message.findMany({
          where,
          include: { sender: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        });

        // Возвращаем в хронологическом порядке
        const ordered = messages.reverse();

        // Отмечаем сообщения собеседника как прочитанные
        const unreadIds = ordered
          .filter(m => m.senderId !== socket.tenantId && !m.readAt)
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await prisma.message.updateMany({
            where: { id: { in: unreadIds } },
            data: { readAt: new Date() }
          });
          // Уведомляем отправителей о прочтении
          const room = getRoomName(roomType, roomId);
          io.to(room).emit('messages:read', { ids: unreadIds, readAt: new Date() });
        }

        socket.emit('messages:loaded', { messages: ordered, hasMore: messages.length === take, before: ordered[0]?.createdAt });
      } catch (err) {
        socket.emit('error', { message: 'Failed to load messages' });
      }
    });

    // Пометить сообщения как прочитанные
    socket.on('messages:mark-read', async ({ roomType, roomId }) => {
      try {
        const where = {};
        if (roomType === 'rfq') where.rfqId = roomId;
        else if (roomType === 'product') where.productId = roomId;
        else return;
        where.senderId = { not: socket.tenantId };
        where.readAt = null;

        const messages = await prisma.message.findMany({
          where,
          select: { id: true }
        });
        const ids = messages.map(m => m.id);
        if (ids.length === 0) return;

        await prisma.message.updateMany({
          where: { id: { in: ids } },
          data: { readAt: new Date() }
        });

        io.to(getRoomName(roomType, roomId)).emit('messages:read', { ids, readAt: new Date() });
      } catch (err) {
        console.error('❌ Mark read error:', err.message);
      }
    });

    // Статус "печатает..."
    socket.on('typing:start', ({ roomType, roomId }) => {
      const room = getRoomName(roomType, roomId);
      socket.to(room).emit('typing', { tenantId: socket.tenantId, roomType, roomId, typing: true });
    });

    socket.on('typing:stop', ({ roomType, roomId }) => {
      const room = getRoomName(roomType, roomId);
      socket.to(room).emit('typing', { tenantId: socket.tenantId, roomType, roomId, typing: false });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.tenantId}`);
    });
  });

  return io;
};

module.exports = initSocket;
