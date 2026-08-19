export default {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'nexuspanel-dev-secret-change-me',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  DB_PATH: process.env.DB_PATH || './data/nexuspanel.db',
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 60,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 5,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15,
  SEED_DEMO_DATA: process.env.SEED_DEMO_DATA === 'true'
};
