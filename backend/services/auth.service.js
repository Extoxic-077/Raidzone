const jwt  = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function issueTokenPair(user) {
  const payload = { id: user._id, role: user.role };

  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: '30d' });

  return { accessToken, refreshToken };
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

function otpExpiry() {
  return new Date(Date.now() + OTP_TTL_MS);
}

function isOtpValid(user, fieldCode, fieldExpires, submitted) {
  if (!user[fieldCode] || !user[fieldExpires]) return false;
  if (new Date() > user[fieldExpires]) return false;
  return user[fieldCode] === submitted;
}

function clearOtpFields(user, ...fieldPairs) {
  // fieldPairs: [['otpCode','otpExpires'], ['otpLastSentAt']]
  for (const fields of fieldPairs) {
    for (const f of fields) user[f] = undefined;
  }
}

module.exports = { generateOtp, issueTokenPair, verifyToken, otpExpiry, isOtpValid, clearOtpFields };
