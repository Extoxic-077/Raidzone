const router  = require('express').Router();
const Order   = require('../../models/Order');
const User    = require('../../models/User');
const Product = require('../../models/Product');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

router.use(verifyToken, requireAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const [totalOrders, totalUsers, totalProducts, revenue] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { status: 'CONFIRMED' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);
    res.json({
      success: true,
      data: { totalOrders, totalUsers, totalProducts, totalRevenue: revenue[0]?.total || 0 },
    });
  } catch (err) { next(err); }
});

router.get('/analytics', verifyToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      recentSales: [
        { date: '2026-04-23', amount: 2800 },
        { date: '2026-04-24', amount: 4200 },
        { date: '2026-04-25', amount: 3900 },
        { date: '2026-04-26', amount: 5120 },
        { date: '2026-04-27', amount: 4750 },
        { date: '2026-04-28', amount: 6300 },
        { date: '2026-04-29', amount: 5800 },
      ],
      userGrowth: [100, 120, 150, 180, 210, 250, 310],
    },
  });
});

router.get('/analytics/realtime', (req, res) => {
  res.json({
    success: true,
    data: { activeUsers: Math.floor(Math.random() * 50) + 10, currentSalesToday: 1240 },
  });
});

router.get('/payments', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, method: 'Stripe',  amount: 1500, status: 'Completed', date: new Date() },
      { id: 2, method: 'PayPal',  amount: 800,  status: 'Pending',   date: new Date() },
    ],
  });
});

router.get('/categories', async (req, res, next) => {
  try {
    const Category = require('../../models/Category');
    const categories = await Category.find().sort({ order: 1 });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

router.get('/companies', async (req, res, next) => {
  try {
    const Company = require('../../models/Company');
    res.json({ success: true, data: await Company.find().sort({ name: 1 }) });
  } catch (err) { next(err); }
});

module.exports = router;
