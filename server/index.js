import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import db from './db/index.js';
import logger from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimit.js';

import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import categoriesRoutes from './routes/categories.js';
import tagsRoutes from './routes/tags.js';
import settingsRoutes from './routes/settings.js';
import backupRoutes from './routes/backup.js';
import healthRoutes from './routes/health.js';
import iconsRoutes from './routes/icons.js';
import proxmoxRoutes from './routes/proxmox.js';
import systemRoutes from './routes/system.js';
import uploadRoutes from './routes/upload.js';
import scannerRoutes from './routes/scanner.js';

import { verifyCsrfOrigin } from './middleware/auth.js';
import HealthCheckService from './services/healthCheck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Trust Proxy Configuration (safe for Docker, LXC, and reverse proxies like Nginx / Cloudflare)
if (config.TRUST_PROXY) {
  app.set('trust proxy', config.TRUST_PROXY);
}

// 2. Comprehensive Security Headers with Content Security Policy (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true
  })
);

// 3. CORS Configuration with Allowlist
const corsOrigins = config.CORS_ORIGINS;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      if (corsOrigins.length === 0 || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In local dev, allow localhost
      if (config.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// 4. Global Rate Limiter
app.use('/api', globalLimiter);

// 5. Body Parsers with safe small limits (1MB default)
app.use('/api/backup/import', express.json({ limit: '20mb' })); // Specific limit for backup restore
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Cookie Parser Middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length === 2) {
        req.cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
      }
    });
  }
  next();
});

// 7. CSRF Origin Verification on mutating API endpoints
app.use('/api', verifyCsrfOrigin);

// 8. Controlled & Secure Static Uploads Serving
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    next();
  },
  express.static(uploadsDir)
);

// 8. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/icons', iconsRoutes);
app.use('/api/proxmox', proxmoxRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/scanner', scannerRoutes);

// 9. Static Frontend SPA Serving
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 10. Centralized Production Error Handler
app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();
  logger.error(`[Error ID: ${errorId}] Unhandled request error:`, err);

  if (config.NODE_ENV === 'production') {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      errorId
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      errorId,
      stack: err.stack
    });
  }
});

// 11. Start Background Health Check Service & listen when run directly
const isDirectRun = process.argv[1] && (
  process.argv[1] === __filename || 
  process.argv[1].endsWith('server/index.js') || 
  process.argv[1].endsWith('server\\index.js')
);

if (isDirectRun) {
  const healthChecker = new HealthCheckService(db);
  healthChecker.start();

  app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`NexusPanel server is running on port ${config.PORT} (0.0.0.0) [NODE_ENV=${config.NODE_ENV}]`);
  });
}

export default app;
