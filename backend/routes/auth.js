const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  try {
    const { email, password, tenant } = req.body;
    if (!email || !password || !tenant?.name) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email уже занят' });

    const hashed = await bcrypt.hash(password, 10);
    const newTenant = await prisma.tenant.create({ 
      data: { name: tenant.name, role: tenant.role || 'buyer' } 
    });
    const user = await prisma.user.create({ 
      data: { email, password: hashed, tenantId: newTenant.id } 
    });

    res.status(201).json({
      accessToken: generateToken(user.id, newTenant.id),
      user: { 
        id: user.id, 
        email: user.email, 
        tenantId: newTenant.id,
        isAdmin: user.isAdmin // ← ДОБАВЛЕНО
      }
    });
  } catch (err) {
    console.error(' Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Неверные данные' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Неверные данные' });

    res.json({
      accessToken: generateToken(user.id, user.tenantId),
      user: { 
        id: user.id, 
        email: user.email, 
        tenantId: user.tenantId,
        isAdmin: user.isAdmin // ← ДОБАВЛЕНО
      }
    });
  } catch (err) {
    console.error(' Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isAdmin: true, // ← ДОБАВЛЕНО
        createdAt: true,
        tenantId: true,
        tenant: { select: { name: true, role: true } }
      }
    });
    
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;