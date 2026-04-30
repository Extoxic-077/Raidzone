const express = require("express");
const router = express.Router();

// Mock companies for storefront compatibility
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: [
      { id: "steam", name: "Steam", slug: "steam" },
      { id: "xbox", name: "Xbox", slug: "xbox" },
      { id: "riot", name: "Riot Games", slug: "riot" }
    ]
  });
});

module.exports = router;
