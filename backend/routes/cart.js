const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const { verifyToken } = require("../middleware/auth");

// GET CART
router.get("/", verifyToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }
    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CART COUNT
router.get("/count", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    const count = cart ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
    res.json({ success: true, data: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD TO CART
router.post("/items", verifyToken, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

    const existing = cart.items.find(item => item.productId && item.productId.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE QUANTITY
router.put("/items/:productId", verifyToken, async (req, res) => {
  const { quantity } = req.body;
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      const item = cart.items.find(i => i.productId && i.productId.toString() === req.params.productId);
      if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
          cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
        }
        await cart.save();
      }
    }
    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE FROM CART
router.delete("/items/:productId", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = cart.items.filter(item => item.productId && item.productId.toString() !== req.params.productId);
      await cart.save();
    }
    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
