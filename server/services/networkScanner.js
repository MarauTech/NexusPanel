import net from 'net';
import axios from 'axios';
import https from 'https';
import os from 'os';

const COMMON_HOMELAB_PORTS = [
  { port: 8006, name: 'Proxmox VE', category: 'Infrastructure', icon: 'proxmox', color: '#e57000', defaultProto: 'https', path: '' },
  { port: 8123, name: 'Home Assistant', category: 'Smart Home', icon: 'home-assistant', color: '#0284c7', defaultProto: 'http', path: '' },
  { port: 9000, name: 'Portainer CE', category: 'Services', icon: 'portainer', color: '#0ea5e9', defaultProto: 'http', path: '' },
  { port: 9443, name: 'Portainer SSL', category: 'Services', icon: 'portainer', color: '#0ea5e9', defaultProto: 'https', path: '' },
  { port: 3001, name: 'Uptime Kuma', category: 'Monitoring', icon: 'uptime-kuma', color: '#10b981', defaultProto: 'http', path: '' },
  { port: 3000, name: 'NexusPanel / Dashboard', category: 'Monitoring', icon: 'grafana', color: '#6366f1', defaultProto: 'http', path: '' },
  { port: 8096, name: 'Jellyfin Media', category: 'Media', icon: 'jellyfin', color: '#8b5cf6', defaultProto: 'http', path: '' },
  { port: 32400, name: 'Plex Media Server', category: 'Media', icon: 'plex', color: '#eab308', defaultProto: 'http', path: '/web' },
  { port: 80, name: 'Serwer WWW (HTTP)', category: 'Infrastructure', icon: 'globe', color: '#6366f1', defaultProto: 'http', path: '' },
  { port: 443, name: 'Serwer WWW (HTTPS)', category: 'Infrastructure', icon: 'shield', color: '#6366f1', defaultProto: 'https', path: '' },
  { port: 8080, name: 'Aplikacja Web (8080)', category: 'Services', icon: 'server', color: '#6366f1', defaultProto: 'http', path: '' },
  { port: 8443, name: 'Nextcloud Hub', category: 'Services', icon: 'nextcloud', color: '#0284c7', defaultProto: 'https', path: '' },
  { port: 8001, name: 'ASUSTOR NAS', category: 'Infrastructure', icon: 'asustor', color: '#3b82f6', defaultProto: 'https', path: '' },
  { port: 5000, name: 'Synology DSM', category: 'Infrastructure', icon: 'synology', color: '#0284c7', defaultProto: 'http', path: '' },
  { port: 5001, name: 'Synology DSM SSL', category: 'Infrastructure', icon: 'synology', color: '#0284c7', defaultProto: 'https', path: '' },
  { port: 8989, name: 'Sonarr', category: 'Media', icon: 'sonarr', color: '#0ea5e9', defaultProto: 'http', path: '' },
  { port: 7878, name: 'Radarr', category: 'Media', icon: 'radarr', color: '#eab308', defaultProto: 'http', path: '' },
  { port: 8085, name: 'qBittorrent', category: 'Media', icon: 'qbittorrent', color: '#3b82f6', defaultProto: 'http', path: '' },
  { port: 9091, name: 'Transmission', category: 'Media', icon: 'transmission', color: '#ef4444', defaultProto: 'http', path: '' },
  { port: 8181, name: 'Nginx Proxy Manager', category: 'Services', icon: 'nginx', color: '#10b981', defaultProto: 'http', path: '' },
  { port: 8384, name: 'Syncthing', category: 'Services', icon: 'folder', color: '#0ea5e9', defaultProto: 'http', path: '' },
  { port: 19999, name: 'Netdata Monitor', category: 'Monitoring', icon: 'activity', color: '#10b981', defaultProto: 'http', path: '' },
  { port: 9090, name: 'Prometheus', category: 'Monitoring', icon: 'activity', color: '#f97316', defaultProto: 'http', path: '' }
];

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Get active network information (subnet, local IP, gateway)
 */
