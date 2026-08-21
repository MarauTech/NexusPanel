import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// Production secret enforcement
let jwtSecret = process.env.JWT_SECRET;
const INSECURE_DEFAULTS = [
  'nexuspanel-dev-secret-change-me',
  'change-me-to-a-random-secret-key',
  'secret',
  'password',
  '123456'
];

if (isProd) {
  if (!jwtSecret || INSECURE_DEFAULTS.includes(jwtSecret) || jwtSecret.length < 32) {
    console.error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set in production to a secure random string of at least 32 characters.');
    process.exit(1);
  }
} else {
  if (!jwtSecret || INSECURE_DEFAULTS.includes(jwtSecret)) {
    jwtSecret = 'nexuspanel-dev-secret-change-me-for-local-testing-only-32chars!';
  }
}

const config = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  DB_PATH: process.env.DB_PATH || './data/nexuspanel.db',
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 60,
  
  // Rate Limits
  RATE_LIMIT_LOGIN_MAX: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5,
  RATE_LIMIT_LOGIN_WINDOW_MINS: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MINS, 10) || 15,
  RATE_LIMIT_GLOBAL_MAX: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10) || 600,
  RATE_LIMIT_SCANNER_MAX: parseInt(process.env.RATE_LIMIT_SCANNER_MAX, 10) || 10,
  RATE_LIMIT_BACKUP_MAX: parseInt(process.env.RATE_LIMIT_BACKUP_MAX, 10) || 5,
  RATE_LIMIT_UPLOAD_MAX: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX, 10) || 20,

  // CORS & Network Security
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : [],
  TRUST_PROXY: process.env.TRUST_PROXY || 'loopback, linklocal, uniquelocal',
  ALLOWED_NETWORKS: process.env.ALLOWED_NETWORKS || '192.168.0.0/16,10.0.0.0/8,172.16.0.0/12',
  
  // Security
  UPLOAD_MAX_SIZE_MB: parseInt(process.env.UPLOAD_MAX_SIZE_MB, 10) || 10,
  SEED_DEMO_DATA: process.env.SEED_DEMO_DATA === 'true'
};

export default config;
