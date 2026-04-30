module.exports = function validateProduct(req, res, next) {
  const { name, game, tab, price } = req.body;

  if (!name || name.length < 3) {
    return res.status(400).json({ error: "Product name is too short" });
  }

  // ENFORCE CLEAN DATA MODEL
  const validGames = ["arc-raiders", "cs2", "delta-force", "windrose"];
  if (!game || !validGames.includes(game.toLowerCase())) {
    return res.status(400).json({ error: `Invalid game. Must be one of: ${validGames.join(', ')}` });
  }

  const validTabs = ["coins", "items", "accounts", "boosting"];
  if (!tab || !validTabs.includes(tab.toLowerCase())) {
     return res.status(400).json({ error: `Invalid tab. Must be one of: ${validTabs.join(', ')}` });
  }

  if (price == null || price <= 0) {
    return res.status(400).json({ error: "Positive price is mandatory" });
  }

  next();
};
