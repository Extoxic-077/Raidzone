const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { verifyToken }                              = require('../middleware/auth');
const { authLimiter, otpResendLimiter }            = require('../middleware/rateLimiter');
const { sendOtpEmail, maskEmail }                  = require('../services/email.service');
const { generateOtp, issueTokenPair, otpExpiry, isOtpValid } = require('../services/auth.service');
const { jwtSecret }                                = require('../config/env');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   true,
  sameSite: 'strict',
  maxAge:   30 * 24 * 60 * 60 * 1000,
};

// ── Register ─────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'name, email and password are required', code: 'VALIDATION_ERROR' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user   = await new User({ name, email, password: hashed }).save();
    res.status(201).json({ success: true, data: { name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

// ── Login step 1: validate creds, send OTP ───────────────────────────────────
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password', code: 'AUTH_INVALID' });
    }
    if (user.active === false) {
      return res.status(403).json({ success: false, error: 'Account is suspended', code: 'USER_INACTIVE' });
    }

    const code = generateOtp();
    user.otpCode       = code;
    user.otpExpires    = otpExpiry();
    user.otpLastSentAt = new Date();
    await user.save();
    await sendOtpEmail(user.email, code);

    res.json({ success: true, data: { message: 'Code sent', maskedEmail: maskEmail(user.email) } });
  } catch (err) { next(err); }
});

// ── Login step 2: verify OTP, issue tokens ───────────────────────────────────
router.post('/verify-otp', authLimiter, async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    const user = await User.findOne({ email });

    if (!isOtpValid(user, 'otpCode', 'otpExpires', otpCode)) {
      return res.status(401).json({ success: false, error: 'Invalid or expired code', code: 'OTP_INVALID' });
    }

    user.otpCode = user.otpExpires = undefined;
    await user.save();

    const { accessToken, refreshToken } = issueTokenPair(user);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.json({
      success: true,
      data: {
        accessToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) { next(err); }
});

// ── Resend OTP ────────────────────────────────────────────────────────────────
router.post('/resend-otp', otpResendLimiter, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });

    const now = new Date();
    if (user.otpLastSentAt && now - user.otpLastSentAt < 60_000) {
      return res.status(429).json({ success: false, error: 'Wait 60 seconds before resending', code: 'OTP_RATE_LIMITED' });
    }

    const code = generateOtp();
    user.otpCode = code; user.otpExpires = otpExpiry(); user.otpLastSentAt = now;
    await user.save();
    await sendOtpEmail(user.email, code);
    res.json({ success: true, data: { message: 'Code resent', maskedEmail: maskEmail(user.email) } });
  } catch (err) { next(err); }
});

// ── Token refresh ─────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, error: 'No refresh token', code: 'AUTH_REQUIRED' });

    const decoded = jwt.verify(token, jwtSecret);
    const { accessToken, refreshToken } = issueTokenPair(decoded);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.json({ success: true, data: { accessToken, user: { id: decoded.id, role: decoded.role } } });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Invalid refresh token', code: 'AUTH_INVALID' });
    }
    next(err);
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.put('/me', verifyToken, async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ── Email change ──────────────────────────────────────────────────────────────
router.post('/request-email-change', verifyToken, async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, error: 'newEmail required', code: 'VALIDATION_ERROR' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });

    const code = generateOtp();
    user.pendingEmail = newEmail; user.emailChangeCode = code; user.emailChangeCodeExpires = otpExpiry();
    await user.save();
    await sendOtpEmail(newEmail, code);
    res.json({ success: true, data: { message: 'Code sent', maskedEmail: maskEmail(newEmail) } });
  } catch (err) { next(err); }
});

router.post('/verify-email-change', verifyToken, async (req, res, next) => {
  try {
    const { otpCode } = req.body;
    const user = await User.findById(req.user.id);

    if (!isOtpValid(user, 'emailChangeCode', 'emailChangeCodeExpires', otpCode)) {
      return res.status(401).json({ success: false, error: 'Invalid or expired code', code: 'OTP_INVALID' });
    }

    user.email = user.pendingEmail;
    user.pendingEmail = user.emailChangeCode = user.emailChangeCodeExpires = undefined;
    await user.save();
    res.json({ success: true, data: { message: 'Email updated', email: user.email } });
  } catch (err) { next(err); }
});

// ── Password change ───────────────────────────────────────────────────────────
router.post('/request-password-change', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });

    const code = generateOtp();
    user.passwordChangeCode = code; user.passwordChangeCodeExpires = otpExpiry();
    await user.save();
    await sendOtpEmail(user.email, code);
    res.json({ success: true, data: { message: 'Code sent', maskedEmail: maskEmail(user.email) } });
  } catch (err) { next(err); }
});

router.post('/verify-password-change', verifyToken, async (req, res, next) => {
  try {
    const { newPassword, otpCode } = req.body;
    if (!newPassword) return res.status(400).json({ success: false, error: 'newPassword required', code: 'VALIDATION_ERROR' });

    const user = await User.findById(req.user.id);
    if (!isOtpValid(user, 'passwordChangeCode', 'passwordChangeCodeExpires', otpCode)) {
      return res.status(401).json({ success: false, error: 'Invalid or expired code', code: 'OTP_INVALID' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangeCode = user.passwordChangeCodeExpires = undefined;
    await user.save();
    res.json({ success: true, data: { message: 'Password updated' } });
  } catch (err) { next(err); }
});

module.exports = { router, sendOtpEmail, maskEmail };
