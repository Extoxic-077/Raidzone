const { client } = require("../helpers/redis");
const crypto = require("crypto");

/**
 * Builds a scoped cache key based on game, tab, and full query hash.
 */
function buildCacheKey(query) {
  const base = `${query.game || 'all'}:${query.tab || 'any'}`;
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(query))
    .digest("hex");

  return `products:${base}:${hash}`;
}

/**
 * Granular invalidation of product caches for a specific game/tab.
 */
async function invalidateProductCache(game, tab) {
  if (!client.isOpen) return;

  const pattern = `products:${game || '*'}:${tab || '*'}:*`;
  try {
    const keys = [];
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }
    if (keys.length) {
      await client.del(keys);
      console.log(`[CACHE] Invalidated ${keys.length} keys for ${pattern}`);
    }
  } catch (err) {
    console.error("Cache Invalidation Error:", err);
  }
}

module.exports = { buildCacheKey, invalidateProductCache };
