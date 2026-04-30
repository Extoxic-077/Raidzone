const REQUIRED = [
  'MONGO_URI',
  'JWT_SECRET',
  'MAIL_HOST',
  'MAIL_USERNAME',
  'MAIL_PASSWORD',
];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  port:      parseInt(process.env.PORT) || 8080,
  nodeEnv:   process.env.NODE_ENV || 'development',
  isProd:    process.env.NODE_ENV === 'production',

  mongoUri:  process.env.MONGO_URI,
  redisUrl:  process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,

  mail: {
    host:     process.env.MAIL_HOST,
    port:     parseInt(process.env.MAIL_PORT) || 587,
    secure:   process.env.MAIL_SECURE === 'true',
    user:     process.env.MAIL_USERNAME,
    pass:     process.env.MAIL_PASSWORD,
    from:     process.env.MAIL_FROM || process.env.MAIL_USERNAME,
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'https://raidzonemarket.com,https://www.raidzonemarket.com').split(','),
  },
};
