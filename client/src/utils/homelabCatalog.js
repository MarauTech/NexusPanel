// Homelab Catalog: Smart presets & auto-detection for popular self-hosted applications
export const HOMELAB_CATALOG = [
  {
    keywords: ['proxmox', 'pve'],
    name: 'Proxmox VE',
    icon: 'proxmox',
    color: '#e57000',
    defaultPort: '8006',
    defaultProtocol: 'https',
    categoryName: 'Infrastructure',
    tags: ['virtualization', 'pve', 'hypervisor'],
    customBadge: 'Node',
    healthCheck: true
  },
  {
    keywords: ['portainer'],
    name: 'Portainer CE',
    icon: 'portainer',
    color: '#13b5ea',
    defaultPort: '9000',
    defaultProtocol: 'http',
    categoryName: 'Services',
    tags: ['docker', 'containers'],
    customBadge: 'Docker',
    healthCheck: true
  },
  {
    keywords: ['home assistant', 'homeassistant', 'hass', 'hassio'],
    name: 'Home Assistant',
    icon: 'home-assistant',
    color: '#0284c7',
    defaultPort: '8123',
    defaultProtocol: 'http',
    categoryName: 'Smart Home',
    tags: ['smart-home', 'iot', 'automation'],
    customBadge: 'Hub',
    healthCheck: true
  },
  {
    keywords: ['grafana'],
    name: 'Grafana',
    icon: 'grafana',
    color: '#f59e0b',
    defaultPort: '3001',
    defaultProtocol: 'http',
    categoryName: 'Monitoring',
    tags: ['monitoring', 'metrics', 'dashboards'],
    customBadge: 'Metrics',
    healthCheck: true
  },
  {
    keywords: ['pihole', 'pi-hole'],
    name: 'Pi-hole',
    icon: 'pihole',
    color: '#ef4444',
    defaultPort: '80',
    defaultPath: '/admin',
    defaultProtocol: 'http',
    categoryName: 'Services',
    tags: ['dns', 'adblock', 'security'],
    customBadge: 'DNS',
    healthCheck: true
  },
  {
    keywords: ['adguard', 'adguard home'],
    name: 'AdGuard Home',
    icon: 'shield',
    color: '#10b981',
    defaultPort: '3000',
    defaultProtocol: 'http',
    categoryName: 'Services',
    tags: ['dns', 'adblock', 'privacy'],
    customBadge: 'DNS',
    healthCheck: true
  },
  {
    keywords: ['jellyfin'],
    name: 'Jellyfin',
    icon: 'jellyfin',
    color: '#9a59b5',
    defaultPort: '8096',
    defaultProtocol: 'http',
    categoryName: 'Media',
    tags: ['media', 'streaming', 'movies'],
    customBadge: 'Media',
    healthCheck: true
  },
  {
    keywords: ['plex'],
    name: 'Plex Media Server',
    icon: 'tv',
    color: '#e5a00d',
    defaultPort: '32400',
    defaultPath: '/web',
    defaultProtocol: 'http',
    categoryName: 'Media',
    tags: ['media', 'streaming'],
    customBadge: 'Plex',
    healthCheck: true
  },
  {
    keywords: ['nextcloud'],
    name: 'Nextcloud Hub',
    icon: 'nextcloud',
    color: '#0082c9',
    defaultPort: '8443',
    defaultProtocol: 'https',
    categoryName: 'Services',
    tags: ['cloud', 'files', 'sync'],
    customBadge: 'Cloud',
    healthCheck: true
  },
  {
    keywords: ['truenas', 'freenas'],
    name: 'TrueNAS CORE / SCALE',
    icon: 'hard-drive',
    color: '#0079c1',
    defaultPort: '443',
    defaultProtocol: 'https',
    categoryName: 'Infrastructure',
    tags: ['storage', 'zfs', 'nas'],
    customBadge: 'NAS',
    healthCheck: true
  },
  {
    keywords: ['asustor'],
    name: 'ASUSTOR NAS',
    icon: 'asustor',
    color: '#8b5cf6',
    defaultPort: '8001',
    defaultProtocol: 'https',
    categoryName: 'Infrastructure',
    tags: ['nas', 'storage', 'backup'],
    customBadge: 'NAS',
    healthCheck: true
  },
  {
    keywords: ['synology', 'dsm'],
    name: 'Synology DSM',
    icon: 'server',
    color: '#2b3a4a',
    defaultPort: '5001',
    defaultProtocol: 'https',
    categoryName: 'Infrastructure',
    tags: ['nas', 'synology'],
    customBadge: 'DSM',
    healthCheck: true
  },
  {
    keywords: ['router', 'pfsense', 'opnsense', 'openwrt', 'unifi'],
    name: 'Router Gateway',
    icon: 'router',
    color: '#6366f1',
    defaultPort: '80',
    defaultProtocol: 'http',
    categoryName: 'Infrastructure',
    tags: ['network', 'router', 'gateway'],
    customBadge: 'Gateway',
    healthCheck: true
  },
  {
    keywords: ['wireguard', 'vpn'],
    name: 'WireGuard VPN',
    icon: 'wireguard',
    color: '#88171a',
    defaultPort: '51820',
    defaultProtocol: 'http',
    categoryName: 'Infrastructure',
    tags: ['vpn', 'security', 'tunnel'],
    customBadge: 'VPN',
    healthCheck: false
  },
  {
    keywords: ['uptime kuma', 'kuma', 'uptime'],
    name: 'Uptime Kuma',
    icon: 'uptime-kuma',
    color: '#5cd65c',
    defaultPort: '3002',
    defaultProtocol: 'http',
    categoryName: 'Monitoring',
    tags: ['monitoring', 'uptime', 'status'],
    customBadge: 'Status',
    healthCheck: true
  },
  {
    keywords: ['vaultwarden', 'bitwarden'],
    name: 'Vaultwarden',
    icon: 'lock',
    color: '#175ddc',
    defaultPort: '80',
    defaultProtocol: 'https',
    categoryName: 'Services',
    tags: ['passwords', 'vault', 'security'],
    customBadge: 'Vault',
    healthCheck: true
  }
];

export function detectHomelabService(inputName) {
  if (!inputName || typeof inputName !== 'string') return null;
  const clean = inputName.trim().toLowerCase();
  
  for (const item of HOMELAB_CATALOG) {
    if (item.keywords.some(k => clean.includes(k) || k.includes(clean))) {
      return item;
    }
  }
  return null;
}
