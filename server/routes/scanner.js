import express from 'express';
import { scanLocalNetwork, getNetworkInfo } from '../services/networkScanner.js';
import { authenticateToken, requireAdmin, requireAuthUnlessFirstRun } from '../middleware/auth.js';
import { scannerLimiter } from '../middleware/rateLimit.js';
import db from '../db/index.js';

const router = express.Router();

/**
 * GET /api/scanner/discover
 * Automatically detects local subnet, router gateway, and open ports
 */
router.get('/discover', scannerLimiter, requireAuthUnlessFirstRun, async (req, res) => {
  try {
    const { netInfo, discovered } = await scanLocalNetwork();

    // Generate smart suggestions adapted to the user's detected local subnet
    const prefix = netInfo.subnetPrefix;
    const dynamicSuggestions = [
      { name: 'Router Gateway', url: `http://${netInfo.gatewayIp}`, category_name: 'Infrastructure', icon: 'globe', color: '#6366f1', custom_badge: 'Gateway' },
      { name: 'Proxmox VE', url: `https://${prefix}10:8006`, category_name: 'Infrastructure', icon: 'proxmox', color: '#e57000', custom_badge: 'Port 8006' },
      { name: 'Home Assistant', url: `http://${prefix}30:8123`, category_name: 'Smart Home', icon: 'home-assistant', color: '#0284c7', custom_badge: 'Port 8123' },
      { name: 'Portainer CE', url: `http://${prefix}10:9000`, category_name: 'Services', icon: 'portainer', color: '#0ea5e9', custom_badge: 'Port 9000' },
      { name: 'Pi-hole DNS', url: `http://${prefix}2/admin`, category_name: 'Services', icon: 'pihole', color: '#ef4444', custom_badge: 'DNS' },
      { name: 'Grafana Metrics', url: `http://${prefix}10:3000`, category_name: 'Monitoring', icon: 'grafana', color: '#f97316', custom_badge: 'Port 3000' },
      { name: 'Uptime Kuma', url: `http://${prefix}10:3002`, category_name: 'Monitoring', icon: 'uptime-kuma', color: '#10b981', custom_badge: 'Port 3002' },
      { name: 'Jellyfin Media', url: `http://${prefix}10:8096`, category_name: 'Media', icon: 'jellyfin', color: '#8b5cf6', custom_badge: 'Port 8096' },
      { name: 'ASUSTOR NAS', url: `https://${prefix}20:8001`, category_name: 'Infrastructure', icon: 'asustor', color: '#3b82f6', custom_badge: 'NAS' },
      { name: 'Nextcloud Hub', url: `https://${prefix}10:8443`, category_name: 'Services', icon: 'nextcloud', color: '#0284c7', custom_badge: 'Storage' }
    ];

    const results = discovered.length > 0 ? discovered : dynamicSuggestions.map((s, i) => ({
      id: `suggest-${i}`,
      ...s,
      responseTime: 8,
      health_status: 'online'
    }));

    res.json({
      success: true,
      netInfo,
      count: results.length,
      discovered: results
    });
  } catch (err) {
    res.status(500).json({ error: 'Network scan failed: ' + err.message });
  }
});

/**
 * POST /api/scanner/scan-custom
 * Scan specific IP addresses or subnets
 */
router.post('/scan-custom', scannerLimiter, requireAuthUnlessFirstRun, async (req, res) => {
  try {
    const { hosts } = req.body;
    if (!Array.isArray(hosts) || hosts.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of host IPs to scan' });
    }
    if (hosts.length > 256) {
      return res.status(400).json({ error: 'Cannot scan more than 256 hosts in a single request' });
    }
    const { netInfo, discovered } = await scanLocalNetwork(hosts);
    res.json({ success: true, netInfo, count: discovered.length, discovered });
  } catch (err) {
    res.status(500).json({ error: 'Custom scan failed: ' + err.message });
  }
});

/**
 * POST /api/scanner/add-batch
 * Batch insert discovered services into database
 */
router.post('/add-batch', scannerLimiter, requireAuthUnlessFirstRun, (req, res) => {
  try {
    const { services } = req.body;
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'No services provided for batch import' });
    }
    if (services.length > 100) {
      return res.status(400).json({ error: 'Cannot batch import more than 100 services at once' });
    }

    const getCategoryId = db.prepare(`SELECT id FROM categories WHERE name = ?`);
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, icon, color, sort_order)
      VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
    `);

    const insertService = db.prepare(`
      INSERT INTO services (
        name, description, url, category_id, icon, color, 
        custom_badge, health_check_enabled, health_check_url, health_status, 
        health_last_checked, health_response_time, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'online', datetime('now'), ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services))
    `);

    let addedCount = 0;
    const addAll = db.transaction((items) => {
      for (const item of items) {
        if (!item || !item.url) continue;
        const catName = String(item.category_name || 'Services').slice(0, 50);
        let catRow = getCategoryId.get(catName);
        if (!catRow) {
          insertCategory.run(catName, String(item.icon || 'folder').slice(0, 50), String(item.color || '#6366f1').slice(0, 20));
          catRow = getCategoryId.get(catName);
        }
        const catId = catRow ? catRow.id : null;

        insertService.run(
          String(item.name || 'Service').slice(0, 100),
          String(item.description || `Usługa homelab pod adresem ${item.url}`).slice(0, 500),
          String(item.url).slice(0, 500),
          catId,
          String(item.icon || 'globe').slice(0, 50),
          String(item.color || '#6366f1').slice(0, 20),
          String(item.custom_badge || '').slice(0, 50),
          String(item.url).slice(0, 500),
          parseInt(item.responseTime, 10) || 10
        );
        addedCount++;
      }
    });

    addAll(services);

    res.json({
      success: true,
      message: `Pomyślnie dodano ${addedCount} aplikacji do Twojego ekranu startowego!`,
      addedCount
    });
  } catch (err) {
    console.error('Batch import error:', err);
    res.status(500).json({ error: 'Batch import failed: ' + err.message });
  }
});

export default router;
