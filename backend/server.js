require('dotenv').config();
const env = require('./config/env');   // validates required vars; exits on failure

const express     = require('express');
const http        = require('http');
const mongoose    = require('mongoose');
const cors        = require('cors');
const compression = require('compression');
const helmet      = require('helmet');
const cookieParser = require('cookie-parser');
const responseTime = require('response-time');
const { Server }  = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');

const { client, pubClient, subClient, connectRedis } = require('./helpers/redis');
const { preloadCatalogCache } = require('./helpers/preload');
const { apiLimiter }          = require('./middleware/rateLimiter');
const { errorHandler }        = require('./middleware/errorHandler');
const routes                  = require('./routes/index');
const path                    = require('path');

const app    = express();
const server = http.createServer(app);

// ── WebSocket ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  path: '/ws/websocket',
  cors: { origin: env.cors.origins, methods: ['GET', 'POST'] },
});
io.adapter(createAdapter(pubClient, subClient));
app.set('io', io);

io.on('connection', socket => {
  socket.on('join', ({ game, tab }) => socket.join(`${game || 'all'}:${tab || 'any'}`));
  socket.on('disconnect', () => socket.removeAllListeners());
});

// ── Core middleware ───────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(responseTime((req, res, time) => {
  if (req.path.startsWith('/api')) console.log(`[${res.statusCode}] ${req.method} ${req.path} ${time.toFixed(0)}ms`);
}));
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cookieParser());
app.use(cors({ origin: env.cors.origins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/', apiLimiter);

// ── Static ────────────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets',  express.static(path.join(__dirname, '../frontend/assets')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.use(express.static(path.resolve(__dirname, '../dist')));
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).end();
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// ── Centralised error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await mongoose.connect(env.mongoUri, { maxPoolSize: 20 });
  console.log('✨ MongoDB connected');

  await connectRedis();
  await preloadCatalogCache();

  server.listen(env.port, '0.0.0.0', () => {
    console.log(`🚀 RaidZone API on port ${env.port} [${env.nodeEnv}]`);
  });
}

start().catch(err => {
  console.error('❌ Startup failed:', err);
  process.exit(1);
});
