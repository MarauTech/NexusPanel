import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateService, handleValidationErrors } from '../middleware/validation.js';
import { safeHttpRequest } from '../utils/networkSecurity.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { enabled } = req.query;
  let query = `
    SELECT s.*, c.name as category_name
    FROM services s
    LEFT JOIN categories c ON s.category_id = c.id
  `;
  const params = [];
  if (enabled === 'true' || enabled === '1') {
    query += ` WHERE s.enabled = 1`;
  }
  query += ` ORDER BY c.sort_order ASC, s.sort_order ASC`;
  
  const services = db.prepare(query).all(...params);
  
  // Fetch tags
  const tagsMap = {};
  const tagsRows = db.prepare(`
    SELECT st.service_id, t.*
    FROM service_tags st
    JOIN tags t ON st.tag_id = t.id
  `).all();
  
  for (const row of tagsRows) {
    if (!tagsMap[row.service_id]) tagsMap[row.service_id] = [];
    tagsMap[row.service_id].push({ id: row.id, name: row.name, color: row.color });
  }
  
  // Fetch health history (last 20 checks per service) & compute uptime percentage
  const historyMap = {};
  try {
    const historyRows = db.prepare(`
      SELECT service_id, status, response_time, checked_at
      FROM service_health_history
      ORDER BY id DESC
    `).all();

    for (const h of historyRows) {
      if (!historyMap[h.service_id]) historyMap[h.service_id] = [];
      if (historyMap[h.service_id].length < 20) {
        historyMap[h.service_id].unshift({
          status: h.status,
          responseTime: h.response_time,
          checkedAt: h.checked_at
        });
      }
    }
  } catch (e) {
    // ignore
  }

  for (const s of services) {
    s.tags = tagsMap[s.id] || [];
    const history = historyMap[s.id] || [];
    s.history = history;

    // Calculate Uptime percentage from history
    if (history.length > 0) {
      const upCount = history.filter(h => h.status === 'online' || h.status === 'degraded').length;
      s.uptime_percentage = ((upCount / history.length) * 100).toFixed(1);
    } else {
      s.uptime_percentage = s.health_status === 'online' ? '100.0' : (s.health_status === 'offline' ? '0.0' : '100.0');
    }
  }
  
  res.json(services);
});

// Conditional auth: skip auth during first-run setup, require admin otherwise
function requireAuthUnlessFirstRun(req, res, next) {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'setup_completed'").get();
    const setupDone = row && (row.value === '1' || row.value === 'true');
    if (!setupDone) return next();
    return authenticateToken(req, res, () => requireAdmin(req, res, next));
  } catch (err) {
    return next();
  }
}

