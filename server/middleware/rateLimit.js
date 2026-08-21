import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

// Login brute-force limiter (5 attempts per 15 minutes by default)
export const loginLimiter = rateLimit({
  windowMs: (config.RATE_LIMIT_LOGIN_WINDOW_MINS || 15) * 60 * 1000,
  max: config.RATE_LIMIT_LOGIN_MAX || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP. Please try again after 15 minutes.' }
});

// Network scanner limiter (10 scans per 5 minutes)
export const scannerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: config.RATE_LIMIT_SCANNER_MAX || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Scan rate limit exceeded. Please wait before scanning again.' }
});

// Backup import / factory reset limiter (5 attempts per 5 minutes)
export const backupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: config.RATE_LIMIT_BACKUP_MAX || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Backup operation rate limit exceeded.' }
});

// File upload limiter (20 uploads per 5 minutes)
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: config.RATE_LIMIT_UPLOAD_MAX || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit exceeded.' }
});

// Global API rate limiter (600 requests per minute)
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: config.RATE_LIMIT_GLOBAL_MAX || 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});
