const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// Recursive function to build tree if needed
async function buildTree(parentId = null) {
  const cats = await Category.find({ parentId }).sort({ order: 1 });
  const tree = [];
  for (const cat of cats) {
    const children = await buildTree(cat._id);
    tree.push({
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      children
    });
  }
  return tree;
}

router.get("/", async (req, res) => {
  try {
    const tree = await buildTree(null);
    res.json({ success: true, data: tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/flat", async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ 
      success: true, 
      data: categories.map(c => ({ id: c._id, name: c.name, slug: c.slug }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin", async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
