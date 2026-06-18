const prisma = require('../lib/prisma');
const { verifyAccessToken } = require('../utils/jwt');

module.exports = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return next();
  }

  const decoded = verifyAccessToken(token);
  if (decoded?.error) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isActive: true, isAdmin: true, tenantId: true }
    });

    if (user && user.isActive) {
      req.userId = user.id;
      req.tenantId = user.tenantId;
      req.user = user;
    }
  } catch (err) {
    console.error('Optional auth middleware error:', err.message);
  }

  next();
};
