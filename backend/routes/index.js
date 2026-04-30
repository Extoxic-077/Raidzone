const router = require('express').Router();

// Public
router.use('/products',      require('./products'));
router.use('/auth',          require('./auth').router);
router.use('/categories',    require('./categories'));
router.use('/companies',     require('./companies'));
router.use('/filters',       require('./filters'));

// Authenticated
router.use('/orders',        require('./orders'));
router.use('/purchases',     require('./purchases'));
router.use('/cart',          require('./cart'));
router.use('/wishlist',      require('./wishlist'));
router.use('/notifications', require('./notifications'));

// Admin
router.use('/admin',         require('./admin/index'));

// Static activity feed
router.get('/public/activity', (req, res) => {
  res.json({
    success: true,
    data: [
      { customerName: 'Alex M.',  productName: '1,000,000 Arc Raiders Coins', createdAt: new Date() },
      { customerName: 'Sarah J.', productName: 'Extended Light Magazine III', createdAt: new Date() },
    ],
  });
});

module.exports = router;
