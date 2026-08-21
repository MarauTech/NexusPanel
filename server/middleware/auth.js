import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import db from '../db/index.js';

/**
 * Extract token and source from request with strict header precedence
 */
export function extractTokenInfo(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      return { token: token || 'INVALID_HEADER_TOKEN', source: 'header' };
    }
    // If an Authorization header is provided with unsupported scheme
    return { token: 'INVALID_HEADER_TOKEN', source: 'header' };
  }

  if (req.cookies && req.cookies.nexuspanel_token) {
    return { token: req.cookies.nexuspanel_token, source: 'cookie' };
  }

  return { token: null, source: null };
}

/**
 * Check if origin matches expected server origin or configured CORS allowlist
 * Note: CORS_ORIGINS with '*' is strictly ignored for credentialed CSRF checks
 */
function isAllowedOrigin(originStr, req) {
  if (!originStr || typeof originStr !== 'string') return false;

  try {
    const parsed = new URL(originStr);
    const origin = parsed.origin.toLowerCase();

    // 1. Calculate expected origin based on request headers
    const hostHeader = req.get('host');
    if (!hostHeader) return false;

    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = (typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol) || 'http';
    const expectedOrigin = `${protocol}://${hostHeader}`.toLowerCase();

    if (origin === expectedOrigin) {
      return true;
    }

    // Also match http vs https on same host in dev environments if host matches
    if (origin.split('://')[1] === expectedOrigin.split('://')[1]) {
      return true;
    }

    // 2. Check against explicit CORS_ORIGINS allowlist (ignoring wildcard '*')
    const corsList = Array.isArray(config.CORS_ORIGINS) ? config.CORS_ORIGINS : [];
    for (const allowedEntry of corsList) {
      if (!allowedEntry || allowedEntry === '*') continue;
      try {
        const allowedOrigin = new URL(allowedEntry).origin.toLowerCase();
        if (origin === allowedOrigin) {
          return true;
        }
      } catch {
        if (origin === allowedEntry.toLowerCase()) return true;
      }
    }

    return false;
  } catch (e) {
    return false;
  }
}

/**
 * CSRF Protection Middleware - Strict FAIL-CLOSED Architecture
 * 
 * Rules for state-changing requests (POST, PUT, PATCH, DELETE):
 * 1. If explicit valid Authorization header is used -> ALLOW (immune to ambient browser cookies)
 * 2. If cookie authentication is used:
 *    - Valid Origin -> ALLOW
 *    - Invalid Origin -> DENY (403)
 *    - Missing Origin + Valid Referer -> ALLOW
 *    - Missing Origin + Invalid Referer -> DENY (403)
 *    - Missing Origin + Missing Referer -> DENY (403)
 */
export function verifyCsrfOrigin(req, res, next) {
  const method = req.method.toUpperCase();
  // Safe read-only HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const { source } = extractTokenInfo(req);

  // If request uses Authorization header, it is immune to ambient-credential CSRF
  if (source === 'header') {
    return next();
  }

  // If request has cookie authentication (or uses cookie session)
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    if (isAllowedOrigin(origin, req)) {
      return next();
    }
    return res.status(403).json({
      error: 'CSRF verification failed: Cross-Origin request denied',
      code: 'CSRF_BLOCKED'
    });
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isAllowedOrigin(refererOrigin, req)) {
        return next();
      }
    } catch (e) {
      // Invalid referer URL format
    }
    return res.status(403).json({
      error: 'CSRF verification failed: Cross-Origin referer denied',
      code: 'CSRF_BLOCKED'
    });
  }

  // FAIL-CLOSED: Missing both Origin and Referer on cookie-authenticated mutating request
  if (source === 'cookie') {
    return res.status(403).json({
      error: 'CSRF verification failed: Missing required Origin or Referer header for cookie-authenticated request',
      code: 'CSRF_BLOCKED'
    });
  }

  // Unauthenticated mutating request without origin or cookie
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

    if (!decoded || typeof decoded !== 'object' || !decoded.id || typeof decoded.id !== 'number' && typeof decoded.id !== 'string') {
      return res.status(401).json({ error: 'Malformed token payload', code: 'INVALID_TOKEN' });
    }

    // Verify user in database
    try {
      const user = db.prepare('SELECT id, username, role, display_name, token_version FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists', code: 'USER_NOT_FOUND' });
      }

      // Check token version to support instant token invalidation upon logout / password change
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
      return next();
    }

    return authenticateToken(req, res, () => {
      requireAdmin(req, res, next);
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error validating setup state' });
  }
}
