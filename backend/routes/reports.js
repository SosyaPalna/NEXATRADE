const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Middleware: проверка на админа
const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { isAdmin: true } });
    if (!user?.isAdmin) return res.status(403).json({ error: 'Доступ только для администраторов' });
    next();
  } catch {
    res.status(401).json({ error: 'Неавторизован' });
  }
};

// 🔹 Создать жалобу (любой авторизованный пользователь)
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, targetId, reason, description } = req.body;
    if (!type || !targetId || !reason) {
      return res.status(400).json({ error: 'Тип, ID цели и причина обязательны' });
    }
    const report = await prisma.report.create({
      data: { type, targetId, reason, description, reporterId: req.tenantId }
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить мои жалобы (текущий пользователь)
router.get('/my', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { reporterId: req.tenantId };
    if (status && status !== 'all') where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.report.count({ where })
    ]);

    res.json({ reports, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить одну жалобу (владелец или админ)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { isAdmin: true } });
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          include: { sender: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    if (!report) return res.status(404).json({ error: 'Жалоба не найдена' });
    if (!user?.isAdmin && report.reporterId !== req.tenantId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Отправить сообщение в чат жалобы
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { isAdmin: true } });
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: 'Жалоба не найдена' });
    if (!user?.isAdmin && report.reporterId !== req.tenantId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    if (['resolved', 'dismissed', 'closed'].includes(report.status)) {
      return res.status(400).json({ error: 'Жалоба закрыта, отправка сообщений невозможна' });
    }

    const message = await prisma.reportMessage.create({
      data: {
        content: content.trim(),
        reportId: req.params.id,
        senderId: req.tenantId,
        senderType: user?.isAdmin ? 'admin' : 'user'
      },
      include: { sender: { select: { name: true, avatarUrl: true } } }
    });

    // Уведомление другой стороне
    const recipientId = user?.isAdmin ? report.reporterId : null; // админ пишет → уведомляем пользователя
    // Найдём админа, если пишет пользователь
    let adminRecipientId = null;
    if (!user?.isAdmin) {
      const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { tenantId: true } });
      adminRecipientId = admins[0]?.tenantId || null;
    }

    const notifyId = recipientId || adminRecipientId;
    if (notifyId) {
      await prisma.notification.create({
        data: {
          title: 'Новое сообщение в жалобе',
          message: `Получен ответ по жалобе #${report.id.slice(0, 8)}`,
          type: 'report',
          link: `/profile/reports/${report.id}`,
          recipientId: notifyId,
          metadata: { reportId: report.id }
        }
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить сообщения чата жалобы
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { isAdmin: true } });
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: 'Жалоба не найдена' });
    if (!user?.isAdmin && report.reporterId !== req.tenantId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const messages = await prisma.reportMessage.findMany({
      where: { reportId: req.params.id },
      include: { sender: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить все жалобы (админ)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.type = type;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.report.count({ where })
    ]);

    res.json({ reports, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Обновить статус жалобы (админ)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'in_progress', 'resolved', 'dismissed', 'closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        status,
        resolvedAt: ['resolved', 'dismissed', 'closed'].includes(status) ? new Date() : null,
        resolvedBy: ['resolved', 'dismissed', 'closed'].includes(status) ? req.userId : null
      }
    });

    // Уведомляем пользователя о смене статуса
    const statusLabels = {
      pending: 'В ожидании',
      in_progress: 'В работе',
      resolved: 'Решена',
      dismissed: 'Отклонена',
      closed: 'Закрыта'
    };

    await prisma.notification.create({
      data: {
        title: 'Обновление статуса жалобы',
        message: `Статус вашей жалобы #${report.id.slice(0, 8)} изменён на «${statusLabels[status]}»`,
        type: 'report',
        link: `/profile/reports/${report.id}`,
        recipientId: report.reporterId,
        metadata: { reportId: report.id, status }
      }
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
