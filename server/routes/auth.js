import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import config from '../config/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { recordAudit } from '../utils/audit.js';

const router = express.Router();

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
}

/**
 * GET /api/auth/status
 * Returns whether initial setup has been completed
 */
router.get('/status', (req, res) => {
  try {
    const setupRow = db.prepare("SELECT value FROM settings WHERE key = 'setup_completed'").get();
    const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users").get();
    
    const isSetupCompleted = (setupRow && (setupRow.value === '1' || setupRow.value === 'true')) && (userCountRow?.count > 0);
    res.json({ setupCompleted: Boolean(isSetupCompleted), hasUsers: Boolean(userCountRow?.count > 0) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to query setup status' });
  }
});

/**
 * POST /api/auth/setup
 * Atomic first-run administrator account creation
 */
router.post('/setup', async (req, res) => {
  const { username, password, dashboardName } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const setupRow = db.prepare("SELECT value FROM settings WHERE key = 'setup_completed'").get();
    const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users").get();

    if ((setupRow && (setupRow.value === '1' || setupRow.value === 'true')) && (userCountRow?.count > 0)) {
      return res.status(403).json({ error: 'Setup has already been completed' });
    }

    const cleanUsername = username.trim();
    const passwordHash = await bcrypt.hash(password, 10);
    let newUserId = 1;

    // Run atomically in transaction
    db.transaction(() => {
      // Clear any stale user accounts during setup
      db.exec('DELETE FROM users');
      
      const insertUser = db.prepare(`
        INSERT INTO users (username, password_hash, display_name, role, created_at, updated_at)
        VALUES (?, ?, ?, 'admin', datetime('now'), datetime('now'))
      `);
      const result = insertUser.run(cleanUsername, passwordHash, cleanUsername);
      newUserId = result.lastInsertRowid || 1;

      // Update settings
      db.prepare(`
        INSERT INTO settings (key, value) VALUES ('setup_completed', 'true')
        ON CONFLICT(key) DO UPDATE SET value = 'true'
      `).run();

      if (dashboardName && typeof dashboardName === 'string' && dashboardName.trim()) {
        db.prepare(`
          INSERT INTO settings (key, value) VALUES ('dashboard_name', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(dashboardName.trim());
      }
    })();

    const payload = { id: newUserId, username: cleanUsername, role: 'admin' };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });

    res.cookie('nexuspanel_token', token, getCookieOptions());

    recordAudit({
      event: 'SETUP_COMPLETED',
      userId: newUserId,
      username: cleanUsername,
      ip: req.ip,
      details: { dashboardName }
    });

    res.status(201).json({
      success: true,
      token,
      user: { id: newUserId, username: cleanUsername, role: 'admin', display_name: cleanUsername }
    });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Setup failed: ' + err.message });
  }
});

/**
 * POST /api/auth/login
 * Rate-limited login with password comparison and JWT token generation
 */
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = db.prepare('SELECT id, username, password_hash, display_name, role FROM users WHERE username = ?').get(username.trim());

    if (!user) {
      recordAudit({ event: 'LOGIN_FAILED', username, ip: req.ip, success: false });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      recordAudit({ event: 'LOGIN_FAILED', userId: user.id, username: user.username, ip: req.ip, success: false });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });

    res.cookie('nexuspanel_token', token, getCookieOptions());

    recordAudit({ event: 'LOGIN_SUCCESS', userId: user.id, username: user.username, ip: req.ip, success: true });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login error occurred' });
  }
});

/**
 * POST /api/auth/logout
 * Clears authentication cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('nexuspanel_token', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  recordAudit({ event: 'LOGOUT', ip: req.ip, success: true });
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Protected endpoint returning currently authenticated user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    display_name: req.user.display_name || req.user.username,
    role: req.user.role
  });
});

/**
 * PUT /api/auth/password
 * Protected endpoint for updating administrator password
 */
router.put('/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, user.id);

    recordAudit({ event: 'PASSWORD_CHANGED', userId: user.id, username: req.user.username, ip: req.ip });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password update failed' });
  }
});

export default router;
