const redis = require("redis");

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ─── PRIMARY CLIENT (Caching) ────────────────────────────────────────────────
const client = redis.createClient({ url: REDIS_URL });

// ─── PUB/SUB CLIENTS (WebSocket Scaling) ─────────────────────────────────────
const pubClient = client.duplicate();
const subClient = client.duplicate();

client.on('error', (err) => console.error('🔴 Redis Cache Client Error', err));
pubClient.on('error', (err) => console.error('🔴 Redis Pub Client Error', err));
subClient.on('error', (err) => console.error('🔴 Redis Sub Client Error', err));

async function connectRedis() {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log('✨ Redis Cache Connected');
    }
    if (!pubClient.isOpen) {
      await pubClient.connect();
      console.log('✨ Redis Pub Connected');
    }
    if (!subClient.isOpen) {
      await subClient.connect();
      console.log('✨ Redis Sub Connected');
    }
  } catch (err) {
    console.error('❌ Redis Connection Failed:', err);
    // Graceful degradation: The application will continue without Redis
  }
}

module.exports = { 
  client, 
  pubClient, 
  subClient, 
  connectRedis 
};
