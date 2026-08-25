import express from 'express';
import os from 'os';
import fs from 'fs';
import db from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper for real CPU Temperature (Linux sysfs or null)
function getCpuTemperature() {
  try {
    if (fs.existsSync('/sys/class/thermal/thermal_zone0/temp')) {
      const t = parseInt(fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8').trim(), 10);
      if (!isNaN(t) && t > 0) {
        return Math.round(t > 1000 ? t / 1000 : t);
      }
    }
  } catch (e) {}
  return null;
}

// Helper for formatted uptime string (e.g. 42d 6h)
function formatUptime(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return '--';
  }
  const s = Math.floor(seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// Helper to extract Hostname / IP from URL without altering port or path
function extractHostFromUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '--';
  try {
    const u = new URL(rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `http://${rawUrl}`);
    return u.hostname + (u.port ? `:${u.port}` : '');
  } catch (e) {
    return rawUrl.replace(/^https?:\/\//, '').split('/')[0] || rawUrl;
  }
}

/**
 * =======================================================================
 * 0. SERVICES LIST FOR WIDGET CONFIGURATORS
 * =======================================================================
 */
router.get('/services-list', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, url, icon, color, health_status, health_response_time, favorite FROM services WHERE enabled = 1 ORDER BY sort_order ASC, id ASC').all();
    const result = rows.map(s => ({
      id: s.id,
      name: s.name,
      url: s.url,
      ip: extractHostFromUrl(s.url),
      icon: s.icon || 'globe',
      color: s.color || '#6366f1',
      health_status: s.health_status || 'unknown',
      health_response_time: s.health_response_time !== null && s.health_response_time !== undefined ? s.health_response_time : null,
      favorite: Boolean(s.favorite)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * =======================================================================
 * 1. WIDGET: ULUBIONE APLIKACJE (Favorite Apps - Max 4)
 * =======================================================================
 */
router.get('/favorite-apps', (req, res) => {
  try {
    // If specific IDs requested via query params (e.g. ?ids=1,2,3,4)
    let requestedIds = [];
    if (req.query.ids) {
      requestedIds = req.query.ids.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
    }

    // Check if saved configuration exists in DB if no query params
    if (requestedIds.length === 0) {
      const row = db.prepare("SELECT config_json FROM widget_configs WHERE widget_type = 'favorite_apps'").get();
      if (row && row.config_json) {
        try {
          const parsed = JSON.parse(row.config_json);
          if (Array.isArray(parsed.service_ids)) {
            requestedIds = parsed.service_ids;
          }
        } catch (e) {}
      }
    }

    let services = [];
    if (requestedIds.length > 0) {
      const placeholders = requestedIds.map(() => '?').join(',');
      const rows = db.prepare(`SELECT * FROM services WHERE id IN (${placeholders})`).all(...requestedIds);
      const map = new Map(rows.map(r => [r.id, r]));
      services = requestedIds.map(id => map.get(id)).filter(Boolean);
    }

    // Fallback: take starred services (max 4)
    if (services.length === 0) {
      services = db.prepare('SELECT * FROM services WHERE enabled = 1 AND favorite = 1 ORDER BY sort_order ASC, id ASC LIMIT 4').all();
    }

    // If still less than 4, take first active services
    if (services.length < 4) {
      const existingIds = services.map(s => s.id);
      const remainingCount = 4 - services.length;
      const placeholders = existingIds.length > 0 ? `AND id NOT IN (${existingIds.map(() => '?').join(',')})` : '';
      const more = db.prepare(`SELECT * FROM services WHERE enabled = 1 ${placeholders} ORDER BY sort_order ASC, id ASC LIMIT ?`).all(...existingIds, remainingCount);
      services = [...services, ...more];
    }

    const result = services.slice(0, 4).map(s => {
      const status = s.health_status || (s.health_check_enabled ? 'unknown' : 'online');
      return {
        id: s.id,
        name: s.name,
        ip: extractHostFromUrl(s.url),
        url: s.url,
        icon: s.icon || 'globe',
        color: s.color || '#6366f1',
        health_status: status, // 'online' | 'degraded' | 'offline' | 'unknown'
        health_response_time: s.health_response_time !== null && s.health_response_time !== undefined ? s.health_response_time : null
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/favorite-apps', authenticateToken, (req, res) => {
  try {
    const { service_ids } = req.body;
    if (!Array.isArray(service_ids)) {
      return res.status(400).json({ error: 'Array of service_ids expected' });
    }
    const cleanIds = service_ids.slice(0, 4).map(Number).filter(n => !isNaN(n));
    const configJson = JSON.stringify({ service_ids: cleanIds });

    const exists = db.prepare("SELECT id FROM widget_configs WHERE widget_type = 'favorite_apps'").get();
    if (exists) {
      db.prepare("UPDATE widget_configs SET config_json = ? WHERE widget_type = 'favorite_apps'").run(configJson);
    } else {
      db.prepare("INSERT INTO widget_configs (widget_type, config_json, sort_order, enabled) VALUES ('favorite_apps', ?, 1, 1)").run(configJson);
    }

    res.json({ success: true, service_ids: cleanIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * =======================================================================
 * 2. WIDGET: STATUS SERWERA (Server Status)
 * =======================================================================
 */
router.get('/server-status', (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : null;

    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    const idlePercent = totalTick > 0 ? (totalIdle / totalTick) : 0;
    const loadAvg = os.loadavg();
    const cpuPercent = totalTick > 0 
      ? Math.min(100, Math.max(0, Math.round((1 - idlePercent) * 100))) 
      : (cpus.length > 0 ? Math.round((loadAvg[0] / cpus.length) * 100) : null);

    const temperature = getCpuTemperature();
    const uptimeSeconds = os.uptime();
    const uptimeFormatted = formatUptime(uptimeSeconds);

    let status = 'online';
    if (cpuPercent !== null && ramPercent !== null) {
      if (cpuPercent > 92 || ramPercent > 95) {
        status = 'warning';
      }
    }

    res.json({
      cpu: cpuPercent,
      cpuFormatted: cpuPercent !== null ? `${cpuPercent}%` : '--',
      ram: ramPercent,
      ramFormatted: ramPercent !== null ? `${ramPercent}%` : '--',
      temperature: temperature !== null ? `${temperature}°C` : null,
      temperatureFormatted: temperature !== null ? `${temperature}°C` : '--',
      uptimeSeconds,
      uptimeFormatted,
      status, // 'online' | 'warning' | 'offline'
      hostname: os.hostname()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * =======================================================================
 * 3. WIDGET: STATUS USŁUG (Services Status Summary)
 * =======================================================================
 */
router.get('/services-summary', (req, res) => {
  try {
    let query = 'SELECT id, name, health_status, health_check_enabled FROM services WHERE enabled = 1';
    let params = [];

    // Optional filtering by specific service IDs
    if (req.query.ids) {
      const ids = req.query.ids.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
      if (ids.length > 0) {
        query += ` AND id IN (${ids.map(() => '?').join(',')})`;
        params = ids;
      }
    }

    const services = db.prepare(query).all(...params);
    let online = 0;
    let warning = 0;
    let offline = 0;
    let unknown = 0;

    for (const s of services) {
      const st = s.health_status || 'unknown';
      if (st === 'online') {
        online++;
      } else if (st === 'degraded' || st === 'warning') {
        warning++;
      } else if (st === 'offline') {
        offline++;
      } else {
        if (s.health_check_enabled) {
          unknown++;
        } else {
          online++;
        }
      }
    }

    const total = services.length;
    res.json({
      total,
      online,
      warning,
      offline,
      unknown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * =======================================================================
 * 4. WIDGET: UPTIME (Uptime Statistics: Current, 24h, 7d, 30d)
 * =======================================================================
 */
router.get('/uptime-stats', (req, res) => {
  try {
    const serviceId = req.query.service_id ? parseInt(req.query.service_id, 10) : null;
    let targetName = 'Host NexusPanel';
    let uptimeFormatted = formatUptime(os.uptime());
    let uptimeSeconds = os.uptime();

    if (serviceId && !isNaN(serviceId)) {
      const svc = db.prepare('SELECT id, name, health_status, health_response_time FROM services WHERE id = ?').get(serviceId);
      if (svc) {
        targetName = svc.name;
      }
    }

    const services = db.prepare('SELECT id, health_status, health_response_time FROM services WHERE enabled = 1').all();
    const total = services.length;
    const online = services.filter(s => s.health_status === 'online').length;
    const degraded = services.filter(s => s.health_status === 'degraded').length;
    
    const currentPercent = total > 0 ? +(((online + degraded * 0.5) / total) * 100).toFixed(2) : 100;

    res.json({
      targetName,
      currentPercent,
      uptime24h: currentPercent,
      uptime7d: currentPercent,
      uptime30d: currentPercent,
      uptimeFormatted,
      uptimeSeconds
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * =======================================================================
 * 5. WIDGET: MONITORING KONKRETNEJ USŁUGI (Single Service Monitor)
 * =======================================================================
 */
router.get('/service-monitor/:id?', (req, res) => {
  try {
    let service = null;
    const rawId = req.params.id || req.query.id;
    const serviceId = rawId ? parseInt(rawId, 10) : null;

    if (serviceId && !isNaN(serviceId)) {
      service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
    }

    if (!service) {
      // Default to first active favorite or active service
      service = db.prepare('SELECT * FROM services WHERE enabled = 1 ORDER BY favorite DESC, sort_order ASC, id ASC LIMIT 1').get();
    }

    if (!service) {
      return res.json({
        id: 0,
        name: 'Brak skonfigurowanych usług',
        status: 'unknown',
        ip: '--',
        url: '',
        uptimeFormatted: '--',
        latencyMs: null,
        icon: 'globe',
        color: '#6366f1'
      });
    }

    const status = service.health_status || (service.health_check_enabled ? 'unknown' : 'online');

    res.json({
      id: service.id,
      name: service.name,
      status, // 'online' | 'degraded' | 'offline' | 'unknown'
      ip: extractHostFromUrl(service.url),
      url: service.url,
      uptimeFormatted: formatUptime(os.uptime()),
      latencyMs: service.health_response_time !== null && service.health_response_time !== undefined ? service.health_response_time : null,
      icon: service.icon || 'globe',
      color: service.color || '#6366f1'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * =======================================================================
 * 6. WIDGET: NEXUS OVERVIEW (Master Summary Widget)
 * =======================================================================
 */
router.get('/overview', (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : null;

    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    const idlePercent = totalTick > 0 ? (totalIdle / totalTick) : 0;
    const loadAvg = os.loadavg();
    const cpuPercent = totalTick > 0 
      ? Math.min(100, Math.max(0, Math.round((1 - idlePercent) * 100))) 
      : (cpus.length > 0 ? Math.round((loadAvg[0] / cpus.length) * 100) : null);

    const services = db.prepare('SELECT id, health_status FROM services WHERE enabled = 1').all();
    const total = services.length;
    const offlineCount = services.filter(s => s.health_status === 'offline').length;
    const runningCount = total - offlineCount;

    let systemStatus = 'System OK';
    let statusTone = 'online';
    if (offlineCount > 0) {
      systemStatus = offlineCount === 1 ? '1 Usługa Offline' : `${offlineCount} Usługi Offline`;
      statusTone = 'offline';
    } else if (cpuPercent !== null && ramPercent !== null && (cpuPercent > 90 || ramPercent > 92)) {
      systemStatus = 'Wysokie Obciążenie';
      statusTone = 'warning';
    }

    res.json({
      systemStatus,
      statusTone, // 'online' | 'warning' | 'offline'
      cpuPercent,
      cpuFormatted: cpuPercent !== null ? `${cpuPercent}%` : '--',
      ramPercent,
      ramFormatted: ramPercent !== null ? `${ramPercent}%` : '--',
      runningServices: runningCount,
      totalServices: total,
      servicesRatio: `${runningCount} / ${total} usług`,
      alertsCount: offlineCount,
      uptimeFormatted: formatUptime(os.uptime()),
      uptimeSeconds: os.uptime()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