router.post('/seed-demo', requireAuthUnlessFirstRun, (req, res) => {
  const lang = req.body?.language || 'pl';
  const isEn = lang === 'en';

  try {
    db.transaction(() => {
      // Clear existing
      db.prepare("DELETE FROM service_tags").run();
      db.prepare("DELETE FROM tags").run();
      db.prepare("DELETE FROM services").run();
      db.prepare("DELETE FROM categories").run();

      const catStmt = db.prepare("INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)");
      const infraId = catStmt.run(isEn ? 'Infrastructure' : 'Infrastruktura', 'server', '#6366f1', 1).lastInsertRowid;
      const servicesId = catStmt.run(isEn ? 'Services' : 'Usługi', 'layers', '#8b5cf6', 2).lastInsertRowid;
      const monitoringId = catStmt.run(isEn ? 'Monitoring' : 'Monitoring', 'activity', '#10b981', 3).lastInsertRowid;
      const smartHomeId = catStmt.run(isEn ? 'Smart Home' : 'Smart Home', 'home', '#f59e0b', 4).lastInsertRowid;
      const mediaId = catStmt.run(isEn ? 'Media' : 'Media', 'tv', '#ef4444', 5).lastInsertRowid;

      const svcStmt = db.prepare(`
        INSERT INTO services (name, description, category_id, icon, url, health_check_enabled, health_check_type, favorite, color, custom_badge, health_status, health_response_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', ?)
      `);

      const proxmoxId = svcStmt.run(
        'Proxmox VE', 
        isEn ? 'Virtualization & LXC Node' : 'Węzeł wirtualizacji i kontenerów LXC', 
        infraId, 'proxmox', 'https://192.168.1.10:8006', 1, 'http', 1, '#e57000', 'Node 01', 14
      ).lastInsertRowid;

      const routerId = svcStmt.run(
        'Router Gateway', 
        isEn ? 'Main network gateway & router' : 'Główna brama sieciowa i router', 
        infraId, 'router', 'http://192.168.1.1', 1, 'ping', 0, '#6366f1', isEn ? 'Gateway' : 'Brama', 2
      ).lastInsertRowid;

      const asustorId = svcStmt.run(
        'ASUSTOR NAS', 
        isEn ? 'Network storage and backups' : 'Magazyn danych i backupów', 
        infraId, 'asustor', 'https://192.168.1.20:8001', 0, 'http', 0, '#3b82f6', 'NAS', 28
      ).lastInsertRowid;

      const portainerId = svcStmt.run(
        'Portainer CE', 
        isEn ? 'Docker container management' : 'Zarządzanie kontenerami Docker', 
        servicesId, 'portainer', 'http://192.168.1.10:9000', 1, 'http', 0, '#0ea5e9', 'Docker', 19
      ).lastInsertRowid;

      const haId = svcStmt.run(
        'Home Assistant', 
        isEn ? 'Smart home automation hub' : 'Centrum automatyki domowej', 
        smartHomeId, 'home-assistant', 'http://192.168.1.30:8123', 1, 'http', 1, '#0284c7', 'Hub', 8
      ).lastInsertRowid;

      const grafanaId = svcStmt.run(
        'Grafana', 
        isEn ? 'Metrics & logs visualization' : 'Wizualizacja metryk Prometheus', 
        monitoringId, 'grafana', 'http://192.168.1.10:3000', 1, 'http', 1, '#f97316', isEn ? 'Charts' : 'Wykresy', 35
      ).lastInsertRowid;

      const uptimeId = svcStmt.run(
        'Uptime Kuma', 
        isEn ? 'Service availability monitor' : 'Monitor dostępności usług', 
        monitoringId, 'uptime-kuma', 'http://192.168.1.10:3001', 0, 'http', 0, '#10b981', 'Monitor', 12
      ).lastInsertRowid;

      const piholeId = svcStmt.run(
        'Pi-hole DNS', 
        isEn ? 'Network-wide ad blocking' : 'Blokowanie reklam i serwer DNS', 
        servicesId, 'pihole', 'http://192.168.1.2/admin', 0, 'http', 0, '#ef4444', 'DNS', 5
      ).lastInsertRowid;

      const jellyfinId = svcStmt.run(
        'Jellyfin', 
        isEn ? 'Open-source media server' : 'Serwer multimediów', 
        mediaId, 'jellyfin', 'http://192.168.1.10:8096', 0, 'http', 0, '#8b5cf6', 'Media', 45
      ).lastInsertRowid;

      const nextcloudId = svcStmt.run(
        'Nextcloud', 
        isEn ? 'Self-hosted cloud storage' : 'Prywatna chmura plików', 
        servicesId, 'nextcloud', 'https://192.168.1.10:8443', 0, 'http', 0, '#0284c7', 'Cloud', 60
      ).lastInsertRowid;

      const tagStmt = db.prepare("INSERT INTO tags (name, color) VALUES (?, ?)");
      const tDocker = tagStmt.run('docker', '#0ea5e9').lastInsertRowid;
      const tMon = tagStmt.run('monitoring', '#10b981').lastInsertRowid;
      const tNet = tagStmt.run(isEn ? 'network' : 'sieć', '#6366f1').lastInsertRowid;
      const tNas = tagStmt.run('nas', '#3b82f6').lastInsertRowid;
      const tPve = tagStmt.run(isEn ? 'virtualization' : 'wirtualizacja', '#e57000').lastInsertRowid;

      const linkStmt = db.prepare("INSERT INTO service_tags (service_id, tag_id) VALUES (?, ?)");
      linkStmt.run(proxmoxId, tPve);
      linkStmt.run(portainerId, tDocker);
      linkStmt.run(routerId, tNet);
      linkStmt.run(asustorId, tNas);
      linkStmt.run(grafanaId, tMon);
      linkStmt.run(uptimeId, tMon);
    })();

    res.json({ message: 'Demo template data seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clear', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.transaction(() => {
      db.prepare("DELETE FROM service_tags").run();
      db.prepare("DELETE FROM tags").run();
      db.prepare("DELETE FROM services").run();
      db.prepare("DELETE FROM categories").run();
    })();
    res.json({ message: 'Dashboard cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!service) return res.status(404).json({ error: 'Not found' });
  
  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN service_tags st ON st.tag_id = t.id
    WHERE st.service_id = ?
  `).all(service.id);
  
  service.tags = tags;
  res.json(service);
});

const syncTags = (serviceId, tagsArray) => {
  db.prepare("DELETE FROM service_tags WHERE service_id = ?").run(serviceId);
  if (!tagsArray || !tagsArray.length) return;
  
  const insertTagStmt = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
  const getTagStmt = db.prepare("SELECT id FROM tags WHERE name = ?");
  const linkStmt = db.prepare("INSERT INTO service_tags (service_id, tag_id) VALUES (?, ?)");
  
  for (const item of tagsArray) {
    const tagName = typeof item === 'string' ? item.trim() : (item?.name ? String(item.name).trim() : '');
    if (!tagName) continue;
    insertTagStmt.run(tagName);
    const tag = getTagStmt.get(tagName);
    if (tag) linkStmt.run(serviceId, tag.id);
  }
};

// Fast patch endpoint for favorite toggle
router.patch('/:id/favorite', authenticateToken, requireAdmin, (req, res) => {
  const { favorite } = req.body;
  const val = (favorite === 1 || favorite === true || favorite === '1') ? 1 : 0;
  try {
    const result = db.prepare("UPDATE services SET favorite = ?, updated_at = datetime('now') WHERE id = ?").run(val, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ success: true, favorite: val });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fast patch endpoint for enabled/disabled toggle
router.patch('/:id/toggle', authenticateToken, requireAdmin, (req, res) => {
  const { enabled } = req.body;
  const val = (enabled === 1 || enabled === true || enabled === '1') ? 1 : 0;
  try {
    const result = db.prepare("UPDATE services SET enabled = ?, updated_at = datetime('now') WHERE id = ?").run(val, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ success: true, enabled: val });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, requireAdmin, validateService, handleValidationErrors, (req, res) => {
  const {
    name, description, url, category_id, icon, icon_type, icon_url, color, 
    sort_order, open_new_tab, enabled, favorite, health_check_enabled, 
    health_check_url, health_check_interval, health_check_type, custom_badge, notes, tags
  } = req.body;
  
  const parsedCatId = category_id ? parseInt(category_id, 10) : null;
  const isNewTab = open_new_tab === 0 || open_new_tab === false ? 0 : 1;
  const isEnabled = enabled === 0 || enabled === false ? 0 : 1;
  const isFav = favorite === 1 || favorite === true ? 1 : 0;
  const isHealth = health_check_enabled === 1 || health_check_enabled === true ? 1 : 0;

  const result = db.prepare(`
    INSERT INTO services (
      name, description, url, category_id, icon, icon_type, icon_url, color, 
      sort_order, open_new_tab, enabled, favorite, health_check_enabled, 
      health_check_url, health_check_interval, health_check_type, custom_badge, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, description || '', url, parsedCatId, icon || 'globe', icon_type || 'lucide', 
    icon_url || '', color || '#6366f1', sort_order || 0, 
    isNewTab,
    isEnabled,
    isFav,
    isHealth,
    health_check_url || '',
    health_check_interval || 60,
    health_check_type || 'http',
    custom_badge || '',
    notes || ''
  );
  
  db.transaction(() => {
    if (tags && Array.isArray(tags)) syncTags(result.lastInsertRowid, tags);
  })();
  
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/reorder', authenticateToken, requireAdmin, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Invalid payload' });
  
  const stmt = db.prepare("UPDATE services SET sort_order = ? WHERE id = ?");
  db.transaction(() => {
    for (const item of items) {
      stmt.run(item.sort_order, item.id);
    }
  })();
  
  res.json({ success: true });
});

router.put('/:id', authenticateToken, requireAdmin, validateService, handleValidationErrors, (req, res) => {
  const {
    name, description, url, category_id, icon, icon_type, icon_url, color, 
    sort_order, open_new_tab, enabled, favorite, health_check_enabled, 
    health_check_url, health_check_interval, health_check_type, custom_badge, notes, tags
  } = req.body;

  const parsedCatId = category_id ? parseInt(category_id, 10) : null;
  const isNewTab = open_new_tab === 0 || open_new_tab === false ? 0 : 1;
  const isEnabled = enabled === 0 || enabled === false ? 0 : 1;
  const isFav = favorite === 1 || favorite === true ? 1 : 0;
  const isHealth = health_check_enabled === 1 || health_check_enabled === true ? 1 : 0;

  const result = db.prepare(`
    UPDATE services SET
      name = ?, description = ?, url = ?, category_id = ?, icon = ?, icon_type = ?, 
      icon_url = ?, color = ?, sort_order = ?, open_new_tab = ?, enabled = ?, 
      favorite = ?, health_check_enabled = ?, health_check_url = ?, 
      health_check_interval = ?, health_check_type = ?, custom_badge = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, description || '', url, parsedCatId, icon || 'globe', icon_type || 'lucide', 
    icon_url || '', color || '#6366f1', sort_order || 0, 
    isNewTab,
    isEnabled,
    isFav,
    isHealth,
    health_check_url || '',
    health_check_interval || 60,
    health_check_type || 'http',
    custom_badge || '',
    notes || '',
    req.params.id
  );
  
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  
  db.transaction(() => {
    if (tags && Array.isArray(tags)) syncTags(req.params.id, tags);
  })();
  
  res.json({ success: true });
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM services WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

router.post('/:id/probe', async (req, res) => {
  const service = db.prepare('SELECT id, name, url, health_check_url FROM services WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const targetUrl = (service.health_check_url && service.health_check_url.trim()) || service.url;
  const startTime = Date.now();

  try {
    const response = await safeHttpRequest(targetUrl, {
      timeout: 5000,
      verifySsl: false
    });

    const responseTime = Date.now() - startTime;
    const status = responseTime < 1000 ? 'online' : 'degraded';

    res.json({
      status,
      responseTime,
      httpStatus: response.status,
      checkedAt: new Date().toISOString(),
      serviceId: service.id
    });
  } catch (err) {
    res.json({
      status: 'offline',
      responseTime: null,
      error: err.message || 'Host unreachable',
      checkedAt: new Date().toISOString(),
      serviceId: service.id
    });
  }
});

export default router;
