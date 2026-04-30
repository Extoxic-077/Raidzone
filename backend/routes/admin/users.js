const router = require('express').Router();
const User   = require('../../models/User');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

router.use(verifyToken, requireAdmin);

// GET /admin/users?page=0&limit=20
router.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 0, 0);
    const limit = Math.min(Math.max(parseInt(req.query.limit || req.query.size) || 20, 1), 100);
    const skip  = page * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

// PUT /admin/users/:id/role
router.put('/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, error: 'role must be USER or ADMIN', code: 'VALIDATION_ERROR' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PUT /admin/users/:id/status  — body: { isActive: bool }
router.put('/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive must be boolean', code: 'VALIDATION_ERROR' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { active: isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// DELETE /admin/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
