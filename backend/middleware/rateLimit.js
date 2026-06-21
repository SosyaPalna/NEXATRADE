const rateLimit = require('express-rate-limit');

const LOGIN_LIMITER_TRUSTED_IPS = (process.env.LOGIN_LIMITER_TRUSTED_IPS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Strict limit for login attempts: 10 per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте позже.' },
  skipSuccessfulRequests: true,
  skip: (req) => LOGIN_LIMITER_TRUSTED_IPS.includes(req.ip),
});

// Public API limit (registration, cities): 30 per 15 minutes per IP
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
});

// Refresh token endpoint: allow more requests because multiple tabs/retries
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток обновления сессии. Попробуйте позже.' },
});

// Authenticated API limit: 1000 requests per 15 minutes per user
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
  keyGenerator: (req) => req.userId || req.ip,
});

// Global API fallback limit: 1000 per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
});

// Chat file downloads: 200 requests per 15 minutes per authenticated user
const chatFilesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много скачиваний файлов. Попробуйте позже.' },
  keyGenerator: (req) => req.userId || req.ip,
});

module.exports = { loginLimiter, publicLimiter, refreshLimiter, authLimiter, apiLimiter, chatFilesLimiter };
