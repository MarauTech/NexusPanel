import db from '../db/index.js';
import logger from './logger.js';

export function recordAudit({ event, userId = null, username = null, ip = null, details = null, success = true }) {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : (details ? String(details) : null);
    
    // Log to console/stream
    logger.audit(event, { user: username || userId, ip, success });

    // Persist to database
    const stmt = db.prepare(`
      INSERT INTO audit_logs (event, user_id, username, ip_address, details, success, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(event, userId, username, ip, detailsStr, success ? 1 : 0);
  } catch (err) {
    logger.error('Failed to write audit log entry', err);
  }
}

export default recordAudit;
