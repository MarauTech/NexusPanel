import db from './db/index.js';

function seed() {
  const serviceCount = db.prepare("SELECT COUNT(*) as count FROM services").get();
  if (serviceCount.count > 0) {
    console.log('Data already exists, skipping seed');
    return;
  }

  db.transaction(() => {
    // Categories
    const catStmt = db.prepare("INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)");
    const infraId = catStmt.run('Infrastructure', 'server', '#6366f1', 1).lastInsertRowid;
    const servicesId = catStmt.run('Services', 'layers', '#8b5cf6', 2).lastInsertRowid;
    const monitoringId = catStmt.run('Monitoring', 'activity', '#10b981', 3).lastInsertRowid;
    const smartHomeId = catStmt.run('Smart Home', 'home', '#f59e0b', 4).lastInsertRowid;
    const mediaId = catStmt.run('Media', 'tv', '#ef4444', 5).lastInsertRowid;

    // Services
    const svcStmt = db.prepare(`
      INSERT INTO services (name, category_id, icon, url, health_check_enabled, favorite, color) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const proxmoxId = svcStmt.run('Proxmox', infraId, 'proxmox', 'https://192.168.1.10:8006', 1, 0, '#6366f1').lastInsertRowid;
    const routerId = svcStmt.run('Router', infraId, 'router', 'http://192.168.1.1', 1, 0, '#6366f1').lastInsertRowid;
    const asustorId = svcStmt.run('ASUSTOR NAS', infraId, 'asustor', 'https://192.168.1.20:8001', 0, 0, '#8b5cf6').lastInsertRowid;
    
    const portainerId = svcStmt.run('Portainer', servicesId, 'portainer', 'http://192.168.1.10:9000', 1, 0, '#6366f1').lastInsertRowid;
    const piholeId = svcStmt.run('Pi-hole', servicesId, 'pihole', 'http://192.168.1.2/admin', 0, 0, '#6366f1').lastInsertRowid;
    const nextcloudId = svcStmt.run('Nextcloud', servicesId, 'nextcloud', 'https://192.168.1.10:8443', 0, 0, '#6366f1').lastInsertRowid;

    const grafanaId = svcStmt.run('Grafana', monitoringId, 'grafana', 'http://192.168.1.10:3001', 1, 1, '#6366f1').lastInsertRowid;
    const kumaId = svcStmt.run('Uptime Kuma', monitoringId, 'uptime-kuma', 'http://192.168.1.10:3002', 0, 0, '#6366f1').lastInsertRowid;

    const haId = svcStmt.run('Home Assistant', smartHomeId, 'home-assistant', 'http://192.168.1.30:8123', 1, 1, '#6366f1').lastInsertRowid;
    
    const jellyfinId = svcStmt.run('Jellyfin', mediaId, 'jellyfin', 'http://192.168.1.10:8096', 0, 0, '#6366f1').lastInsertRowid;

    // Tags
    const tagStmt = db.prepare("INSERT INTO tags (name) VALUES (?)");
    const dockerTagId = tagStmt.run('docker').lastInsertRowid;
    const monitoringTagId = tagStmt.run('monitoring').lastInsertRowid;
    const networkTagId = tagStmt.run('network').lastInsertRowid;
    const nasTagId = tagStmt.run('nas').lastInsertRowid;
    const virtTagId = tagStmt.run('virtualization').lastInsertRowid;
    const shTagId = tagStmt.run('smart-home').lastInsertRowid;
    const mediaTagId = tagStmt.run('media').lastInsertRowid;

    // Link Tags
    const stStmt = db.prepare("INSERT INTO service_tags (service_id, tag_id) VALUES (?, ?)");
    stStmt.run(proxmoxId, virtTagId);
    stStmt.run(portainerId, dockerTagId);
    stStmt.run(routerId, networkTagId);
    stStmt.run(asustorId, nasTagId);
    stStmt.run(grafanaId, monitoringTagId);
    stStmt.run(haId, shTagId);
    stStmt.run(jellyfinId, mediaTagId);

    console.log('Seed completed: 5 categories, 10 services, 7 tags created.');
  })();
}

seed();
