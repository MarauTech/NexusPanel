import express from 'express';
import axios from 'axios';
import https from 'https';
import db from '../db/index.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { validateDestinationHost } from '../utils/networkSecurity.js';
import { recordAudit } from '../utils/audit.js';

const router = express.Router();

function getProxmoxSettings() {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'proxmox_%'").all();
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  return settings;
}

/**
 * 1. Test Proxmox VE Connection
 */
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  const { host, port, node, token_id, token_secret, verify_ssl } = req.body;
  
  if (!host || typeof host !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Proszę podać adres IP / host serwera Proxmox VE'
    });
  }

  // SSRF guard: Validate host against loopback and cloud metadata
  try {
    await validateDestinationHost(host, true);
  } catch (ssrfErr) {
    return res.status(400).json({
      success: false,
      error: 'Nieprawidłowy adres hosta (zabezpieczenie SSRF): ' + ssrfErr.message
    });
  }

  // If secret is masked or omitted, use existing saved secret from database
  let secret = token_secret;
  if (!secret || secret.startsWith('••••')) {
    const saved = db.prepare("SELECT value FROM settings WHERE key = 'proxmox_token_secret'").get();
    secret = saved?.value || '';
  }

  const pvePort = parseInt(port, 10) || 8006;
  const baseUrl = `https://${host}:${pvePort}/api2/json`;
  const isSslVerificationRequired = verify_ssl === 'true' || verify_ssl === true;
  const pveAgent = new https.Agent({ rejectUnauthorized: isSslVerificationRequired });

  try {
    const headers = {};
    if (token_id && secret) {
      headers['Authorization'] = `PVEAPIToken=${token_id}=${secret}`;
    }

    const versionRes = await axios.get(`${baseUrl}/version`, {
      headers,
      httpsAgent: pveAgent,
      timeout: 5000,
      maxContentLength: 100 * 1024
    });

    recordAudit({
      event: 'PROXMOX_TEST_SUCCESS',
      userId: req.user.id,
      username: req.user.username,
      ip: req.ip,
      details: { host, port: pvePort }
    });

    res.json({
      success: true,
      mode: 'live',
      message: 'Połączono pomyślnie z API Proxmox VE',
      version: versionRes.data?.data?.version || '8.x'
    });
  } catch (err) {
    let safeErrMsg = 'Nie można połączyć się z serwerem Proxmox VE';
    if (err.code === 'ECONNREFUSED') safeErrMsg = `Odrzucono połączenie na porcie ${pvePort}`;
    else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') safeErrMsg = 'Przekroczono limit czasu połączenia (5s)';
    else if (err.response?.status === 401 || err.response?.status === 403) safeErrMsg = 'Błąd uwierzytelnienia API Token w Proxmox (sprawdź Token ID i Secret)';

    res.status(400).json({
      success: false,
      error: safeErrMsg
    });
  }
});

/**
 * 2. Node Status (CPU, RAM, Disk, Uptime)
 */
