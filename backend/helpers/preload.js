const { client } = require("../helpers/redis");
const Product = require("../models/Product");
const { buildCacheKey } = require("./cache");

/**
 * Pre-warms the Redis cache with popular queries to ensure first-load speed.
 */
async function preloadCatalogCache() {
  if (!client.isOpen) return;

  const popularQueries = [
    { game: "arc-raiders", tab: "coins", sort: "popular", page: 1, limit: 20 },
    { game: "arc-raiders", tab: "items", sort: "popular", page: 1, limit: 20 },
    { game: "cs2", tab: "accounts", sort: "popular", page: 1, limit: 20 },
    { game: "windrose", tab: "currency", sort: "popular", page: 1, limit: 20 }
  ];

  console.log("🔥 Pre-warming catalog cache...");

  for (const q of popularQueries) {
    try {
      const key = buildCacheKey(q);
      
      const filter = { 
        game: q.game, 
        tab: new RegExp("^" + q.tab + "$", "i"), 
        active: true 
      };

      const products = await Product.find(filter)
        .sort({ views: -1, _id: -1 })
        .limit(20)
        .select("name price originalPrice imageUrl slug badge stock subType itemType game attributes")
        .lean();

      const total = await Product.countDocuments(filter);

      const result = {
        success: true,
        data: {
          content: products,
          totalElements: total,
          totalPages: Math.ceil(total / 20),
          number: 1,
          page: 1,
          limit: 20,
          cachedAt: new Date().toISOString(),
          preloaded: true
        }
      };

      await client.setEx(key, 3600, JSON.stringify(result)); // Cache preloads for 1 hour
      console.log(`✅ Cached: ${key}`);
    } catch (err) {
      console.error(`❌ Failed to preload ${q.game}:${q.tab}:`, err);
    }
  }

  console.log("⚡ Catalog cache pre-warmed successfully!");
}

module.exports = { preloadCatalogCache };
