import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import db from '../db/index.js';

/**
 * Extract token and source from request
 */
function extractTokenInfo(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return { token, source: 'header' };
  }
  if (req.cookies && req.cookies.nexuspanel_token) {
    return { token: req.cookies.nexuspanel_token, source: 'cookie' };
  }
  return { token: null, source: null };
}

/**
 * CSRF Protection Middleware for Cookie-Authenticated State-Changing Requests
 */
export function verifyCsrfOrigin(req, res, next) {
  const method = req.method.toUpperCase();
  // Safe read-only HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const { source } = extractTokenInfo(req);
  
  // If authorization header is explicitly provided, it's immune to browser ambient cookie CSRF
  if (source === 'header') {
    return next();
  }

  // If request uses cookie, verify Origin/Referer against allowed origins
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const requestHost = req.headers.host;

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      if (parsedOrigin.host !== requestHost) {
        const isAllowedCors = config.CORS_ORIGINS.includes(origin) || config.CORS_ORIGINS.includes('*');
        if (!isAllowedCors) {
          return res.status(403).json({ error: 'CSRF verification failed: Cross-Origin request denied', code: 'CSRF_BLOCKED' });
        }
      }
    } catch (e) {
      return res.status(403).json({ error: 'CSRF verification failed: Invalid Origin header', code: 'CSRF_BLOCKED' });
    }
  } else if (referer) {
    try {
      const parsedReferer = new URL(referer);
      if (parsedReferer.host !== requestHost) {
        const isAllowedCors = config.CORS_ORIGINS.includes(parsedReferer.origin) || config.CORS_ORIGINS.includes('*');
        if (!isAllowedCors) {
          return res.status(403).json({ error: 'CSRF verification failed: Cross-Origin referer denied', code: 'CSRF_BLOCKED' });
        }
      }
    } catch (e) {
      return res.status(403).json({ error: 'CSRF verification failed: Invalid Referer header', code: 'CSRF_BLOCKED' });
    }
  }

  next();
}

/**
 * Mandatory authentication middleware
 * Returns 401 Unauthorized if missing, expired, revoked, or invalid
 */
export function authenticateToken(req, res, next) {
  const { token, source } = extractTokenInfo(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  // Explicit HS256 algorithm enforcement (blocks alg: none and algorithm confusion attacks)
  jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired, please log in again', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid authentication token', code: 'INVALID_TOKEN' });
    }

    if (!decoded || typeof decoded !== 'object' || !decoded.id) {
      return res.status(401).json({ error: 'Malformed token payload', code: 'INVALID_TOKEN' });
    }

    // Verify user in database
    try {
      const user = db.prepare('SELECT id, username, role, display_name, token_version FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists', code: 'USER_NOT_FOUND' });
      }

      // Check token version to support instant token invalidation upon password change
      const userTokenVersion = user.token_version || 1;
      const decodedVersion = decoded.token_version || 1;
      if (decodedVersion !== userTokenVersion) {
        return res.status(401).json({ error: 'Session has been revoked, please log in again', code: 'TOKEN_REVOKED' });
      }

      req.user = user;
      req.authSource = source;
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
 */
export function optionalAuth(req, res, next) {
  const { token, source } = extractTokenInfo(req);

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err || !decoded || !decoded.id) {
      req.user = null;
      return next();
    }

    try {
      const user = db.prepare('SELECT id, username, role, display_name, token_version FROM users WHERE id = ?').get(decoded.id);
      if (user && (user.token_version || 1) === (decoded.token_version || 1)) {
        req.user = user;
        req.authSource = source;
      } else {
        req.user = null;
      }
    } catch (dbErr) {
      req.user = null;
    }
    next();
  });
}

/**
 * First-run / setup check middleware
 */
export function requireAuthUnlessFirstRun(req, res, next) {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'setup_completed'").get();
    const userRow = db.prepare("SELECT COUNT(*) as count FROM users").get();
    const setupDone = (row && (row.value === '1' || row.value === 'true')) && (userRow?.count > 0);
    
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
