import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateCategory, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(s.id) as service_count 
    FROM categories c
    LEFT JOIN services s ON s.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `).all();
  res.json(categories);
});

router.post('/', authenticateToken, requireAdmin, validateCategory, handleValidationErrors, (req, res) => {
  const { name, icon, color, sort_order } = req.body;
  const result = db.prepare("INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)").run(
    name, icon || 'folder', color || '#6366f1', sort_order || 0
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/reorder', authenticateToken, requireAdmin, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Invalid payload' });
  
  const stmt = db.prepare("UPDATE categories SET sort_order = ? WHERE id = ?");
  db.transaction(() => {
    for (const item of items) {
      stmt.run(item.sort_order, item.id);
    }
  })();
  
  res.json({ success: true });
});

router.put('/:id', authenticateToken, requireAdmin, validateCategory, handleValidationErrors, (req, res) => {
  const { name, icon, color, sort_order } = req.body;
  const result = db.prepare("UPDATE categories SET name = ?, icon = ?, color = ?, sort_order = ? WHERE id = ?").run(
    name, icon || 'folder', color || '#6366f1', sort_order || 0, req.params.id
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  db.transaction(() => {
    db.prepare("UPDATE services SET category_id = NULL WHERE category_id = ?").run(req.params.id);
    const result = db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    if (result.changes === 0) throw new Error('Not found');
  })();
  res.json({ success: true });
});

export default router;
