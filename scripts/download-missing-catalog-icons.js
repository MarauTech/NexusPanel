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

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'NexusPanel-Downloader' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
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

// Map requested slugs to possible filenames across repositories
const SLUG_CANDIDATES = {
  'kodi': ['kodi', 'xbmc'],
  'nzbget': ['nzbget'],
  'jdownloader': ['jdownloader', 'jdownloader2'],
  'qnap': ['qnap'],
  'seafile': ['seafile'],
  'minio': ['minio', 'min-io'],
  'proxmox-backup-server': ['proxmox-backup-server', 'proxmox-backup', 'pbs', 'proxmox'],
  'vmware': ['vmware', 'vmware-esxi'],
  'esxi': ['esxi', 'vmware-esxi', 'vmware'],
  'xcp-ng': ['xcp-ng', 'xcpng', 'xen-orchestra'],
  'xen-orchestra': ['xen-orchestra', 'xenorchestra', 'xcp-ng'],
  'hyper-v': ['hyper-v', 'hyperv', 'microsoft-hyper-v', 'windows'],
  'virtualbox': ['virtualbox', 'oracle-virtualbox'],
  'kvm': ['kvm', 'linux-kvm'],
  'qemu': ['qemu'],
  'docker-compose': ['docker-compose', 'docker'],
  'dockge': ['dockge'],
  'yacht': ['yacht'],
  'kubernetes': ['kubernetes', 'k8s'],
  'k3s': ['k3s', 'kubernetes', 'rancher'],
  'rancher': ['rancher'],
  'helm': ['helm'],
  'unifi': ['unifi', 'ubiquiti'],
  'routeros': ['routeros', 'mikrotik'],
  'vyos': ['vyos'],
  'technitium-dns': ['technitium-dns', 'technitium'],
  'unbound': ['unbound'],
  'zerotier': ['zerotier', 'zerotier-one'],
  'netbird': ['netbird'],
  'haproxy': ['haproxy'],
  'apache': ['apache', 'apache-http-server'],
  'cloudflare-tunnel': ['cloudflare-tunnel', 'cloudflare', 'cloudflared'],
  'swag': ['swag', 'linuxserver'],
  'nagios': ['nagios'],
  'checkmk': ['checkmk', 'check-mk'],
  'librenms': ['librenms'],
  'observium': ['observium'],
  'victoriametrics': ['victoriametrics', 'victoria-metrics'],
  'cadvisor': ['cadvisor'],
  'openhab': ['openhab', 'open-hab'],
  'domoticz': ['domoticz'],
  'iobroker': ['iobroker', 'io-broker'],
  'node-red': ['nodered', 'node-red'],
  'zwave-js': ['zwave-js', 'zwavejs', 'zwave'],
  'scrypted': ['scrypted'],
  'jenkins': ['jenkins'],
  'woodpecker-ci': ['woodpecker-ci', 'woodpecker'],
  'code-server': ['code-server', 'vscode', 'visual-studio-code'],
  'jupyter': ['jupyter', 'jupyterlab', 'jupyter-notebook'],
  'visual-studio-code': ['vscode', 'visual-studio-code'],
  'coder': ['coder'],
  'valkey': ['valkey', 'redis'],
  'sqlite': ['sqlite'],
  'influxdb': ['influxdb', 'influx-db'],
  'timescale': ['timescale', 'timescaledb', 'postgresql'],
  'opensearch': ['opensearch'],
  'neo4j': ['neo4j'],
  'vault': ['vault', 'hashicorp-vault', 'vaultwarden'],
  'openbao': ['openbao', 'vault'],
  'crowdsec': ['crowdsec'],
  'fail2ban': ['fail2ban'],
  'wazuh': ['wazuh'],
  'suricata': ['suricata'],
  'grafana-alloy': ['grafana-alloy', 'grafana'],
  'n8n': ['n8n', 'n8n-io'],
  'huginn': ['huginn'],
  'windmill': ['windmill'],
  'apache-airflow': ['apache-airflow', 'airflow'],
  'kestra': ['kestra'],
  'dashy': ['dashy'],
  'organizr': ['organizr', 'organizr-v2'],
  'flame': ['flame'],
  'glance': ['glance'],
  'bookstack': ['bookstack'],
  'wiki-js': ['wikijs', 'wiki-js', 'wiki'],
  'dokuwiki': ['dokuwiki'],
  'mediawiki': ['mediawiki', 'wikipedia'],
  'outline': ['outline', 'outline-knowledge-base'],
  'joplin': ['joplin'],
  'memos': ['memos', 'usememos'],
  'hedgedoc': ['hedgedoc', 'codimd'],
  'restic': ['restic'],
  'borgbackup': ['borgbackup', 'borg'],
  'borgmatic': ['borgmatic', 'borgbackup'],
  'urbackup': ['urbackup'],
  'veeam': ['veeam'],
  'ollama': ['ollama'],
  'open-webui': ['open-webui', 'openwebui', 'ollama'],
  'localai': ['localai', 'local-ai'],
  'comfyui': ['comfyui', 'comfy-ui'],
  'stable-diffusion': ['stable-diffusion', 'stability-ai', 'automatic1111'],
  'automatic1111': ['automatic1111', 'stable-diffusion'],
  'librechat': ['librechat'],
  'anything-llm': ['anything-llm', 'anythingllm'],
  'pterodactyl': ['pterodactyl'],
  'pelican': ['pelican', 'pelican-panel'],
  'amp': ['amp', 'cubecoders-amp'],
  'crafty-controller': ['crafty-controller', 'crafty'],
  'pufferpanel': ['pufferpanel'],
  'minecraft': ['minecraft'],
  'valheim': ['valheim'],
  'terraria': ['terraria'],
  'factorio': ['factorio'],
  'palworld': ['palworld']
};

async function downloadSingleSlug(canonicalSlug) {
  const candidates = SLUG_CANDIDATES[canonicalSlug] || [canonicalSlug];

  for (const name of candidates) {
    const urls = [
      `https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/${name}.svg`,
      `https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/${name.replace(/-/g, '_')}.svg`,
      `https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/${name.replace(/_/g, '-')}.svg`,
      `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${name.replace(/-/g, '')}.svg`,
      `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${name}.svg`,
      `https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/svg/${name}.svg`
    ];

    for (const u of urls) {
      const res = await get(u);
      if (res.success && res.data && res.data.includes('<svg')) {
        const svg = res.data.trim();
        for (const dir of destDirs) {
          fs.writeFileSync(path.join(dir, `${canonicalSlug}.svg`), svg, 'utf8');
        }
        return true;
      }
    }
  }
  return false;
}

async function run() {
  const slugs = Object.keys(SLUG_CANDIDATES);
  console.log(`Downloading / verifying ${slugs.length} specific catalog icons...`);
  
  let successCount = 0;
  let failed = [];

  for (const slug of slugs) {
    const ok = await downloadSingleSlug(slug);
    if (ok) {
      successCount++;
      console.log(` [OK] ${slug}.svg`);
    } else {
      failed.push(slug);
      console.log(` [MISSING] ${slug}.svg`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Successfully acquired: ${successCount}/${slugs.length}`);
  if (failed.length > 0) {
    console.log(`Missing: ${failed.join(', ')}`);
  }
  console.log(`========================================\n`);
}

run();
