const express = require("express");
const router = express.Router();
const Key = require("../models/Key");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");
const { sendOtpEmail, maskEmail } = require("./auth");

// SEND OTP FOR KEY REVEAL
router.post("/send-reveal-otp", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.revealOtpCode = code;
    user.revealOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, code);

    res.json({ 
      success: true, 
      data: { 
        message: "OTP sent to your email",
        maskedEmail: maskEmail(user.email)
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REVEAL KEY WITH OTP
router.post("/reveal-key", verifyToken, async (req, res) => {
  const { keyId, otp } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.revealOtpCode !== otp || new Date() > user.revealOtpExpires) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    const key = await Key.findOne({ _id: keyId, userId: req.user.id });
    if (!key) return res.status(404).json({ error: "Key not found" });

    key.isRevealed = true;
    await key.save();

    user.revealOtpCode = undefined;
    user.revealOtpExpires = undefined;
    await user.save();

    res.json({ success: true, data: { keyValue: key.keyValue } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET MY REVEALED KEY DIRECTLY (IF ALREADY REVEALED)
router.get("/my-key/:keyId", verifyToken, async (req, res) => {
  try {
    const key = await Key.findOne({ _id: req.params.keyId, userId: req.user.id });
    if (!key) return res.status(404).json({ error: "Key not found" });
    
    if (!key.isRevealed) {
      return res.status(403).json({ error: "Key must be revealed with OTP first" });
    }

    res.json({ success: true, data: { keyValue: key.keyValue } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
