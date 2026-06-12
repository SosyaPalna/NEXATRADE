const fs = require('fs');
const path = require('path');

const LOG_DIR = '/var/log/nexatrade';
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Логирует изменяющие действия администраторов.
 */
function auditLog(req, res, next) {
  if (req.user?.isAdmin && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    try {
      ensureLogDir();
      const entry = {
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        email: req.user.email,
        method: req.method,
        path: req.originalUrl || req.path,
        body: redactBody(req.body),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch (err) {
      console.error('[auditLog] failed to write log:', err.message);
    }
  }
  next();
}

function redactBody(body) {
  if (!body || typeof body !== 'object') return body;
  const clone = { ...body };
  ['password', 'token', 'refreshToken', 'accessToken', 'secret'].forEach((key) => {
    if (clone[key]) clone[key] = '[REDACTED]';
  });
  return clone;
}

module.exports = auditLog;
