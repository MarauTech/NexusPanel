// Safe structured logger that strips sensitive information (passwords, tokens, keys)
const SENSITIVE_PATTERN = /(password|token|secret|authorization|cookie|pveapitoken|bearer)/i;

function sanitize(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    // Redact JWT tokens
    return obj.replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]')
              .replace(/(token|secret|password)=([^&\s]+)/gi, '$1=[REDACTED]');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_PATTERN.test(key)) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = sanitize(value);
      }
    }
    return clean;
  }
  return obj;
}

export const logger = {
  info(msg, meta) {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, meta ? sanitize(meta) : '');
  },
  warn(msg, meta) {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, meta ? sanitize(meta) : '');
  },
  error(msg, err) {
    const sanitizedError = err ? (err.message || err) : '';
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, sanitizedError);
  },
  audit(event, meta) {
    console.log(`[AUDIT] [${new Date().toISOString()}] EVENT=${event}`, meta ? sanitize(meta) : '');
  }
};

export default logger;
