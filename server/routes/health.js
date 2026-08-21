import express from 'express';
import axios from 'axios';
import http from 'http';
import https from 'https';
import { validateDestinationHost, createSecureLookup } from '../utils/networkSecurity.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const secureLookup = createSecureLookup(true);
const httpsAgent = new https.Agent({ rejectUnauthorized: false, lookup: secureLookup });
const httpAgent = new http.Agent({ lookup: secureLookup });

/**
 * GET /api/health
 * Public health check for docker / reverse proxy status
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

/**
 * POST /api/health/probe
 * Protected live URL probe with SSRF, DNS pinning, and zero-redirect policy
 * Requires admin authentication to prevent arbitrary SSRF probing by unauthenticated users.
 */
router.post('/probe', authenticateToken, requireAdmin, async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || url.length > 2000) {
    return res.status(400).json({ error: 'URL is required, must be a string and under 2000 characters' });
  }

  const trimmedUrl = url.trim();

  // Validate URL structure & protocol
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: 'Only http: and https: protocols are permitted' });
  }

  // SSRF guard: Validate hostname against loopback, non-standard encodings, and cloud metadata
  try {
    await validateDestinationHost(parsedUrl.hostname, true);
  } catch (ssrfErr) {
    return res.status(400).json({ error: 'Target host is restricted (SSRF protection): ' + ssrfErr.message });
  }

  const startTime = Date.now();
  try {
    const response = await axios.get(trimmedUrl, {
      timeout: 5000,
      maxRedirects: 0, // Strict zero redirects: prevents redirect SSRF bypass
      maxContentLength: 512 * 1024, // 512KB limit for probe
      httpAgent,
      httpsAgent,
      validateStatus: () => true, // Treat any HTTP response code as reachable
      headers: { 'User-Agent': 'NexusPanel-HealthProbe/1.0' }
    });

    const responseTime = Date.now() - startTime;
    const status = responseTime < 1000 ? 'online' : 'degraded';

    res.json({
      status,
      responseTime,
      httpStatus: response.status,
      checkedAt: new Date().toISOString(),
      url: trimmedUrl
    });
  } catch (err) {
    if (err.message && err.message.includes('restricted')) {
      return res.status(400).json({ error: err.message });
    }

    res.json({
      status: 'offline',
      responseTime: null,
      error: 'Host unreachable or probe timed out',
      checkedAt: new Date().toISOString(),
      url: trimmedUrl
    });
  }
});

export default router;
