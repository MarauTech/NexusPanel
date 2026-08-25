import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const destDirs = [
  path.join(rootDir, 'icons'),
  path.join(rootDir, 'client', 'public', 'icons')
];

destDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// List of popular and essential homelab / selfhosted icons to guarantee presence
const HOMELAB_SERVICES = [
  'proxmox',
  'portainer',
  'docker',
  'home-assistant',
  'homebridge',
  'grafana',
  'prometheus',
  'pi-hole',
  'pihole',
  'adguard-home',
  'adguard',
  'jellyfin',
  'plex',
  'emby',
  'nextcloud',
  'owncloud',
  'truenas',
  'unraid',
  'openmediavault',
  'synology',
  'asustor',
  'wireguard',
  'openvpn',
  'tailscale',
  'cloudflare',
  'uptime-kuma',
  'vaultwarden',
  'bitwarden',
  'sonarr',
  'radarr',
  'lidarr',
  'prowlarr',
  'readarr',
  'bazarr',
  'qbittorrent',
  'transmission',
  'deluge',
  'sabnzbd',
  'nginx',
  'nginx-proxy-manager',
  'traefik',
  'caddy',
  'immich',
  'photoprism',
  'paperless-ngx',
  'paperless',
  'frigate',
  'scrypted',
  'esphome',
  'zigbee2mqtt',
  'mosquitto',
  'nodered',
  'gitea',
  'forgejo',
  'gitlab',
  'github',
  'wordpress',
  'ghost',
  'authentik',
  'authelia',
  'keycloak',
  'netdata',
  'zabbix',
  'glances',
  'dozzle',
  'kasm-workspaces',
  'guacamole',
  'rustdesk',
  'syncthing',
  'duplicati',
  'kopia',
  'restic',
  'mikrotik',
  'routeros',
  'opnsense',
  'pfsense',
  'openwrt',
  'unifi',
  'speedtest-tracker',
  'overseerr',
  'jellyseerr',
  'tautulli',
  'audiobookshelf',
  'navidrome',
  'calibre-web',
  'mealie',
  'grocy',
  'freshrss',
  'miniflux',
  'wallabag',
  'linkwarden',
  'shlink',
  'stirling-pdf',
  'it-tools',
  'cyberchef',
  'heimdall',
  'homarr',
  'homepage',
  'dashy',
  'flame',
  'changedetection-io',
  'whoogle',
  'searxng',
  'actual-budget',
  'firefly-iii',
  'vikunja',
  'kanboard',
  'trilium',
  'obsidian',
  'drawio',
  'excalidraw',
  'umbrel',
  'casaos',
  'cosmos-cloud',
  'tandoor-recipes',
  'romm',
  'octoprint',
  'klipper',
  'mainsail',
  'fluidd',
  'mysql',
  'postgresql',
  'mariadb',
  'redis',
  'mongodb',
  'uptime-robot',
  'headscale',
  'meshcentral',
  'wireguard-easy'
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NexusPanel-Downloader' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return resolve({ success: false, status: res.statusCode });
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ success: true, data }));
    }).on('error', err => resolve({ success: false, error: err.message }));
  });
}

async function downloadIcon(name) {
  const sources = [
    `https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/${name}.svg`,
    `https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/${name.replace(/-/g, '_')}.svg`,
    `https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/${name.replace(/_/g, '-')}.svg`,
    `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${name.replace(/-/g, '')}.svg`
  ];

  for (const src of sources) {
    const res = await fetchUrl(src);
    if (res.success && res.data && res.data.includes('<svg')) {
      const cleanedSvg = res.data.trim();
      for (const dir of destDirs) {
        const filePath = path.join(dir, `${name}.svg`);
        fs.writeFileSync(filePath, cleanedSvg, 'utf8');
      }
      return true;
    }
  }
  return false;
}

async function run() {
  console.log(`Starting SVG icon download for ${HOMELAB_SERVICES.length} homelab applications...`);
  
  let downloaded = 0;
  let failed = [];

  // Download in parallel batches of 10
  const batchSize = 10;
  for (let i = 0; i < HOMELAB_SERVICES.length; i += batchSize) {
    const batch = HOMELAB_SERVICES.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(async (name) => {
      const ok = await downloadIcon(name);
      return { name, ok };
    }));

    results.forEach(({ name, ok }) => {
      if (ok) {
        downloaded++;
        console.log(`  [OK] ${name}.svg`);
      } else {
        failed.push(name);
        console.log(`  [FAIL] ${name}.svg`);
      }
    });
  }

  console.log(`\n========================================`);
  console.log(`Downloaded ${downloaded}/${HOMELAB_SERVICES.length} icons.`);
  if (failed.length > 0) {
    console.log(`Failed for: ${failed.join(', ')}`);
  }
  console.log(`Icons stored in:`);
  destDirs.forEach(d => console.log(` - ${d}`));
  console.log(`========================================\n`);
}

run();
