import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import config from '../config/index.js';
import { authenticateToken, extractTokenInfo } from '../middleware/auth.js';
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
 * Atomic first-run administrator account creation with strong password policy (12-128 chars)
 */
router.post('/setup', async (req, res) => {
  const { username, password, dashboardName } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 50) {
    return res.status(400).json({ error: 'Username must be between 3 and 50 characters long' });
  }

  if (!password || typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be between 12 and 128 characters long' });
  }

  try {
    const setupRow = db.prepare("SELECT value FROM settings WHERE key = 'setup_completed'").get();
    const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users").get();

    if ((setupRow && (setupRow.value === '1' || setupRow.value === 'true')) && (userCountRow?.count > 0)) {
      return res.status(403).json({ error: 'Setup has already been completed' });
    }

    const cleanUsername = username.trim();
    const passwordHash = await bcrypt.hash(password, 12);
    let newUserId = 1;

    // Run atomically in transaction to prevent race conditions during concurrent setup calls
    db.transaction(() => {
      const setupRow = db.prepare("SELECT value FROM settings WHERE key = 'setup_completed'").get();
      const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users").get();

      if ((setupRow && (setupRow.value === '1' || setupRow.value === 'true')) || (userCountRow?.count > 0)) {
        throw new Error('SETUP_ALREADY_COMPLETED');
      }

      // Clear any stale user accounts during setup
      db.exec('DELETE FROM users');
      
      const insertUser = db.prepare(`
        INSERT INTO users (username, password_hash, display_name, role, token_version, created_at, updated_at)
        VALUES (?, ?, ?, 'admin', 1, datetime('now'), datetime('now'))
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
        `).run(dashboardName.trim().slice(0, 100));
      }
    })();

    const payload = { id: newUserId, username: cleanUsername, role: 'admin', token_version: 1 };
    const token = jwt.sign(payload, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: config.JWT_EXPIRY });

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
    if (err.message === 'SETUP_ALREADY_COMPLETED') {
      return res.status(403).json({ error: 'Setup has already been completed' });
    }
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
    const user = db.prepare('SELECT id, username, password_hash, display_name, role, token_version FROM users WHERE username = ?').get(username.trim());

    // Fake hash compare to prevent timing-based username enumeration
    const DUMMY_HASH = '$2a$12$e8Zbz1hYk3v0g8kH4W2Jje9fK8U3Wv2J.Y8Y4O0a7q.9hV9hO9hO.';
    const hashToCompare = user ? user.password_hash : DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) {
      recordAudit({ event: 'LOGIN_FAILED', username, ip: req.ip, success: false });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const payload = { id: user.id, username: user.username, role: user.role, token_version: user.token_version || 1 };
    const token = jwt.sign(payload, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: config.JWT_EXPIRY });

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
 * Clears authentication cookie and revokes active token version
 */
router.post('/logout', (req, res) => {
  // If user is authenticated, revoke their active token version in database
  const { token } = extractTokenInfo(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded && decoded.id) {
        db.prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?").run(decoded.id);
      }
    } catch {
      // Ignore if token is already expired or invalid
    }
  }

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
 * Protected endpoint for updating administrator password (enforces 12-128 chars and token revocation)
 */
router.put('/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 12 || newPassword.length > 128) {
    return res.status(400).json({ error: 'New password must be between 12 and 128 characters long' });
  }

  try {
    const user = db.prepare('SELECT id, password_hash, token_version FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    // Increment token_version to invalidate all existing JWTs across all devices
    const newTokenVersion = (user.token_version || 1) + 1;
    
    db.prepare("UPDATE users SET password_hash = ?, token_version = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, newTokenVersion, user.id);

    // Issue fresh JWT with new token_version for the current session
    const payload = { id: user.id, username: req.user.username, role: req.user.role, token_version: newTokenVersion };
    const freshToken = jwt.sign(payload, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: config.JWT_EXPIRY });

    res.cookie('nexuspanel_token', freshToken, getCookieOptions());

    recordAudit({ event: 'PASSWORD_CHANGED', userId: user.id, username: req.user.username, ip: req.ip });

    res.json({ success: true, message: 'Password updated successfully', token: freshToken });
  } catch (err) {
    res.status(500).json({ error: 'Password update failed' });
  }
});

export default router;
