import express from 'express';
import os from 'os';
import axios from 'axios';
import db from '../db/index.js';

const router = express.Router();

// Helper to calculate CPU percentage
let previousCpuTime = null;

function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }

  const current = { totalIdle, totalTick };

  if (!previousCpuTime) {
    previousCpuTime = current;
    const loadAvg = os.loadavg();
    return Math.min(100, Math.round((loadAvg[0] / cpus.length) * 100));
  }

  const idleDelta = current.totalIdle - previousCpuTime.totalIdle;
  const totalDelta = current.totalTick - previousCpuTime.totalTick;
  previousCpuTime = current;

  if (totalDelta === 0) return 0;
  const usage = Math.round(100 - (100 * idleDelta / totalDelta));
  return Math.max(0, Math.min(100, usage));
}

// 1. Host System Stats (CPU, RAM, Uptime, OS)
router.get('/stats', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  const cpus = os.cpus();
  const cpuPercent = getCpuUsage();

  res.json({
    cpu: {
      usagePercent: cpuPercent,
      cores: cpus.length,
      model: cpus[0]?.model || 'Host CPU',
      speedMhz: cpus[0]?.speed || 2400
    },
    memory: {
      totalBytes: totalMem,
      usedBytes: usedMem,
      freeBytes: freeMem,
      totalGb: (totalMem / (1024 ** 3)).toFixed(1),
      usedGb: (usedMem / (1024 ** 3)).toFixed(1),
      percent: memPercent
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      type: os.type(),
      arch: os.arch(),
      uptimeSeconds: os.uptime(),
      uptimeFormatted: `${Math.floor(os.uptime() / 86400)}d ${Math.floor((os.uptime() % 86400) / 3600)}h`
    }
  });
});

// 2. Weather Endpoint (Auto-detects location via Public IP + Open-Meteo)
let cachedWeather = null;
let lastWeatherFetch = 0;
let detectedLocation = null;

async function detectPublicIpLocation() {
  if (detectedLocation) return detectedLocation;
  try {
    const geoRes = await axios.get('http://ip-api.com/json/', { timeout: 3000 });
    if (geoRes.data && geoRes.data.status === 'success') {
      detectedLocation = {
        city: geoRes.data.city || 'Gliwice',
        lat: String(geoRes.data.lat),
        lon: String(geoRes.data.lon),
        country: geoRes.data.country || 'Poland'
      };
      return detectedLocation;
    }
  } catch (e) {
    // ignore
  }
  return { city: 'Warszawa', lat: '52.2297', lon: '21.0122', country: 'Poland' };
}

router.get('/weather', async (req, res) => {
  const settingsRows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'weather_%'").all();
  const settings = {};
  for (const r of settingsRows) settings[r.key] = r.value;

  // Auto-detect from public IP if settings don't specify a manual override
  let lat = settings.weather_lat;
  let lon = settings.weather_lon;
  let cityName = settings.weather_city;

  if (!lat || !lon || !cityName || cityName === 'Warszawa') {
    const autoLoc = await detectPublicIpLocation();
    lat = autoLoc.lat;
    lon = autoLoc.lon;
    cityName = autoLoc.city;
  }

  // Cache weather for 10 minutes to respect Open-Meteo limits
  const now = Date.now();
  if (cachedWeather && (now - lastWeatherFetch < 600000)) {
    return res.json(cachedWeather);
  }

  try {
    const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
        timezone: 'auto'
      },
      timeout: 4000
    });

    const curr = weatherRes.data?.current || {};
    const code = curr.weather_code || 0;

    // Weather condition mapping
    let condition = 'Bezchmurnie';
    let icon = 'sun';
    if (code >= 1 && code <= 3) { condition = 'Częściowe zachmurzenie'; icon = 'cloud-sun'; }
    else if (code >= 45 && code <= 48) { condition = 'Mgła'; icon = 'cloud-fog'; }
    else if (code >= 51 && code <= 67) { condition = 'Deszcz'; icon = 'cloud-rain'; }
    else if (code >= 71 && code <= 77) { condition = 'Śnieg'; icon = 'snowflake'; }
    else if (code >= 80 && code <= 82) { condition = 'Przelotny deszcz'; icon = 'cloud-rain'; }
    else if (code >= 95) { condition = 'Burza'; icon = 'cloud-lightning'; }

    cachedWeather = {
      city: cityName,
      temperature: Math.round(curr.temperature_2m || 20),
      apparentTemperature: Math.round(curr.apparent_temperature || 20),
      humidity: curr.relative_humidity_2m || 50,
      windSpeed: Math.round(curr.wind_speed_10m || 10),
      isDay: curr.is_day === 1,
      condition,
      icon,
      weatherCode: code,
      updatedAt: new Date().toLocaleTimeString()
    };
    lastWeatherFetch = now;

    res.json(cachedWeather);
  } catch (err) {
    res.json({
      city: cityName,
      temperature: 22,
      apparentTemperature: 22,
      humidity: 55,
      windSpeed: 8,
      isDay: true,
      condition: 'Słonecznie',
      icon: 'sun',
      weatherCode: 0,
      updatedAt: new Date().toLocaleTimeString(),
      offlineFallback: true
    });
  }
});

export default router;
