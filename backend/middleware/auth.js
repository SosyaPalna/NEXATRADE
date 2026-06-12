const prisma = require('../lib/prisma');
const { verifyAccessToken } = require('../utils/jwt');

module.exports = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  const decoded = verifyAccessToken(token);
  if (decoded?.error) {
    if (decoded.error === 'TokenExpiredError') {
      return res.status(401).set('X-Token-Expired', 'true').json({ error: 'Токен истёк' });
    }
    return res.status(401).json({ error: 'Невалидный токен' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isActive: true, isAdmin: true, tenantId: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    req.userId = user.id;
    req.tenantId = user.tenantId;
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
};
