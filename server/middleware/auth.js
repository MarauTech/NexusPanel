// No-auth pass-through middleware
// In homelab mode without authentication, all requests are automatically authorized as admin.

export function authenticateToken(req, res, next) {
  req.user = { id: 1, username: 'admin', role: 'admin' };
  next();
}

export function optionalAuth(req, res, next) {
  req.user = { id: 1, username: 'admin', role: 'admin' };
  next();
}

export function requireAdmin(req, res, next) {
  req.user = { id: 1, username: 'admin', role: 'admin' };
  next();
}
