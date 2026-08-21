import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const SENSITIVE_KEYS = ['proxmox_token_secret', 'jwt_secret'];

router.get('/', (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const row of rows) {
      if (SENSITIVE_KEYS.includes(row.key)) {
        // Mask secret if set, but indicate whether it exists
        settings[row.key] = row.value ? '••••••••••••••••' : '';
        settings[`${row.key}_configured`] = Boolean(row.value);
      } else {
        settings[row.key] = row.value;
      }
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authenticateToken, requireAdmin, (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    
    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined && value !== null) {
          // Do NOT overwrite existing real secret if client sent back the masked placeholder
          if (SENSITIVE_KEYS.includes(key) && String(value).startsWith('••••')) {
            continue;
          }
          stmt.run(key, String(value));
        }
      }
    })();
    
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
