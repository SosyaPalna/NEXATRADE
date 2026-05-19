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
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status, resolvedAt: status !== 'pending' ? new Date() : null, resolvedBy: req.userId }
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