export function getNetworkInfo() {
  const ifaces = os.networkInterfaces();
  let localIp = '127.0.0.1';
  let subnetPrefix = '192.168.1.';
  let gatewayIp = '192.168.1.1';
  let netmask = '255.255.255.0';

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address;
        netmask = iface.netmask || '255.255.255.0';
        const parts = localIp.split('.');
        if (parts.length === 4) {
          subnetPrefix = `${parts[0]}.${parts[1]}.${parts[2]}.`;
          gatewayIp = `${parts[0]}.${parts[1]}.${parts[2]}.1`;
        }
        break;
      }
    }
  }

  return {
    localIp,
    subnetPrefix,
    gatewayIp,
    netmask,
    subnet: `${subnetPrefix}0/24`
  };
}

/**
 * Fast TCP probe with 350ms timeout
 */
function probePort(host, port, timeout = 350) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const responseTime = Date.now() - start;
      socket.destroy();
      resolve({ open: true, responseTime });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ open: false });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ open: false });
    });

    socket.connect(port, host);
  });
}

/**
 * Probe HTTP response to extract HTML page title or header
 */
async function probeHttpTitle(url) {
  try {
    const res = await axios.get(url, {
      timeout: 1000,
      httpsAgent,
      headers: { 'User-Agent': 'NexusPanel-Scanner/1.0' },
      maxRedirects: 2,
      responseType: 'text'
    });
    if (res.data && typeof res.data === 'string') {
      const match = res.data.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title && title.length < 50) return title;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Parallel concurrent network scanner without duplicate loopbacks
 */
export async function scanLocalNetwork(targetHosts = []) {
  const netInfo = getNetworkInfo();

  if (!targetHosts || targetHosts.length === 0) {
    // Only real network IPs (no 127.0.0.1 or localhost duplicates)
    targetHosts = [netInfo.gatewayIp, netInfo.localIp];
    
    // Add common homelab candidate addresses in the detected subnet (e.g. 192.168.10.x or 192.168.1.x)
    const candidates = [2, 3, 5, 10, 20, 30, 50, 66, 70, 78, 83, 90, 91, 92, 93, 94, 95, 96, 100, 200, 231, 254];
    for (const c of candidates) {
      targetHosts.push(`${netInfo.subnetPrefix}${c}`);
    }
  }

  // Deduplicate hosts and filter out raw loopbacks if multiple hosts exist
  let hosts = Array.from(new Set(targetHosts));
  if (hosts.length > 2) {
    hosts = hosts.filter(h => h !== '127.0.0.1' && h !== 'localhost');
  }

  const tasks = [];

  for (const host of hosts) {
    for (const item of COMMON_HOMELAB_PORTS) {
      tasks.push(
        probePort(host, item.port).then(async (result) => {
          if (result.open) {
            const url = `${item.defaultProto}://${host}:${item.port}${item.path}`;
            const pageTitle = await probeHttpTitle(url);
            
            let displayName = item.name;
            if (pageTitle) {
              displayName = pageTitle;
            } else if (host === netInfo.gatewayIp && (item.port === 80 || item.port === 443)) {
              displayName = 'Router Gateway / Brama';
            } else if (item.port === 80) {
              displayName = `Serwer HTTP (${host})`;
            } else if (item.port === 443) {
              displayName = `Serwer HTTPS (${host})`;
            }

            return {
              id: `scan-${host}-${item.port}`,
              name: displayName,
              url,
              host,
              port: item.port,
              category_name: item.category,
              icon: item.icon,
              color: item.color,
              custom_badge: host === netInfo.gatewayIp ? 'Brama' : `Port ${item.port}`,
              responseTime: result.responseTime || 5,
              health_status: 'online'
            };
          }
          return null;
        })
      );
    }
  }

  const results = await Promise.all(tasks);
  const discovered = results.filter(Boolean);

  return {
    netInfo,
    discovered
  };
}
