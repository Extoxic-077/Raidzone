const express = require("express");
const router = express.Router();
const FilterConfig = require("../models/FilterConfig");
const { verifyToken, requireAdmin } = require("../middleware/auth");

/**
 * GET /api/filters
 * Returns the filter configuration for a specific game/tab
 */
router.get("/", async (req, res) => {
  try {
    const { game, tab } = req.query;
    if (!game || !tab) return res.status(400).json({ error: "Missing game or tab" });

    const config = await FilterConfig.findOne({ 
      game, 
      tab: new RegExp("^" + tab + "$", "i") 
    });

    if (!config) {
      // Default fallback if no config exists
      return res.json({ 
        success: true, 
        data: { filters: [] } 
      });
    }

    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/filters
 * (ADMIN ONLY) Create or update filter config
 */
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { game, tab, filters } = req.body;
    if (!game || !tab) return res.status(400).json({ error: "Missing game or tab" });

    const config = await FilterConfig.findOneAndUpdate(
      { game, tab: tab.toLowerCase() },
      { game, tab: tab.toLowerCase(), filters },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
