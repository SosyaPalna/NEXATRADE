const express = require('express');
const prisma = require('../utils/db');
const authenticate = require('../middleware/auth');

const router = express.Router();

// 🔹 Получить уведомления текущего пользователя
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: req.tenantId },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.notification.count({ where: { recipientId: req.tenantId } }),
      prisma.notification.count({ where: { recipientId: req.tenantId, isRead: false } })
    ]);
    res.json({ notifications, total, unread, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[notifications] GET / error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Количество непрочитанных
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'tenantId отсутствует в токене' });
    }
    const count = await prisma.notification.count({
      where: { recipientId: req.tenantId, isRead: false }
    });
    res.json({ count });
  } catch (err) {
    console.error('[notifications] GET /unread-count error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Отметить одно уведомление прочитанным
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, recipientId: req.tenantId },
      data: { isRead: true }
    });
    res.json({ message: 'Прочитано' });
  } catch (err) {
    console.error('[notifications] PATCH /:id/read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Отметить все прочитанными
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.tenantId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'Все уведомления прочитаны' });
  } catch (err) {
    console.error('[notifications] PATCH /read-all error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Количество непрочитанных сообщений чата
router.get('/chat-unread-count', authenticate, async (req, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'tenantId отсутствует в токене' });
    }

    // Продуктовые чаты: сообщения, где получатель — текущий tenant
    // (владелец товара либо покупатель, уже писавший в этот чат)
    const productChats = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "Message" m
      JOIN "Product" p ON m."productId" = p.id
      WHERE m."productId" IS NOT NULL
        AND m."senderId" != ${req.tenantId}
        AND m."readAt" IS NULL
        AND (
          p."tenantId" = ${req.tenantId}
          OR EXISTS (
            SELECT 1 FROM "Message" m2
            WHERE m2."productId" = m."productId"
              AND m2."senderId" = ${req.tenantId}
          )
        )
    `;

    // RFQ-чаты: сообщения, где получатель — текущий tenant
    // (buyer или seller, подавший quote)
    const rfqChats = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "Message" m
      JOIN "Rfq" r ON m."rfqId" = r.id
      LEFT JOIN "Quote" q ON q."rfqId" = r.id AND q."sellerId" = ${req.tenantId}
      WHERE m."rfqId" IS NOT NULL
        AND m."senderId" != ${req.tenantId}
        AND m."readAt" IS NULL
        AND (r."buyerId" = ${req.tenantId} OR q."sellerId" = ${req.tenantId})
    `;

    res.json({ count: (productChats[0]?.count || 0) + (rfqChats[0]?.count || 0) });
  } catch (err) {
    console.error('[notifications] GET /chat-unread-count error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Удалить уведомление
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, recipientId: req.tenantId }
    });
    res.json({ message: 'Уведомление удалено' });
  } catch (err) {
    console.error('[notifications] DELETE /:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
