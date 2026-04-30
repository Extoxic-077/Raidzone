const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { verifyToken } = require("../middleware/auth");

// CREATE ORDER
router.post("/", verifyToken, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user.id
    };
    
    const order = new Order(orderData);
    await order.save();
    
    res.json({ success: true, data: order });
  } catch (err) {
    console.error('[API] Create Order Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET MY ORDERS
router.get("/my", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SINGLE ORDER
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
