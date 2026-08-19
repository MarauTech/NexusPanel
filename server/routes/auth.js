import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Always return setupCompleted: true (no setup or login screen needed)
router.get('/status', (req, res) => {
  res.json({ setupCompleted: true });
});

router.post('/setup', (req, res) => {
  res.json({ success: true, token: 'no-auth-token', user: { id: 1, username: 'admin', role: 'admin' } });
});

router.post('/login', (req, res) => {
  res.json({ token: 'no-auth-token', user: { id: 1, username: 'admin', role: 'admin' } });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

router.get('/me', (req, res) => {
  res.json({ id: 1, username: 'admin', display_name: 'Administrator', role: 'admin' });
});

router.put('/password', (req, res) => {
  res.json({ message: 'Password updated' });
});

export default router;
