const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} = require('../utils/jwt');
const { validatePassword } = require('../utils/password');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas');

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
  maxAge: 15 * 60 * 1000, // 15 минут
};

const REFRESH_COOKIE = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, ACCESS_COOKIE);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE);
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', { path: '/', httpOnly: true });
  res.clearCookie('refreshToken', { path: '/', httpOnly: true });
}

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, tenant } = req.body;
    if (!email || !password || !tenant?.name) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
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

    const accessToken = generateAccessToken(user.id, newTenant.id);
    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_COOKIE.maxAge),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        tenantId: newTenant.id,
        isAdmin: user.isAdmin,
      }
    });
  } catch (err) {
    console.error(' Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Заполните email и пароль' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Неверные данные' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Неверные данные' });

    const accessToken = generateAccessToken(user.id, user.tenantId);
    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_COOKIE.maxAge),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        isAdmin: user.isAdmin,
      }
    });
  } catch (err) {
    console.error(' Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token не предоставлен' });
    }

    const tokenHash = hashRefreshToken(oldRefreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { tenant: true } } }
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Невалидный refresh token' });
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });

    const accessToken = generateAccessToken(stored.user.id, stored.user.tenantId);
    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashRefreshToken(refreshToken),
        userId: stored.user.id,
        expiresAt: new Date(Date.now() + REFRESH_COOKIE.maxAge),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ ok: true });
  } catch (err) {
    console.error(' Refresh error:', err.message);
    clearAuthCookies(res);
    res.status(500).json({ error: 'Ошибка обновления токена' });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashRefreshToken(refreshToken) },
        data: { revokedAt: new Date() }
      });
    }
  } catch (err) {
    console.error(' Logout DB error:', err.message);
  }
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isAdmin: true,
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
