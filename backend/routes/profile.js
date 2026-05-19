const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();

// 🔹 Получить данные текущего пользователя + его заявки
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, email: true, isActive: true, createdAt: true,
        tenant: { 
          select: { 
            id: true, name: true, role: true, isVerified: true 
          } 
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    // Получаем статистику по заявкам
    const rfqStats = await prisma.rfq.groupBy({
      by: ['status'],
      where: { buyerId: user.tenant.id },
      _count: { status: true }
    });

    res.json({ user, rfqStats });
  } catch (err) {
    console.error('❌ GET /profile/me error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Обновить данные текущего пользователя
router.put('/me', authenticate, async (req, res) => {
  try {
    const { email, password, companyName } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Обновляем пользователя
      const updateData = {};
      if (email && email !== req.userEmail) updateData.email = email;
      if (password && password.length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      let updatedUser = null;
      if (Object.keys(updateData).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: req.userId },
          data: updateData,
          select: { id: true, email: true }
        });
      }

      // 2. Обновляем компанию
      let updatedTenant = null;
      if (companyName) {
        updatedTenant = await tx.tenant.update({
          where: { id: req.tenantId },
          data: { name: companyName },
          select: { name: true }
        });
      }

      return { user: updatedUser, tenant: updatedTenant };
    });

    res.json({ 
      message: 'Данные обновлены', 
      user: result.user, 
      tenant: result.tenant 
    });
  } catch (err) {
    console.error('❌ PUT /profile/me error:', err.message);
    // Обработка уникальности email
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Этот email уже занят' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить заявки пользователя с фильтрами
router.get('/rfqs', authenticate, async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt', page = 1, limit = 20 } = req.query;
    
    const where = { buyerId: req.tenantId };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    // Валидация сортировки
    const validSorts = ['createdAt', 'title', 'budget', 'status'];
    const orderBy = validSorts.includes(sortBy) ? { [sortBy]: 'desc' } : { createdAt: 'desc' };

    const [rfqs, total] = await Promise.all([
      prisma.rfq.findMany({
        where,
        select: {
          id: true, title: true, description: true, quantity: true,
          budget: true, status: true, createdAt: true, deadline: true,
          _count: { select: { quotes: true } }
        },
        orderBy,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.rfq.count({ where })
    ]);

    res.json({ rfqs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('❌ GET /profile/rfqs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;