const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Middleware: проверка на админа
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      console.error('❌ requireAdmin: no userId');
      return res.status(401).json({ error: 'Неавторизован' });
    }
    const user = await prisma.user.findUnique({ 
      where: { id: req.userId },
      select: { isAdmin: true }
    });
    if (!user?.isAdmin) {
      console.error('❌ requireAdmin: not admin, userId:', req.userId);
      return res.status(403).json({ error: 'Доступ только для администраторов' });
    }
    next();
  } catch (err) {
    console.error('❌ requireAdmin error:', err.message);
    res.status(401).json({ error: 'Неавторизован' });
  }
};

// 🔹 Получить всех пользователей (с поиском)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 GET /admin/users called by userId:', req.userId);
    
    const { search, page = 1, limit = 20 } = req.query;
    
    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { tenant: { name: { contains: search, mode: 'insensitive' } } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { tenant: { select: { name: true, role: true } } },
        select: { 
          id: true, email: true, isActive: true, isAdmin: true, createdAt: true,
          tenantId: true, tenant: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    console.log(`✅ Returned ${users.length} users`);
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('❌ GET /admin/users ERROR:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Обновить пользователя
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, isActive, isAdmin, password } = req.body;
    
    const updateData = { email, isActive, isAdmin };
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, isActive: true, isAdmin: true, tenant: { select: { name: true } } }
    });
    res.json(user);
  } catch (err) {
    console.error('❌ PUT /admin/users error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Удалить пользователя
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }
    
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    console.error('❌ DELETE /admin/users error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить все RFQ (с поиском)
router.get('/rfqs', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { buyer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const [rfqs, total] = await Promise.all([
      prisma.rfq.findMany({
        where,
        include: { 
          buyer: { select: { name: true } },
          _count: { select: { quotes: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.rfq.count({ where })
    ]);

    res.json({ rfqs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('❌ GET /admin/rfqs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Обновить статус RFQ
router.patch('/rfqs/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'in_progress', 'closed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const rfq = await prisma.rfq.update({
      where: { id: req.params.id },
      data: { status },
      include: { buyer: { select: { name: true } } }
    });
    res.json(rfq);
  } catch (err) {
    console.error('❌ PATCH /admin/rfqs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Удалить RFQ
router.delete('/rfqs/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.rfq.delete({ where: { id: req.params.id } });
    res.json({ message: 'RFQ удалён' });
  } catch (err) {
    console.error('❌ DELETE /admin/rfqs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;