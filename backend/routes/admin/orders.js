const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const { verifyToken, requireAdmin } = require("../../middleware/auth");

router.get("/", verifyToken, requireAdmin, async (req, res) => {
  const { status, size = 10, page = 1 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  try {
    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(size))
      .skip((Number(page) - 1) * Number(size));
      
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/status", verifyToken, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
