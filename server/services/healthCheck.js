import axios from 'axios';
import https from 'https';
import config from '../config/index.js';
import { probeTcpOrPing } from './pingService.js';

export class HealthCheckService {
  constructor(db) {
    this.db = db;
    this.intervalId = null;
    this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    this.isChecking = false;
  }

  start() {
    this.stop();
    const intervalMs = this.getMinInterval() * 1000;
    this.intervalId = setInterval(() => {
      this.checkAll();
    }, intervalMs);
    setTimeout(() => this.checkAll(), 2000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getMinInterval() {
    try {
      const row = this.db.prepare("SELECT MIN(health_check_interval) as minInterval FROM services WHERE health_check_enabled = 1 AND enabled = 1").get();
      return (row && row.minInterval && row.minInterval >= 10) ? row.minInterval : (config.HEALTH_CHECK_INTERVAL || 60);
    } catch (e) {
      return 60;
    }
  }

  async checkAll() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const services = this.db.prepare("SELECT * FROM services WHERE health_check_enabled = 1 AND enabled = 1").all();
      if (!services || services.length === 0) {
        this.isChecking = false;
        return;
      }

      // Concurrency batches of 5
      const chunkSize = 5;
      for (let i = 0; i < services.length; i += chunkSize) {
        const chunk = services.slice(i, i + chunkSize);
        await Promise.allSettled(chunk.map(s => this.checkService(s.id)));
      }

      // Cleanup history older than 7 days
      try {
        this.db.prepare("DELETE FROM service_health_history WHERE checked_at < datetime('now', '-7 days')").run();
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('HealthCheck error during checkAll:', err.message);
    } finally {
      this.isChecking = false;
    }
  }

  async checkService(serviceId) {
    const service = this.db.prepare("SELECT * FROM services WHERE id = ?").get(serviceId);
    if (!service) return;

    const targetUrl = service.health_check_url || service.url;
    if (!targetUrl) return;

    const checkType = service.health_check_type || 'http';
    let status = 'offline';
    let responseTime = null;

    if (checkType === 'ping' || checkType === 'tcp') {
      // Raw TCP / ICMP Ping Probe
      const res = await probeTcpOrPing(targetUrl, 80, 5000);
      status = res.status;
      responseTime = res.responseTime;
    } else {
      // Standard HTTP/HTTPS probe
      try {
        const parsed = new URL(targetUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return;
        }
      } catch (e) {
        return;
      }

      const startTime = Date.now();
      try {
        await axios.get(targetUrl, {
          timeout: 8000,
          maxRedirects: 3,
          httpsAgent: this.httpsAgent,
          validateStatus: () => true,
          headers: { 'User-Agent': 'NexusPanel-Monitor/1.0' }
        });
        
        responseTime = Date.now() - startTime;
        status = responseTime < 1000 ? 'online' : 'degraded';
      } catch (error) {
        status = 'offline';
        responseTime = null;
      }
    }

    const nowIso = new Date().toISOString();

    // Update service current status
    this.db.prepare(`
      UPDATE services 
      SET health_status = ?, health_last_checked = ?, health_response_time = ? 
      WHERE id = ?
    `).run(status, nowIso, responseTime, serviceId);

    // Record in history log
    try {
      this.db.prepare(`
        INSERT INTO service_health_history (service_id, status, response_time, checked_at)
        VALUES (?, ?, ?, ?)
      `).run(serviceId, status, responseTime, nowIso);
    } catch (e) {
      // Ignore insertion error
    }
  }
}

export default HealthCheckService;
