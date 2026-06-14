const prisma = require('./prisma');

async function logAudit({ userId, tenantId, action, targetType, targetId, metadata, ip, userAgent }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        tenantId,
        action,
        targetType,
        targetId,
        metadata,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
