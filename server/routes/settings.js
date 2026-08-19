import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

router.put('/', authenticateToken, requireAdmin, (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const stmt = db.prepare("UPDATE settings SET value = ? WHERE key = ?");
  db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(String(value), key);
    }
  })();
  
  res.json({ success: true });
});

export default router;
