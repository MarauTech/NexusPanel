import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateService, handleValidationErrors } from '../middleware/validation.js';

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

router.post('/seed-demo', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.transaction(() => {
      // Clear existing
      db.prepare("DELETE FROM service_tags").run();
      db.prepare("DELETE FROM tags").run();
      db.prepare("DELETE FROM services").run();
      db.prepare("DELETE FROM categories").run();

      const catStmt = db.prepare("INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)");
      const infraId = catStmt.run('Infrastructure', 'server', '#6366f1', 1).lastInsertRowid;
      const servicesId = catStmt.run('Services', 'layers', '#8b5cf6', 2).lastInsertRowid;
      const monitoringId = catStmt.run('Monitoring', 'activity', '#10b981', 3).lastInsertRowid;
      const smartHomeId = catStmt.run('Smart Home', 'home', '#f59e0b', 4).lastInsertRowid;
      const mediaId = catStmt.run('Media', 'tv', '#ef4444', 5).lastInsertRowid;

      const svcStmt = db.prepare(`
        INSERT INTO services (name, description, category_id, icon, url, health_check_enabled, health_check_type, favorite, color, custom_badge, health_status, health_response_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', ?)
      `);

      const proxmoxId = svcStmt.run('Proxmox VE', 'Virtualization host', infraId, 'proxmox', 'https://192.168.1.10:8006', 1, 'http', 1, '#e57000', 'Node 01', 14).lastInsertRowid;
      const routerId = svcStmt.run('Router Gateway', 'pfSense / OPNsense core gateway', infraId, 'router', 'http://192.168.1.1', 1, 'ping', 0, '#6366f1', 'Gateway', 2).lastInsertRowid;
      const asustorId = svcStmt.run('ASUSTOR NAS', 'Network Attached Storage', infraId, 'asustor', 'https://192.168.1.20:8001', 0, 'http', 0, '#8b5cf6', 'Storage', 28).lastInsertRowid;
      const portainerId = svcStmt.run('Portainer CE', 'Docker container management', servicesId, 'portainer', 'http://192.168.1.10:9000', 1, 'http', 0, '#13b5ea', 'Docker', 19).lastInsertRowid;
      const piholeId = svcStmt.run('Pi-hole DNS', 'Ad-blocking DNS server', servicesId, 'pihole', 'http://192.168.1.2/admin', 1, 'http', 0, '#ef4444', 'DNS', 5).lastInsertRowid;
      const nextcloudId = svcStmt.run('Nextcloud Hub', 'Self-hosted private cloud', servicesId, 'nextcloud', 'https://192.168.1.10:8443', 0, 'http', 0, '#0082c9', 'Files', 35).lastInsertRowid;
      const grafanaId = svcStmt.run('Grafana Telemetry', 'Homelab metrics & monitoring', monitoringId, 'grafana', 'http://192.168.1.10:3001', 1, 'http', 1, '#f59e0b', 'Metrics', 12).lastInsertRowid;
      const kumaId = svcStmt.run('Uptime Kuma', 'Service status monitor', monitoringId, 'uptime-kuma', 'http://192.168.1.10:3002', 1, 'http', 0, '#5cd65c', 'Status', 16).lastInsertRowid;
      const haId = svcStmt.run('Home Assistant', 'Smart home automation hub', smartHomeId, 'home-assistant', 'http://192.168.1.30:8123', 1, 'http', 1, '#0284c7', 'IoT', 22).lastInsertRowid;
      const jellyfinId = svcStmt.run('Jellyfin Media', 'Free software media system', mediaId, 'jellyfin', 'http://192.168.1.10:8096', 1, 'http', 0, '#9a59b5', 'Streaming', 18).lastInsertRowid;

      // Create tags
      const tagStmt = db.prepare("INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)");
      const dockerTagId = tagStmt.run('docker', '#13b5ea').lastInsertRowid;
      const monTagId = tagStmt.run('monitoring', '#10b981').lastInsertRowid;
      const netTagId = tagStmt.run('network', '#6366f1').lastInsertRowid;

      const linkStmt = db.prepare("INSERT INTO service_tags (service_id, tag_id) VALUES (?, ?)");
      linkStmt.run(portainerId, dockerTagId);
      linkStmt.run(grafanaId, monTagId);
      linkStmt.run(routerId, netTagId);

      // Seed mock history for visual SLA bars
      const histStmt = db.prepare("INSERT INTO service_health_history (service_id, status, response_time, checked_at) VALUES (?, ?, ?, datetime('now', ?))");
      const serviceIds = [proxmoxId, routerId, portainerId, piholeId, grafanaId, kumaId, haId, jellyfinId];
      for (const sId of serviceIds) {
        for (let k = 20; k >= 0; k--) {
          const isDegraded = k === 5 && sId === grafanaId;
          const status = isDegraded ? 'degraded' : 'online';
          const ms = isDegraded ? 1200 : (10 + Math.floor(Math.random() * 25));
          histStmt.run(sId, status, ms, `-${k * 5} minutes`);
        }
      }
    })();
    res.json({ success: true, message: 'Demo data loaded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed demo data: ' + err.message });
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
    db.saveSync();
    res.json({ success: true, message: 'All services cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear data: ' + err.message });
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
  
  for (const tagName of tagsArray) {
    insertTagStmt.run(tagName);
    const tag = getTagStmt.get(tagName);
    if (tag) linkStmt.run(serviceId, tag.id);
  }
};

router.post('/', authenticateToken, requireAdmin, validateService, handleValidationErrors, (req, res) => {
  const {
    name, description, url, category_id, icon, icon_type, icon_url, color, 
    sort_order, open_new_tab, enabled, favorite, health_check_enabled, 
    health_check_url, health_check_interval, health_check_type, custom_badge, notes, tags
  } = req.body;
  
  const result = db.prepare(`
    INSERT INTO services (
      name, description, url, category_id, icon, icon_type, icon_url, color, 
      sort_order, open_new_tab, enabled, favorite, health_check_enabled, 
      health_check_url, health_check_interval, health_check_type, custom_badge, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, description || '', url, category_id || null, icon || 'globe', icon_type || 'lucide', 
    icon_url || '', color || '#6366f1', sort_order || 0, 
    open_new_tab === undefined ? 1 : open_new_tab,
    enabled === undefined ? 1 : enabled,
    favorite || 0,
    health_check_enabled || 0,
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
  
  const result = db.prepare(`
    UPDATE services SET
      name = ?, description = ?, url = ?, category_id = ?, icon = ?, icon_type = ?, 
      icon_url = ?, color = ?, sort_order = ?, open_new_tab = ?, enabled = ?, 
      favorite = ?, health_check_enabled = ?, health_check_url = ?, 
      health_check_interval = ?, health_check_type = ?, custom_badge = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, description || '', url, category_id || null, icon || 'globe', icon_type || 'lucide', 
    icon_url || '', color || '#6366f1', sort_order || 0, 
    open_new_tab === undefined ? 1 : open_new_tab,
    enabled === undefined ? 1 : enabled,
    favorite || 0,
    health_check_enabled || 0,
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

export default router;
