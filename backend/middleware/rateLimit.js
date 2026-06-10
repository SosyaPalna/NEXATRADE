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

// General API limit: 1000 requests per 15 minutes per IP
// For authenticated users, rate limit by userId to avoid shared IP issues (NAT, corporate networks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
  keyGenerator: (req) => {
    // If authenticated, limit by userId; otherwise by IP
    return req.userId || req.ip;
  },
});

module.exports = { loginLimiter, apiLimiter };
