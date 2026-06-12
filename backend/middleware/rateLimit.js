const rateLimit = require('express-rate-limit');

// Strict limit for login attempts: 5 per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте позже.' },
  skipSuccessfulRequests: false,
});

// Public API limit (auth, registration, refresh): 30 per 15 minutes per IP
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
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

module.exports = { loginLimiter, publicLimiter, authLimiter };
