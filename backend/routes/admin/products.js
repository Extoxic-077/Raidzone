const router  = require('express').Router();
const Product = require('../../models/Product');
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const { invalidateProductCache } = require('../../services/cache.service');

router.use(verifyToken, requireAdmin);

// POST /admin/products/bulk-toggle-active — must come before /:id routes
router.post('/bulk-toggle-active', async (req, res, next) => {
  try {
    const { productIds, isActive } = req.body;
    if (!Array.isArray(productIds) || !productIds.length || typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'productIds (non-empty array) and isActive (boolean) required', code: 'VALIDATION_ERROR' });
    }
    await Product.updateMany({ _id: { $in: productIds } }, { active: isActive });
    res.json({ success: true, data: { updated: productIds.length } });
  } catch (err) { next(err); }
});

// PATCH /admin/products/:id/toggle-active
router.patch('/:id/toggle-active', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    product.active = !product.active;
    await product.save();
    await invalidateProductCache(product.game, product.tab);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// PATCH /admin/products/:id/toggle-flash-deal
router.patch('/:id/toggle-flash-deal', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    product.isFlashDeal = !product.isFlashDeal;
    await product.save();
    await invalidateProductCache(product.game, product.tab);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// PATCH /admin/products/:id/badge
router.patch('/:id/badge', async (req, res, next) => {
  try {
    const { badge } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { badge: badge || '' }, { new: true });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    await invalidateProductCache(product.game, product.tab);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

module.exports = router;
