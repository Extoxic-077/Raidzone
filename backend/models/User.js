const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "USER" }, // ADMIN / USER
  active: { type: Boolean, default: true },

  // Login OTP — isolated from key-reveal and account-change flows
  otpCode: String,
  otpExpires: Date,
  otpLastSentAt: Date,

  // Key-reveal OTP — separate namespace to prevent collision with login flow
  revealOtpCode: String,
  revealOtpExpires: Date,

  // Email-change flow
  pendingEmail: String,
  emailChangeCode: String,
  emailChangeCodeExpires: Date,

  // Password-change flow
  passwordChangeCode: String,
  passwordChangeCodeExpires: Date,
});

module.exports = mongoose.model("User", UserSchema);
