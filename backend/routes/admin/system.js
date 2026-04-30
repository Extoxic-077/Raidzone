const router   = require('express').Router();
const mongoose = require('mongoose');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

router.use(verifyToken, requireAdmin);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status:      'ok',
      uptime:      process.uptime(),
      memoryMB:    Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      mongoState:  mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

router.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    success: true,
    data: {
      heapUsedMB:  Math.round(mem.heapUsed  / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB:       Math.round(mem.rss       / 1024 / 1024),
      uptimeSec:   Math.round(process.uptime()),
    },
  });
});

router.get('/db-stats', async (req, res, next) => {
  try {
    const stats = await mongoose.connection.db.stats();
    res.json({
      success: true,
      data: {
        collections:  stats.collections,
        dataSizeBytes: stats.dataSize,
        storageSizeBytes: stats.storageSize,
        indexes:      stats.indexes,
        avgObjSize:   stats.avgObjSize,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
