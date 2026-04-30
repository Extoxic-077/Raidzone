const express = require("express");
const router = express.Router();
const FilterConfig = require("../../models/FilterConfig");
const { verifyToken, requireAdmin } = require("../../middleware/auth");
const { client } = require("../../helpers/redis");

/**
 * ==============================================================================
 * DYNAMIC FILTER ADMIN ENGINE (AtoZ)
 * ==============================================================================
 */

router.use(verifyToken, requireAdmin);

async function invalidateCache() {
  if (!client.isOpen) return;
  const keys = [];
  for await (const key of client.scanIterator({ MATCH: 'products:*', COUNT: 100 })) {
    keys.push(key);
  }
  if (keys.length > 0) await client.del(keys);
}

// GET ALL CONFIGS
router.get("/configs", async (req, res) => {
  try {
    const configs = await FilterConfig.find().sort({ game: 1, tab: 1 });
    res.json({ success: true, data: configs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SPECIFIC CONFIG
router.get("/config", async (req, res) => {
  const { game, tab } = req.query;
  const config = await FilterConfig.findOne({ game, tab });
  res.json({ success: true, data: config });
});

// SAVE/UPDATE CONFIG
router.post("/config", async (req, res) => {
  try {
    const { game, tab, filters } = req.body;
    if (!game || !tab) return res.status(400).json({ error: "Missing game/tab" });

    const config = await FilterConfig.findOneAndUpdate(
      { game, tab: tab.toLowerCase() },
      { game, tab: tab.toLowerCase(), filters },
      { upsert: true, new: true }
    );

    await invalidateCache();
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE CONFIG
router.delete("/config/:id", async (req, res) => {
  await FilterConfig.findByIdAndDelete(req.params.id);
  await invalidateCache();
  res.json({ success: true, message: "Filter configuration deleted" });
});

module.exports = router;
