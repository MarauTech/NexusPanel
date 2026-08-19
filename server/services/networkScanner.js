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
  { port: 3000, name: 'NexusPanel / Grafana / AdGuard', category: 'Monitoring', icon: 'grafana', color: '#6366f1', defaultProto: 'http', path: '' },
  { port: 8096, name: 'Jellyfin Media', category: 'Media', icon: 'jellyfin', color: '#8b5cf6', defaultProto: 'http', path: '' },
  { port: 32400, name: 'Plex Media Server', category: 'Media', icon: 'plex', color: '#eab308', defaultProto: 'http', path: '/web' },
  { port: 80, name: 'Serwer WWW (HTTP)', category: 'Infrastructure', icon: 'globe', color: '#6366f1', defaultProto: 'http', path: '' },
  { port: 443, name: 'Serwer WWW (HTTPS)', category: 'Infrastructure', icon: 'shield', color: '#6366f1', defaultProto: 'https', path: '' },
  { port: 8080, name: 'Aplikacja Web (8080)', category: 'Services', icon: 'server', color: '#6366f1', defaultProto: 'http', path: '' },
  { port: 8443, name: 'Nextcloud / UniFi SSL', category: 'Services', icon: 'nextcloud', color: '#0284c7', defaultProto: 'https', path: '' },
  { port: 8001, name: 'ASUSTOR NAS', category: 'Infrastructure', icon: 'asustor', color: '#3b82f6', defaultProto: 'https', path: '' },
  { port: 5000, name: 'Synology DSM', category: 'Infrastructure', icon: 'synology', color: '#0284c7', defaultProto: 'http', path: '' },
  { port: 5001, name: 'Synology DSM SSL', category: 'Infrastructure', icon: 'synology', color: '#0284c7', defaultProto: 'https', path: '' },
  { port: 8989, name: 'Sonarr', category: 'Media', icon: 'sonarr', color: '#0ea5e9', defaultProto: 'http', path: '' },
  { port: 7878, name: 'Radarr', category: 'Media', icon: 'radarr', color: '#eab308', defaultProto: 'http', path: '' },
  { port: 9696, name: 'Prowlarr', category: 'Media', icon: 'activity', color: '#f59e0b', defaultProto: 'http', path: '' },
  { port: 8085, name: 'qBittorrent', category: 'Media', icon: 'qbittorrent', color: '#3b82f6', defaultProto: 'http', path: '' },
  { port: 9091, name: 'Transmission', category: 'Media', icon: 'transmission', color: '#ef4444', defaultProto: 'http', path: '' },
  { port: 8181, name: 'Nginx Proxy Manager', category: 'Services', icon: 'nginx', color: '#10b981', defaultProto: 'http', path: '' },
  { port: 8384, name: 'Syncthing', category: 'Services', icon: 'folder', color: '#0ea5e9', defaultProto: 'http', path: '' },
  { port: 19999, name: 'Netdata Monitor', category: 'Monitoring', icon: 'activity', color: '#10b981', defaultProto: 'http', path: '' },
  { port: 9090, name: 'Prometheus / Cockpit', category: 'Monitoring', icon: 'activity', color: '#f97316', defaultProto: 'http', path: '' },
  { port: 2375, name: 'Docker Daemon', category: 'Services', icon: 'docker', color: '#0ea5e9', defaultProto: 'http', path: '' },
  { port: 10000, name: 'Webmin / Virtualmin', category: 'Infrastructure', icon: 'server', color: '#6366f1', defaultProto: 'https', path: '' }
];

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Get active network information (subnet prefix, local IP, gateway)
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
 * Ultra-fast TCP port probe with configurable timeout
 */
function probePort(host, port, timeout = 250) {
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
 * Probe HTTP response to extract HTML page title or server banner
 */
async function probeHttpTitle(url) {
  try {
    const res = await axios.get(url, {
      timeout: 800,
      httpsAgent,
      headers: { 'User-Agent': 'NexusPanel-Scanner/1.0' },
      maxRedirects: 2,
      responseType: 'text'
    });
    if (res.data && typeof res.data === 'string') {
      const match = res.data.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title && title.length < 60 && !title.toLowerCase().includes('404') && !title.toLowerCase().includes('error')) {
          return title;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Execute tasks in concurrent batches
 */
async function runInBatches(tasks, batchSize = 150) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Full LAN subnet scanner: scans all hosts 1..254 in the detected subnet across all homelab ports
 */
export async function scanLocalNetwork(targetHosts = []) {
  const netInfo = getNetworkInfo();

  let hosts = [];
  if (targetHosts && targetHosts.length > 0) {
    hosts = Array.from(new Set(targetHosts));
  } else {
    // Full subnet scan from 1 to 254
    for (let i = 1; i <= 254; i++) {
      hosts.push(`${netInfo.subnetPrefix}${i}`);
    }
  }

  // Filter out raw loopbacks if scanning entire network
  if (hosts.length > 2) {
    hosts = hosts.filter(h => h !== '127.0.0.1' && h !== 'localhost');
  }

  // Build probe task factories
  const probeTasks = [];

  for (const host of hosts) {
    for (const item of COMMON_HOMELAB_PORTS) {
      probeTasks.push(() => 
        probePort(host, item.port, 280).then(async (result) => {
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

  const results = await runInBatches(probeTasks, 160);
  const discovered = results.filter(Boolean);

  return {
    netInfo,
    discovered
  };
}
