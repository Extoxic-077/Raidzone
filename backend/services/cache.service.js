const { client } = require('../helpers/redis');
const crypto = require('crypto');
const { CACHE_TTL } = require('../config/constants');

function buildCacheKey(query) {
  const base = `${query.game || 'all'}:${query.tab || 'any'}`;
  const hash = crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
  return `products:${base}:${hash}`;
}

async function get(key) {
  if (!client.isOpen) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function set(key, value, ttl = CACHE_TTL.PRODUCT_LIST) {
  if (!client.isOpen) return;
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch {
    // Redis write failure is non-fatal
  }
}

async function setDeferred(key, value, ttl = CACHE_TTL.PRODUCT_LIST) {
  setImmediate(() => set(key, value, ttl));
}

async function scanDelete(pattern) {
  if (!client.isOpen) return 0;
  const keys = [];
  for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(key);
  }
  if (keys.length) await client.del(keys);
  return keys.length;
}

async function invalidateProductCache(game, tab) {
  const pattern = `products:${game || '*'}:${tab || '*'}:*`;
  try {
    const n = await scanDelete(pattern);
    if (n) console.log(`[CACHE] Invalidated ${n} keys for ${pattern}`);
  } catch (err) {
    console.error('[CACHE] Invalidation error:', err.message);
  }
}

async function invalidateAllProductCaches() {
  await scanDelete('products:*');
}

module.exports = { buildCacheKey, get, set, setDeferred, invalidateProductCache, invalidateAllProductCaches };
