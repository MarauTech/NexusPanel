import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin, requireAuthUnlessFirstRun } from '../middleware/auth.js';
import { backupLimiter } from '../middleware/rateLimit.js';
import { recordAudit } from '../utils/audit.js';
import { initializeDefaultSettings } from '../db/schema.js';

const router = express.Router();

const SENSITIVE_SETTINGS_EXPORT_BLOCKLIST = ['jwt_secret', 'admin_password'];

/**
 * GET /api/backup/export
 * Exports dashboard services, categories, tags, and appearance settings as JSON
 */
router.get('/export', authenticateToken, requireAdmin, (req, res) => {
  try {
    const categories = db.prepare('SELECT id, name, icon, color, sort_order FROM categories ORDER BY sort_order ASC').all();
    const services = db.prepare('SELECT id, name, description, url, category_id, icon, icon_type, color, sort_order, open_new_tab, enabled, favorite, health_check_enabled, health_check_url, health_check_interval, health_check_type, custom_badge, notes FROM services ORDER BY sort_order ASC').all();
    const tags = db.prepare('SELECT id, name, color FROM tags').all();
    const serviceTags = db.prepare('SELECT service_id, tag_id FROM service_tags').all();
    
    // Export non-sensitive settings only
    const settingsRows = db.prepare('SELECT key, value, type FROM settings').all();
    const settings = settingsRows.filter(s => !SENSITIVE_SETTINGS_EXPORT_BLOCKLIST.includes(s.key));
    const widgetConfigs = db.prepare('SELECT widget_type, config_json, sort_order, enabled FROM widget_configs').all();

    const data = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      generator: 'NexusPanel',
      categories,
      services,
      tags,
      service_tags: serviceTags,
      settings,
      widget_configs: widgetConfigs
    };

    recordAudit({ event: 'BACKUP_EXPORT', userId: req.user.id, username: req.user.username, ip: req.ip });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=nexuspanel-backup-${Date.now()}.json`);
    res.json(data);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export backup' });
  }
});

/**
 * POST /api/backup/import
 * Atomic, validated restore of dashboard configuration
 */
router.post('/import', backupLimiter, requireAuthUnlessFirstRun, (req, res) => {
  const data = req.body;

  // Strict JSON and prototype pollution protection
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.prototype.hasOwnProperty.call(data, '__proto__')) {
    return res.status(400).json({ error: 'Invalid backup file payload' });
  }

  if (!Array.isArray(data.categories) || !Array.isArray(data.services)) {
    return res.status(400).json({ error: 'Invalid backup file structure: missing categories or services list' });
  }

  // Max entity limits to prevent memory exhaustion DoS
  if (data.categories.length > 500 || data.services.length > 2000) {
    return res.status(400).json({ error: 'Backup payload exceeds maximum entity limits' });
  }

  try {
    db.transaction(() => {
      // 1. Wipe existing dashboard entities
      db.exec(`
        DELETE FROM service_tags;
        DELETE FROM service_health_history;
        DELETE FROM services;
        DELETE FROM categories;
        DELETE FROM tags;
        DELETE FROM widget_configs;
      `);

      // 2. Insert categories and build ID map
      const insertCat = db.prepare(`
        INSERT INTO categories (name, icon, color, sort_order, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
      
      const categoryIdMap = {};
      for (const cat of data.categories) {
        if (!cat || typeof cat !== 'object') continue;
        const result = insertCat.run(
          String(cat.name || 'Category').slice(0, 100),
          String(cat.icon || 'folder').slice(0, 50),
          String(cat.color || '#6366f1').slice(0, 20),
          parseInt(cat.sort_order, 10) || 0
        );
        if (cat.id) {
          categoryIdMap[cat.id] = result.lastInsertRowid;
        }
      }

      // 3. Insert tags and build ID map
      const insertTag = db.prepare(`
        INSERT INTO tags (name, color)
        VALUES (?, ?)
      `);
      const tagIdMap = {};
      if (Array.isArray(data.tags)) {
        for (const tag of data.tags) {
          if (!tag || typeof tag !== 'object') continue;
          const result = insertTag.run(
            String(tag.name || '').toLowerCase().slice(0, 50),
            String(tag.color || '#6366f1').slice(0, 20)
          );
          if (tag.id) {
            tagIdMap[tag.id] = result.lastInsertRowid;
          }
        }
      }

      // 4. Insert services
      const insertSvc = db.prepare(`
        INSERT INTO services (
          name, description, url, category_id, icon, icon_type, icon_url, color, 
          sort_order, open_new_tab, enabled, favorite, health_check_enabled, 
          health_check_url, health_check_interval, health_check_type, health_status, 
          custom_badge, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unknown', ?, ?, datetime('now'), datetime('now'))
      `);

      const serviceIdMap = {};
      for (const svc of data.services) {
        if (!svc || typeof svc !== 'object' || !svc.name || !svc.url) continue;
        const newCatId = svc.category_id ? (categoryIdMap[svc.category_id] || null) : null;
        
        const result = insertSvc.run(
          String(svc.name).slice(0, 100),
          String(svc.description || '').slice(0, 500),
          String(svc.url).slice(0, 500),
          newCatId,
          String(svc.icon || 'globe').slice(0, 50),
          String(svc.icon_type || 'lucide').slice(0, 20),
          String(svc.icon_url || '').slice(0, 500),
          String(svc.color || '#6366f1').slice(0, 20),
          parseInt(svc.sort_order, 10) || 0,
          svc.open_new_tab !== 0 ? 1 : 0,
          svc.enabled !== 0 ? 1 : 0,
          svc.favorite === 1 ? 1 : 0,
          svc.health_check_enabled === 1 ? 1 : 0,
          String(svc.health_check_url || '').slice(0, 500),
          parseInt(svc.health_check_interval, 10) || 60,
          String(svc.health_check_type || 'http').slice(0, 20),
          String(svc.custom_badge || '').slice(0, 50),
          String(svc.notes || '').slice(0, 1000)
        );
        if (svc.id) {
          serviceIdMap[svc.id] = result.lastInsertRowid;
        }
      }

      // 5. Insert service_tags
      if (Array.isArray(data.service_tags)) {
        const insertServiceTag = db.prepare('INSERT OR IGNORE INTO service_tags (service_id, tag_id) VALUES (?, ?)');
        for (const st of data.service_tags) {
          if (!st) continue;
          const newSvcId = serviceIdMap[st.service_id];
          const newTagId = tagIdMap[st.tag_id];
          if (newSvcId && newTagId) {
            insertServiceTag.run(newSvcId, newTagId);
          }
        }
      }

      // 6. Import settings (never overwrite security credentials)
      const BLOCKED_SETTINGS = ['setup_completed', 'jwt_secret', 'admin_password'];
      const insertSetting = db.prepare(`
        INSERT INTO settings (key, value, type) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);

      if (Array.isArray(data.settings)) {
        for (const s of data.settings) {
          if (!s || !s.key || BLOCKED_SETTINGS.includes(s.key)) continue;
          insertSetting.run(String(s.key).slice(0, 100), String(s.value || '').slice(0, 5000), String(s.type || 'string').slice(0, 20));
        }
      }
    })();

    recordAudit({
      event: 'BACKUP_IMPORT',
      userId: req.user?.id || null,
      username: req.user?.username || 'first-run',
      ip: req.ip,
      details: { serviceCount: data.services.length, categoryCount: data.categories.length }
    });

    res.json({
      success: true,
      message: 'Configuration imported successfully',
      imported: {
        categories: data.categories.length,
        services: data.services.length
      }
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
});

/**
 * POST /api/backup/factory-reset
 * Danger zone: completely resets the database to a fresh clean state
 */
router.post('/factory-reset', backupLimiter, authenticateToken, requireAdmin, (req, res) => {
  try {
    db.transaction(() => {
      db.exec(`
        DELETE FROM service_tags;
        DELETE FROM service_health_history;
        DELETE FROM services;
        DELETE FROM categories;
        DELETE FROM tags;
        DELETE FROM settings;
        DELETE FROM widget_configs;
        DELETE FROM users;
      `);
      initializeDefaultSettings(db);
    })();

    recordAudit({
      event: 'FACTORY_RESET',
      userId: req.user.id,
      username: req.user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Factory reset complete. Dashboard has been reset to initial state.'
    });
  } catch (err) {
    console.error('Factory reset error:', err);
    res.status(500).json({ error: 'Factory reset failed' });
  }
});

export default router;
