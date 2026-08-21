import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import db from '../db/index.js';

/**
 * Extract token from Authorization header (Bearer <token>) or httpOnly cookie
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies.nexuspanel_token) {
    return req.cookies.nexuspanel_token;
  }
  return null;
}

/**
 * Mandatory authentication middleware
 * Returns 401 Unauthorized if missing, expired, or invalid
 */
export function authenticateToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired, please log in again', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid authentication token', code: 'INVALID_TOKEN' });
    }

    // Verify user exists in database and has not been deleted or locked
    try {
      const user = db.prepare('SELECT id, username, role, display_name FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists', code: 'USER_NOT_FOUND' });
      }

      req.user = user;
      next();
    } catch (dbErr) {
      return res.status(500).json({ error: 'Authentication database error' });
    }
  });
}

/**
 * Role-based authorization middleware
 * Returns 403 Forbidden if authenticated user is not an administrator
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required', code: 'FORBIDDEN' });
  }

  next();
}

/**
 * Optional authentication middleware
 * Sets req.user if valid token provided, otherwise leaves req.user = null and continues
 */
export function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    try {
      const user = db.prepare('SELECT id, username, role, display_name FROM users WHERE id = ?').get(decoded.id);
      req.user = user || null;
    } catch (dbErr) {
      req.user = null;
    }
    next();
  });
}

/**
 * First-run / setup check middleware:
 * Allows unauthenticated access ONLY if setup has never been completed.
 * Once setup_completed is 'true', enforces full authentication and admin role.
 */
export function requireAuthUnlessFirstRun(req, res, next) {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'setup_completed'").get();
    const setupDone = row && (row.value === '1' || row.value === 'true');
    
    if (!setupDone) {
      // First run mode - allow through
      return next();
    }

    // Setup completed - enforce admin auth
    return authenticateToken(req, res, () => {
      requireAdmin(req, res, next);
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error validating setup state' });
  }
}
