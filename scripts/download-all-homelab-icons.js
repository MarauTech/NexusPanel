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
  return new Promise((resolve, reject) => {
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

const ALIAS_MAP = {
  'routeros': 'mikrotik',
  'speedtest-tracker': 'speedtest',
  'changedetection-io': 'changedetection',
  'whoogle': 'whoogle-search',
  'drawio': 'diagrams-net',
  'cosmos-cloud': 'cosmos',
  'uptime-robot': 'uptimerobot',
  'wireguard-easy': 'wg-easy'
};

async function run() {
  console.log('Fetching complete SVG catalog list from walkxcode/dashboard-icons repository...');
  const catalogRes = await get('https://api.github.com/repos/walkxcode/dashboard-icons/contents/svg');
  
  if (!catalogRes.success) {
    console.error('Failed to fetch catalog list from GitHub API:', catalogRes.status);
    return;
  }

  const files = JSON.parse(catalogRes.data);
  const svgFiles = files.filter(f => f.name.endsWith('.svg') && !f.name.endsWith('-dark.svg') && !f.name.endsWith('-light.svg'));
  console.log(`Found ${svgFiles.length} distinct primary SVG icons in repository.`);

  let count = 0;
  const batchSize = 25;

  for (let i = 0; i < svgFiles.length; i += batchSize) {
    const batch = svgFiles.slice(i, i + batchSize);
    await Promise.all(batch.map(async (file) => {
      const name = file.name;
      const downloadUrl = file.download_url || `https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/${name}`;
      const res = await get(downloadUrl);
      
      if (res.success && res.data && res.data.includes('<svg')) {
        const svgContent = res.data.trim();
        for (const dir of destDirs) {
          fs.writeFileSync(path.join(dir, name), svgContent, 'utf8');
        }
        count++;
      }
    }));
    process.stdout.write(`\rDownloaded ${count}/${svgFiles.length} SVG icons...`);
  }

  // Also apply aliases for common naming variations
  for (const [alias, target] of Object.entries(ALIAS_MAP)) {
    const srcFile = path.join(destDirs[0], `${target}.svg`);
    if (fs.existsSync(srcFile)) {
      const content = fs.readFileSync(srcFile, 'utf8');
      for (const dir of destDirs) {
        fs.writeFileSync(path.join(dir, `${alias}.svg`), content, 'utf8');
      }
    }
  }

  console.log(`\n\n========================================`);
  console.log(`Successfully downloaded ${count} official application SVG icons!`);
  console.log(`Saved into folders:`);
  destDirs.forEach(d => console.log(` -> ${d}`));
  console.log(`========================================\n`);
}

run();
