import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import db from './db/index.js';
import { HealthCheckService } from './services/healthCheck.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "http:", "https:", "blob:"],
      connectSrc: ["'self'", "http:", "https:"],
    }
  }
}));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded media
app.use('/uploads', express.static(uploadsDir));

// Custom simple cookie parser middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts.shift().trim();
      const value = decodeURI(parts.join('='));
      req.cookies[name] = value;
    });
  }
  next();
});

// API Routes
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

// Static files handling for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start background services
const healthChecker = new HealthCheckService(db);
healthChecker.start();

app.listen(config.PORT, () => {
  console.log(`NexusPanel server is running on port ${config.PORT}`);
});
