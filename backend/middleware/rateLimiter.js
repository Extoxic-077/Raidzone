const rateLimit = require('express-rate-limit');

const handler = (req, res) =>
  res.status(429).json({ success: false, error: 'Too many requests, slow down.', code: 'RATE_LIMITED' });

// Auth endpoints: 10 attempts/min (login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// OTP resend: 1 per minute
const otpResendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// General API: 120 req/min
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Image upload: 5 per minute
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

module.exports = { authLimiter, otpResendLimiter, apiLimiter, uploadLimiter };
