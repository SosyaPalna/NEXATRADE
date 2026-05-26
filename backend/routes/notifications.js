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
