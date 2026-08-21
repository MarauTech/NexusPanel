import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { recordAudit } from '../utils/audit.js';

const router = express.Router();

const ALLOWED_SETTINGS = new Set([
  'dashboard_name', 'user_name', 'theme', 'theme_preset', 'accent_color',
  'tile_style', 'tile_size', 'tile_border_radius', 'grid_gap', 'grid_columns',
  'background_url', 'background_opacity', 'background_blur', 'custom_css',
  'language', 'timezone', 'date_format', 'time_format', 'show_header_clock',
  'show_status_indicators', 'weather_enabled', 'weather_city', 'weather_lat',
  'weather_lon', 'system_monitor_enabled', 'camera_enabled', 'camera_name',
  'camera_url', 'camera_interval', 'camera_2_enabled', 'camera_2_name',
  'camera_2_url', 'camera_2_interval', 'proxmox_enabled', 'proxmox_host',
  'proxmox_port', 'proxmox_node', 'proxmox_token_id', 'proxmox_token_secret',
  'proxmox_verify_ssl', 'health_check_default_interval', 'health_check_default_enabled'
]);

const SECRET_SETTINGS = new Set(['proxmox_token_secret', 'jwt_secret', 'admin_password']);

/**
 * GET /api/settings
 * Return all settings with sensitive secrets masked
 */
router.get('/', (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const row of rows) {
      if (SECRET_SETTINGS.has(row.key)) {
        // Mask secret if set, but indicate whether it exists
        settings[row.key] = row.value ? '••••••••••••••••' : '';
        settings[`${row.key}_configured`] = Boolean(row.value);
      } else {
        settings[row.key] = row.value;
      }
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

/**
 * PUT /api/settings
 * Admin-only updating of allowed configuration keys
 */
router.put('/', authenticateToken, requireAdmin, (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    
    const updatedKeys = [];
    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        // Only allow whitelisted configuration keys
        if (!ALLOWED_SETTINGS.has(key)) continue;

        if (value !== undefined && value !== null) {
          // Do NOT overwrite existing real secret if client sent back the masked placeholder
          if (SECRET_SETTINGS.has(key) && String(value).startsWith('••••')) {
            continue;
          }
          stmt.run(key, String(value).slice(0, 5000));
          updatedKeys.push(key);
        }
      }
    })();
    
    recordAudit({
      event: 'SETTINGS_UPDATED',
      userId: req.user.id,
      username: req.user.username,
      ip: req.ip,
      details: { keys: updatedKeys }
    });

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
