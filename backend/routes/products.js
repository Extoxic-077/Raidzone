const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const path     = require('path');
const multer   = require('multer');
const Product  = require('../models/Product');
const { verifyToken, requireAdmin }              = require('../middleware/auth');
const { uploadLimiter }                          = require('../middleware/rateLimiter');
const { buildCacheKey, get: cacheGet, setDeferred, invalidateProductCache } = require('../services/cache.service');
const { buildFilter, buildSort, parsePagination, queryProducts } = require('../services/product.service');
const { CACHE_TTL, SAFE_FILTER_KEYS }            = require('../config/constants');
const { client: redisClient }                    = require('../helpers/redis');

const isProd = process.env.NODE_ENV === 'production';
const errMsg = err => isProd ? 'Internal server error' : err.message;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Stampede prevention: in-flight cache writes per key
const lockMap = new Map();

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const start = Date.now();
  let cacheKey;
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sort   = req.query.sort || 'popular';
    const search = req.query.search || '';

    if (page > 1000) return res.status(400).json({ success: false, error: 'Invalid page depth', code: 'VALIDATION_ERROR' });

    const gameSlug = req.query.game || req.query.categorySlug;
    const isCacheable = page <= 10 && (!search || search.length < 30);
    cacheKey = buildCacheKey({ ...req.query, game: gameSlug });

    if (isCacheable) {
      const cached = await cacheGet(cacheKey);
      if (cached) return res.set('X-Cache', 'HIT').json(cached);

      // Stampede lock
      if (lockMap.has(cacheKey)) {
        await new Promise(r => setTimeout(r, 100));
        const retry = await cacheGet(cacheKey);
        if (retry) return res.set('X-Cache', 'HIT').json(retry);
      }
      lockMap.set(cacheKey, Date.now());
    }

    const filter  = buildFilter(req.query);
    const sortObj = buildSort(sort);
    const { products, total } = await queryProducts(filter, sortObj, skip, limit);

    const result = {
      success: true,
      data: {
        content:       products,
        totalElements: total,
        totalPages:    Math.ceil(total / limit),
        number:        page,
        page,
        limit,
        responseTime:  Date.now() - start,
      },
    };

    if (isCacheable) {
      setDeferred(cacheKey, result, CACHE_TTL.PRODUCT_LIST);
      lockMap.delete(cacheKey);
    }

    res.set('X-Cache', 'MISS').json(result);
  } catch (err) {
    if (cacheKey) lockMap.delete(cacheKey);
    console.error('[PRODUCT_LIST]', err.message);
    if (err.name === 'MaxTimeMSExpired') return res.status(503).json({ success: false, error: 'System busy', code: 'INTERNAL_ERROR' });
    res.status(500).json({ success: false, error: errMsg(err), code: 'INTERNAL_ERROR' });
  }
});

// ── Named routes (must precede /:id) ─────────────────────────────────────────

