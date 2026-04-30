const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id }).populate('products');
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.id, products: [] });
      await wishlist.save();
    }
    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:productId/toggle", verifyToken, async (req, res) => {
  const { productId } = req.params;
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) wishlist = new Wishlist({ userId: req.user.id, products: [] });

    const index = wishlist.products.indexOf(productId);
    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push(productId);
    }
    await wishlist.save();
    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:productId/status", verifyToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    const inWishlist = wishlist ? wishlist.products.includes(req.params.productId) : false;
    res.json({ success: true, data: inWishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/count", verifyToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    res.json({ success: true, data: wishlist ? wishlist.products.length : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
