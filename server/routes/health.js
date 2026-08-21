import express from 'express';
import axios from 'axios';
import http from 'http';
import https from 'https';
import { validateDestinationHost, createSecureLookup } from '../utils/networkSecurity.js';

const router = express.Router();

const secureLookup = createSecureLookup(true);
const httpsAgent = new https.Agent({ rejectUnauthorized: false, lookup: secureLookup });
const httpAgent = new http.Agent({ lookup: secureLookup });

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Live health check probe endpoint with strict SSRF, DNS pinning, and zero-redirect policy
router.post('/probe', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required and must be a string' });
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
      maxContentLength: 1024 * 1024, // 1MB limit for probe
      httpAgent,
      httpsAgent,
      validateStatus: () => true, // Treat any HTTP response code as online/reachable
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
    let friendlyError = 'Host unreachable';
    if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
      friendlyError = 'Connection timed out (5s)';
    } else if (err.code === 'ECONNREFUSED') {
      friendlyError = 'Connection refused (port closed)';
    } else if (err.code === 'ENOTFOUND') {
      friendlyError = 'DNS lookup failed (host not found)';
    } else if (err.message && err.message.includes('restricted')) {
      return res.status(400).json({ error: err.message });
    }

    res.json({
      status: 'offline',
      responseTime: null,
      error: friendlyError,
      checkedAt: new Date().toISOString(),
      url: trimmedUrl
    });
  }
});

export default router;
