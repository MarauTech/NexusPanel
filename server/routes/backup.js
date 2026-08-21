import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { initializeDefaultSettings } from '../db/schema.js';

const router = express.Router();

/**
 * Middleware: checks if initial setup has been completed.
 * If setup_completed is NOT set or is '0', skip auth — allows first-run import.
 * Otherwise require full admin auth.
 */
function requireAuthUnlessFirstRun(req, res, next) {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'setup_completed'").get();
    const setupDone = row && (row.value === '1' || row.value === 'true');
    if (!setupDone) {
      // First run — allow unauthenticated access
      return next();
    }
    // Setup completed — require full admin auth
    return authenticateToken(req, res, () => {
      requireAdmin(req, res, next);
    });
  } catch (err) {
    return next();
  }
}

/**
 * GET /api/backup/export
 * Always requires admin auth — no export without login
 */
router.get('/export', authenticateToken, requireAdmin, (req, res) => {
  try {
    const data = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      categories: db.prepare("SELECT * FROM categories").all(),
      services: db.prepare("SELECT * FROM services").all(),
      tags: db.prepare("SELECT * FROM tags").all(),
      service_tags: db.prepare("SELECT * FROM service_tags").all(),
      settings: db.prepare("SELECT * FROM settings").all(),
      widget_configs: db.prepare("SELECT * FROM widget_configs").all()
    };
    
    res.setHeader('Content-Disposition', 'attachment; filename=nexuspanel-backup.json');
    res.json(data);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export configuration' });
  }
});

/**
 * POST /api/backup/import
 * Requires admin auth UNLESS this is a first-run (setup not completed).
 * This allows importing a backup on the welcome/empty state screen.
 */
router.post('/import', requireAuthUnlessFirstRun, (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object' || !Array.isArray(data.categories) || !Array.isArray(data.services)) {
    return res.status(400).json({ error: 'Invalid backup file structure: missing categories or services list' });
  }
  
  try {
    db.transaction(() => {
      // Clean old data
      db.prepare("DELETE FROM service_tags").run();
      db.prepare("DELETE FROM tags").run();
      db.prepare("DELETE FROM services").run();
      db.prepare("DELETE FROM categories").run();
      db.prepare("DELETE FROM widget_configs").run();
      db.prepare("DELETE FROM settings WHERE key NOT IN ('setup_completed', 'auth_enabled')").run();

      // Insert categories
      const insertCategory = db.prepare(`
        INSERT INTO categories (id, name, icon, color, sort_order, created_at) 
        VALUES (?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
      `);
      for (const c of data.categories) {
        insertCategory.run(c.id || null, c.name || 'Category', c.icon || 'folder', c.color || '#6366f1', c.sort_order || 0, c.created_at || null);
      }

      // Insert services
      const insertService = db.prepare(`
        INSERT INTO services (
          id, name, description, url, category_id, icon, icon_type, icon_url, color, 
          sort_order, open_new_tab, enabled, favorite, health_check_enabled, health_check_url, 
          health_check_interval, health_status, health_last_checked, health_response_time, 
          custom_badge, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), datetime('now'))
      `);
      for (const s of data.services) {
        insertService.run(
          s.id || null, s.name || 'Service', s.description || '', s.url || '#', s.category_id || null, 
          s.icon || 'globe', s.icon_type || 'lucide', s.icon_url || '', s.color || '#6366f1', 
          s.sort_order || 0, s.open_new_tab !== undefined ? s.open_new_tab : 1, 
          s.enabled !== undefined ? s.enabled : 1, s.favorite || 0, 
          s.health_check_enabled || 0, s.health_check_url || '', s.health_check_interval || 60, 
          s.health_status || 'unknown', s.health_last_checked || null, s.health_response_time || null, 
          s.custom_badge || '', s.notes || '', s.created_at || null
        );
      }

      // Insert tags
      if (Array.isArray(data.tags)) {
        const insertTag = db.prepare("INSERT OR IGNORE INTO tags (id, name, color) VALUES (?, ?, ?)");
        for (const t of data.tags) {
          if (t.name) insertTag.run(t.id || null, t.name, t.color || '#6366f1');
        }
      }

      // Insert service tags links
      if (Array.isArray(data.service_tags)) {
        const insertServiceTag = db.prepare("INSERT OR IGNORE INTO service_tags (id, service_id, tag_id) VALUES (?, ?, ?)");
        for (const st of data.service_tags) {
          insertServiceTag.run(st.id || null, st.service_id, st.tag_id);
        }
      }

      // Insert settings
      if (Array.isArray(data.settings)) {
        const insertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value, type) VALUES (?, ?, ?)");
        for (const s of data.settings) {
          if (['setup_completed', 'auth_enabled'].includes(s.key)) continue;
          insertSetting.run(s.key, String(s.value || ''), s.type || 'string');
        }
      }

      // Insert widget configs if present
      if (Array.isArray(data.widget_configs)) {
        const insertWidget = db.prepare("INSERT INTO widget_configs (id, widget_type, config_json, sort_order, enabled) VALUES (?, ?, ?, ?, ?)");
        for (const w of data.widget_configs) {
          insertWidget.run(w.id || null, w.widget_type, w.config_json || '{}', w.sort_order || 0, w.enabled || 1);
        }
      }
    })();

    res.json({ success: true, message: 'Configuration successfully restored' });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import backup configuration: ' + error.message });
  }
});

/**
 * POST /api/backup/factory-reset
 * Resets the entire application back to out-of-the-box fresh state
 */
router.post('/factory-reset', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.transaction(() => {
      // 1. Delete all services & categories & tags & widgets
      db.prepare("DELETE FROM service_tags").run();
      db.prepare("DELETE FROM tags").run();
      db.prepare("DELETE FROM services").run();
      db.prepare("DELETE FROM categories").run();
      db.prepare("DELETE FROM widget_configs").run();
      try {
        db.prepare("DELETE FROM service_health_history").run();
      } catch (e) {
        // ignore if table not present
      }

      // 2. Reset all settings back to default values
      db.prepare("DELETE FROM settings").run();
      initializeDefaultSettings(db);
    })();

    res.json({
      success: true,
      message: 'Factory reset complete. Dashboard has been reset to initial state.'
    });
  } catch (err) {
    console.error('Factory reset error:', err);
    res.status(500).json({ error: 'Factory reset failed: ' + err.message });
  }
});

export default router;
