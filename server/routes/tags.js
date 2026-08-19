import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateTag, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.get('/', (req, res) => {
  const tags = db.prepare(`
    SELECT t.*, COUNT(st.service_id) as usage_count
    FROM tags t
    LEFT JOIN service_tags st ON st.tag_id = t.id
    GROUP BY t.id
    ORDER BY t.name ASC
  `).all();
  res.json(tags);
});

router.post('/', authenticateToken, requireAdmin, validateTag, handleValidationErrors, (req, res) => {
  const { name, color } = req.body;
  try {
    const result = db.prepare("INSERT INTO tags (name, color) VALUES (?, ?)").run(name, color || '#6366f1');
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Tag already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

router.put('/:id', authenticateToken, requireAdmin, validateTag, handleValidationErrors, (req, res) => {
  const { name, color } = req.body;
  try {
    const result = db.prepare("UPDATE tags SET name = ?, color = ? WHERE id = ?").run(name, color || '#6366f1', req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Tag name already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM tags WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;
