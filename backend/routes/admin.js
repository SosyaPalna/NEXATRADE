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

// 🔹 Получить всех пользователей (с поиском) — СПИСОК
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

    // ✅ ТОЛЬКО select, без include!
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { 
          id: true, 
          email: true, 
          isActive: true, 
          isAdmin: true, 
          createdAt: true,
          tenantId: true, 
          tenant: { 
            select: { 
              name: true, 
              role: true 
            } 
          }
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
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить детальные данные пользователя + его заявки — КАРТОЧКА
router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 GET /admin/users/:id called for userId:', req.params.id);
    
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, 
        email: true, 
        isActive: true, 
        isAdmin: true, 
        createdAt: true,
        tenant: { 
          select: { 
            id: true, 
            name: true, 
            role: true, 
            isVerified: true 
          } 
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    // Получаем последние 10 заявок покупателя (если компания — покупатель)
    const rfqs = await prisma.rfq.findMany({
      where: { buyerId: user.tenant?.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { 
        id: true, 
        title: true, 
        status: true, 
        budget: true, 
        createdAt: true 
      }
    });

    res.json({ user, rfqs });
  } catch (err) {
    console.error('❌ GET /admin/users/:id ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Полное редактирование пользователя + название компании
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, isActive, isAdmin, password, companyName } = req.body;
    
    // Используем транзакцию для атомарного обновления User и Tenant
    const result = await prisma.$transaction(async (tx) => {
      // 1. Обновляем пользователя
      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
      if (password && password.length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await tx.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: { 
          id: true, 
          email: true, 
          isActive: true, 
          isAdmin: true, 
          tenantId: true 
        }
      });

      // 2. Обновляем компанию (если передано новое имя)
      let updatedTenant = null;
      if (companyName && updatedUser?.tenantId) {
        updatedTenant = await tx.tenant.update({
          where: { id: updatedUser.tenantId },
          data: { name: companyName },
          select: { name: true }
        });
      }

      return { user: updatedUser, tenant: updatedTenant };
    });

    console.log(`✅ Updated user ${req.params.id}`);
    res.json({ ...result.user, tenant: result.tenant });
  } catch (err) {
    console.error('❌ PUT /admin/users/:id ERROR:', err.message);
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
    console.log(`✅ Deleted user ${req.params.id}`);
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    console.error('❌ DELETE /admin/users/:id ERROR:', err.message);
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
        select: {
          id: true,
          title: true,
          description: true,
          quantity: true,
          budget: true,
          status: true,
          createdAt: true,
          buyer: { select: { name: true } },
          category: { select: { id: true, name: true } },
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
    console.error('❌ GET /admin/rfqs ERROR:', err.message);
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
      select: {
        id: true,
        title: true,
        status: true,
        buyer: { select: { name: true } }
      }
    });
    res.json(rfq);
  } catch (err) {
    console.error('❌ PATCH /admin/rfqs ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Удалить RFQ
router.delete('/rfqs/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.rfq.delete({ where: { id: req.params.id } });
    console.log(`✅ Deleted RFQ ${req.params.id}`);
    res.json({ message: 'RFQ удалён' });
  } catch (err) {
    console.error('❌ DELETE /admin/rfqs ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Статистика для дашборда
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalTenants,
      totalRfqs,
      totalProducts,
      totalQuotes,
      totalCategories,
      usersByDay,
      rfqsByDay,
      quotesByDay,
      rfqsByStatus,
      topSellers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.rfq.count(),
      prisma.product.count(),
      prisma.quote.count(),
      prisma.category.count(),
      prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      }).then(rows => rows.map(r => ({ date: r.createdAt.toISOString().split('T')[0], count: r._count.id }))),
      prisma.rfq.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      }).then(rows => rows.map(r => ({ date: r.createdAt.toISOString().split('T')[0], count: r._count.id }))),
      prisma.quote.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      }).then(rows => rows.map(r => ({ date: r.createdAt.toISOString().split('T')[0], count: r._count.id }))),
      prisma.rfq.groupBy({
        by: ['status'],
        _count: { id: true }
      }).then(rows => rows.map(r => ({ status: r.status, count: r._count.id }))),
      prisma.tenant.findMany({
        where: { role: 'seller' },
        select: {
          id: true,
          name: true,
          _count: { select: { quotes: true } }
        },
        orderBy: { quotes: { _count: 'desc' } },
        take: 10
      })
    ]);

    // Fill missing days with 0
    const fillDays = (data) => {
      const result = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const ds = d.toISOString().split('T')[0];
        const found = data.find(x => x.date === ds);
        result.push({ date: ds, count: found ? found.count : 0 });
      }
      return result;
    };

    res.json({
      counts: { users: totalUsers, tenants: totalTenants, rfqs: totalRfqs, products: totalProducts, quotes: totalQuotes, categories: totalCategories },
      usersByDay: fillDays(usersByDay),
      rfqsByDay: fillDays(rfqsByDay),
      quotesByDay: fillDays(quotesByDay),
      rfqsByStatus,
      topSellers
    });
  } catch (err) {
    console.error('❌ GET /admin/stats ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;