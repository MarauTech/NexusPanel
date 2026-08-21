import express from 'express';
import axios from 'axios';
import https from 'https';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function getProxmoxSettings() {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'proxmox_%'").all();
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  return settings;
}

// 1. Test Connection - requires admin authentication
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  const { host, port, node, token_id, token_secret, verify_ssl } = req.body;
  
  if (!host) {
    return res.status(400).json({
      success: false,
      error: 'Proszę podać adres IP / host serwera Proxmox VE'
    });
  }

  // Prevent SSRF to cloud metadata endpoints
  if (host === '169.254.169.254' || host === 'metadata.google.internal' || host === '100.100.100.200') {
    return res.status(403).json({ success: false, error: 'Restricted host' });
  }

  // If secret is masked or omitted, use existing saved secret from database
  let secret = token_secret;
  if (!secret || secret.startsWith('••••')) {
    const saved = db.prepare("SELECT value FROM settings WHERE key = 'proxmox_token_secret'").get();
    secret = saved?.value || '';
  }

  const pvePort = port || 8006;
  const baseUrl = `https://${host}:${pvePort}/api2/json`;
  const pveAgent = new https.Agent({ rejectUnauthorized: verify_ssl === 'true' || verify_ssl === true });

  try {
    const headers = {};
    if (token_id && secret) {
      headers['Authorization'] = `PVEAPIToken=${token_id}=${secret}`;
    }

    const versionRes = await axios.get(`${baseUrl}/version`, {
      headers,
      httpsAgent: pveAgent,
      timeout: 5000
    });

    res.json({
      success: true,
      mode: 'live',
      message: 'Połączono pomyślnie z API Proxmox VE',
      version: versionRes.data?.data?.version || '8.x'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.response?.data?.message || err.message || 'Nie można połączyć się z serwerem Proxmox VE'
    });
  }
});

// 2. Node Status (CPU, RAM, Disk, Uptime)
router.get('/node-status', async (req, res) => {
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

  const pvePort = settings.proxmox_port || 8006;
  const node = settings.proxmox_node || 'pve';
  const baseUrl = `https://${host}:${pvePort}/api2/json`;
  const pveAgent = new https.Agent({ rejectUnauthorized: settings.proxmox_verify_ssl === 'true' });

  try {
    const headers = {};
    if (settings.proxmox_token_id && settings.proxmox_token_secret) {
      headers['Authorization'] = `PVEAPIToken=${settings.proxmox_token_id}=${settings.proxmox_token_secret}`;
    }

    const [statusRes, rrdRes] = await Promise.all([
      axios.get(`${baseUrl}/nodes/${node}/status`, { headers, httpsAgent: pveAgent, timeout: 5000 }),
      axios.get(`${baseUrl}/version`, { headers, httpsAgent: pveAgent, timeout: 5000 }).catch(() => ({}))
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
      error: 'Proxmox API query failed: ' + (err.response?.data?.message || err.message)
    });
  }
});

// 3. LXC Containers List
router.get('/lxc-status', async (req, res) => {
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

  const pvePort = settings.proxmox_port || 8006;
  const node = settings.proxmox_node || 'pve';
  const baseUrl = `https://${host}:${pvePort}/api2/json`;
  const pveAgent = new https.Agent({ rejectUnauthorized: settings.proxmox_verify_ssl === 'true' });

  try {
    const headers = {};
    if (settings.proxmox_token_id && settings.proxmox_token_secret) {
      headers['Authorization'] = `PVEAPIToken=${settings.proxmox_token_id}=${settings.proxmox_token_secret}`;
    }

    const lxcRes = await axios.get(`${baseUrl}/nodes/${node}/lxc`, { headers, httpsAgent: pveAgent, timeout: 6000 });
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
    res.status(500).json({ error: 'Failed to fetch LXC containers: ' + err.message });
  }
});

export default router;