router.get('/featured', async (req, res, next) => {
  try {
    const products = await Product.find({ active: true, badge: { $exists: true, $ne: '' } })
      .sort({ createdAt: -1 }).limit(8).lean();
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

router.get('/flash-deals', async (req, res, next) => {
  try {
    const products = await Product.find({ active: true, isFlashDeal: true })
      .sort({ createdAt: -1 }).limit(8).lean();
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

router.get('/init', async (req, res, next) => {
  try {
    const { game, tab } = req.query;
    const db = mongoose.connection.db;

    // Available games (long-TTL cache)
    let availableGames = await cacheGet('available_games') || [];
    if (!availableGames.length) {
      availableGames = await Product.distinct('game', { active: true });
      setDeferred('available_games', availableGames, CACHE_TTL.AVAILABLE_GAMES);
    }

    if (!game) return res.json({ success: true, data: { availableGames } });
    if (!availableGames.includes(game)) {
      return res.status(400).json({ success: false, error: 'Invalid game', code: 'VALIDATION_ERROR' });
    }

    const { escapeRegex } = require('../services/product.service');
    const filter = { game, active: true };
    if (tab) filter.tab = new RegExp('^' + escapeRegex(tab) + '$', 'i');

    const [filterConfig, products, total] = await Promise.all([
      db.collection('filterconfigs').findOne({ game, tab: tab || null }),
      Product.find(filter).sort({ views: -1, createdAt: -1 }).limit(500).lean(),
      Product.countDocuments(filter),
    ]);

    const filters = filterConfig?.filters || [];
    const bulkOptions = {};

    await Promise.all(filters.map(async f => {
      if (!SAFE_FILTER_KEYS.has(f.key) && !f.key.startsWith('attr_')) return;
      const optKey = `opt:${game}:${tab || 'any'}:${f.key}`;
      const cached = await cacheGet(optKey);
      if (cached) { bulkOptions[f.key] = cached; return; }
      const values = await Product.distinct(`attributes.${f.key}`, filter);
      const clean  = values.filter(v => v != null && v !== '').sort();
      bulkOptions[f.key] = clean;
      setDeferred(optKey, clean, CACHE_TTL.FILTER_OPTIONS);
    }));

    res.json({ success: true, data: { filters, products, options: bulkOptions, total, availableGames } });
  } catch (err) { next(err); }
});

router.get('/options', async (req, res, next) => {
  try {
    const { key, game, tab } = req.query;
    if (!key) return res.status(400).json({ success: false, error: 'Missing key', code: 'VALIDATION_ERROR' });
    if (!SAFE_FILTER_KEYS.has(key) && !key.startsWith('attr_')) {
      return res.status(400).json({ success: false, error: 'Invalid key', code: 'VALIDATION_ERROR' });
    }

    const cacheKey = `opt:${game || 'any'}:${tab || 'any'}:${key}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const { escapeRegex } = require('../services/product.service');
    const filter = {};
    if (game) filter.game = game;
    if (tab)  filter.tab  = new RegExp('^' + escapeRegex(tab) + '$', 'i');

    const [legacy, attrs] = await Promise.all([
      Product.distinct(key, filter),
      Product.distinct(`attributes.${key}`, filter),
    ]);
    const all = [...new Set([...legacy, ...attrs])].filter(v => v != null && v !== '').sort();
    setDeferred(cacheKey, all, CACHE_TTL.FILTER_OPTIONS);
    res.json({ success: true, data: all });
  } catch (err) { next(err); }
});

router.get('/options-bulk', async (req, res, next) => {
  try {
    const { game, tab, keys } = req.query;
    if (!keys) return res.status(400).json({ success: false, error: 'Missing keys', code: 'VALIDATION_ERROR' });

    const bulkKey = `bulk_opt:${game || 'any'}:${tab || 'any'}:${keys}`;
    const cached  = await cacheGet(bulkKey);
    if (cached) return res.json({ success: true, data: cached });

    const { escapeRegex } = require('../services/product.service');
    const keyList = keys.split(',').slice(0, 20);
    const filter  = {};
    if (game) filter.game = game;
    if (tab)  filter.tab  = new RegExp('^' + escapeRegex(tab) + '$', 'i');

    const result = {};
    await Promise.all(keyList.map(async key => {
      if (!SAFE_FILTER_KEYS.has(key) && !key.startsWith('attr_')) return;
      const [legacy, attrs] = await Promise.all([
        Product.distinct(key, filter),
        Product.distinct(`attributes.${key}`, filter),
      ]);
      result[key] = [...new Set([...legacy, ...attrs])].filter(v => v != null && v !== '').sort();
    }));

    setDeferred(bulkKey, result, CACHE_TTL.FILTER_OPTIONS);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── Admin CRUD ────────────────────────────────────────────────────────────────

router.post('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const data = { ...req.body };
    // Normalise: Move dynamic fields to attributes
    data.attributes = {
      ...(data.attributes || {}),
      itemType: data.itemType || data.attributes?.itemType,
      subType:  data.subType  || data.attributes?.subType,
      region:   data.region   || data.attributes?.region,
      brand:    data.brand    || data.attributes?.brand
    };
    const product = await new Product(data).save();
    await invalidateProductCache(product.game, product.tab);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.itemType || data.subType || data.region || data.brand) {
      data.attributes = {
        ...(data.attributes || {}),
        itemType: data.itemType || data.attributes?.itemType,
        subType:  data.subType  || data.attributes?.subType,
        region:   data.region   || data.attributes?.region,
        brand:    data.brand    || data.attributes?.brand
      };
    }
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    await invalidateProductCache(product.game, product.tab);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    await invalidateProductCache(product.game, product.tab);
    await product.deleteOne();
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/image', verifyToken, requireAdmin, uploadLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded', code: 'VALIDATION_ERROR' });
    const imageUrl = `/uploads/${req.file.filename}`;
    const product  = await Product.findByIdAndUpdate(req.params.id, { imageUrl }, { new: true });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    await invalidateProductCache(product.game, product.tab);
    res.json({ success: true, data: { imageUrl } });
  } catch (err) { next(err); }
});

// ── GET by slug / id ──────────────────────────────────────────────────────────

router.get('/slug/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

module.exports = router;