router.get('/node-status', optionalAuth, async (req, res) => {
  const settings = getProxmoxSettings();
  const host = settings.proxmox_host;
  const isEnabled = settings.proxmox_enabled === 'true';

  if (!isEnabled || !host) {
    return res.json({
      enabled: false,
      configured: false,
      message: 'Integracja z Proxmox VE nie jest skonfigurowana'
    });
  }

  // SSRF guard
  try {
    await validateDestinationHost(host, true);
  } catch (e) {
    return res.status(400).json({ enabled: false, error: 'Restricted Proxmox host' });
  }

  const pvePort = parseInt(settings.proxmox_port, 10) || 8006;
  const node = settings.proxmox_node || 'pve';
  const baseUrl = `https://${host}:${pvePort}/api2/json`;
  const isSslVerificationRequired = settings.proxmox_verify_ssl === 'true';
  const pveAgent = new https.Agent({ rejectUnauthorized: isSslVerificationRequired });

  try {
    const headers = {};
    if (settings.proxmox_token_id && settings.proxmox_token_secret) {
      headers['Authorization'] = `PVEAPIToken=${settings.proxmox_token_id}=${settings.proxmox_token_secret}`;
    }

    const [statusRes, rrdRes] = await Promise.all([
      axios.get(`${baseUrl}/nodes/${node}/status`, { headers, httpsAgent: pveAgent, timeout: 5000, maxContentLength: 500 * 1024 }),
      axios.get(`${baseUrl}/version`, { headers, httpsAgent: pveAgent, timeout: 5000, maxContentLength: 100 * 1024 }).catch(() => ({}))
    ]);

    const data = statusRes.data?.data || {};
    const memTotal = data.memory?.total || 1;
    const memUsed = data.memory?.used || 0;
    const rootTotal = data.rootfs?.total || 1;
    const rootUsed = data.rootfs?.used || 0;

    res.json({
      mode: 'live',
      enabled: true,
      configured: true,
      node: node,
      pveVersion: rrdRes.data?.data?.release || '8.x',
      kernelVersion: data.kversion || 'Linux PVE',
      uptimeHours: Math.floor((data.uptime || 0) / 3600),
      cpu: {
        usagePercent: Math.round((data.cpu || 0) * 1000) / 10,
        cores: data.cpuinfo?.cpus || 8,
        model: data.cpuinfo?.model || 'Proxmox Host CPU'
      },
      memory: {
        usedBytes: memUsed,
        totalBytes: memTotal,
        usedGb: (memUsed / (1024 ** 3)).toFixed(1),
        totalGb: (memTotal / (1024 ** 3)).toFixed(1),
        percent: Math.round((memUsed / memTotal) * 100)
      },
      storage: {
        usedBytes: rootUsed,
        totalBytes: rootTotal,
        usedGb: Math.round(rootUsed / (1024 ** 3)),
        totalGb: Math.round(rootTotal / (1024 ** 3)),
        percent: Math.round((rootUsed / rootTotal) * 100)
      }
    });
  } catch (err) {
    res.status(500).json({
      enabled: false,
      configured: true,
      error: 'Błąd pobierania danych z API Proxmox'
    });
  }
});

/**
 * 3. LXC Containers List
 */
router.get('/lxc-status', optionalAuth, async (req, res) => {
  const settings = getProxmoxSettings();
  const host = settings.proxmox_host;
  const isEnabled = settings.proxmox_enabled === 'true';

  if (!isEnabled || !host) {
    return res.json({
      enabled: false,
      configured: false,
      containers: []
    });
  }

  // SSRF guard
  try {
    await validateDestinationHost(host, true);
  } catch (e) {
    return res.status(400).json({ enabled: false, error: 'Restricted Proxmox host' });
  }

  const pvePort = parseInt(settings.proxmox_port, 10) || 8006;
  const node = settings.proxmox_node || 'pve';
  const baseUrl = `https://${host}:${pvePort}/api2/json`;
  const isSslVerificationRequired = settings.proxmox_verify_ssl === 'true';
  const pveAgent = new https.Agent({ rejectUnauthorized: isSslVerificationRequired });

  try {
    const headers = {};
    if (settings.proxmox_token_id && settings.proxmox_token_secret) {
      headers['Authorization'] = `PVEAPIToken=${settings.proxmox_token_id}=${settings.proxmox_token_secret}`;
    }

    const lxcRes = await axios.get(`${baseUrl}/nodes/${node}/lxc`, { headers, httpsAgent: pveAgent, timeout: 6000, maxContentLength: 500 * 1024 });
    const rawList = lxcRes.data?.data || [];

    const containers = rawList.map(c => ({
      vmid: c.vmid,
      name: c.name,
      status: c.status,
      cpu: Math.round((c.cpu || 0) * 1000) / 10,
      memUsedMb: Math.round((c.mem || 0) / (1024 * 1024)),
      memTotalMb: Math.round((c.maxmem || 1) / (1024 * 1024)),
      diskUsedGb: ((c.disk || 0) / (1024 ** 3)).toFixed(1),
      diskTotalGb: Math.round((c.maxdisk || 1) / (1024 ** 3)),
      uptime: c.uptime ? `${Math.floor(c.uptime / 86400)}d ${Math.floor((c.uptime % 86400) / 3600)}h` : 'Stopped'
    }));

    res.json({ mode: 'live', enabled: true, configured: true, containers });
  } catch (err) {
    res.status(500).json({ error: 'Nie udało się pobrać listy kontenerów LXC' });
  }
});

export default router;
