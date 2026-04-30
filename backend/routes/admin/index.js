const router = require('express').Router();

router.use('/',         require('./dashboard'));
router.use('/users',    require('./users'));
router.use('/products', require('./products'));
router.use('/orders',   require('./orders'));
router.use('/filters',  require('../admin/filters'));
router.use('/system',   require('./system'));

module.exports = router;
