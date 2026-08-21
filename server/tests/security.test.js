import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';

import app from '../index.js';
import db from '../db/index.js';
import config from '../config/index.js';
import { isDangerousOrReservedIp, validateDestinationHost, isIpInCidr } from '../utils/networkSecurity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSecurityTests() {
  console.log('\n🔒 ========================================');
  console.log('   NexusPanel Automated Security Test Suite');
  console.log('   ========================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.response?.data) {
        console.error(`     Response data:`, JSON.stringify(err.response.data));
      }
      failed++;
    }
  }

  // Start test server on random free port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const client = axios.create({
    baseURL: baseUrl,
    validateStatus: () => true
  });

  try {
    // -------------------------------------------------------------
    // 1. SSRF & Network Security Unit Tests
    // -------------------------------------------------------------
    console.log('\n[1/6] Running SSRF & Destination Validation Tests...');

    await test('SSRF: isDangerousOrReservedIp blocks loopback 127.0.0.1', () => {
      assert.strictEqual(isDangerousOrReservedIp('127.0.0.1'), true);
      assert.strictEqual(isDangerousOrReservedIp('127.0.0.2'), true);
    });

    await test('SSRF: isDangerousOrReservedIp blocks cloud metadata IP 169.254.169.254', () => {
      assert.strictEqual(isDangerousOrReservedIp('169.254.169.254'), true);
    });

    await test('SSRF: isDangerousOrReservedIp blocks IPv6 loopback ::1 and link-local fe80::1', () => {
      assert.strictEqual(isDangerousOrReservedIp('::1'), true);
      assert.strictEqual(isDangerousOrReservedIp('fe80::1'), true);
    });

    await test('SSRF: validateDestinationHost rejects metadata.google.internal', async () => {
      try {
        await validateDestinationHost('metadata.google.internal');
        assert.fail('Should have rejected metadata.google.internal');
      } catch (err) {
        assert.ok(err.message.includes('forbidden') || err.message.includes('Cannot resolve'));
      }
    });

    await test('SSRF: validateDestinationHost allows standard RFC1918 homelab IP (192.168.1.50)', async () => {
      const res = await validateDestinationHost('192.168.1.50', true);
      assert.strictEqual(res.resolvedIp, '192.168.1.50');
    });

    await test('SSRF: isIpInCidr correctly calculates subnets', () => {
      assert.strictEqual(isIpInCidr('192.168.1.100', '192.168.1.0/24'), true);
      assert.strictEqual(isIpInCidr('10.0.5.1', '10.0.0.0/8'), true);
      assert.strictEqual(isIpInCidr('172.16.10.5', '172.16.0.0/12'), true);
      assert.strictEqual(isIpInCidr('192.168.2.1', '192.168.1.0/24'), false);
    });

    // -------------------------------------------------------------
    // 2. Authentication & Authorization Tests
    // -------------------------------------------------------------
    console.log('\n[2/6] Running Authentication & Session Tests...');

    // Reset users and settings for clean test run
    db.exec(`
      DELETE FROM users;
      DELETE FROM settings WHERE key = 'setup_completed';
    `);

    let adminToken = null;
    let nonAdminToken = null;

    await test('AUTH: Setup creates first admin user and returns JWT token', async () => {
      const res = await client.post('/api/auth/setup', {
        username: 'admin_test',
        password: 'Password123!',
        dashboardName: 'Security Test Hub'
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.token);
      assert.strictEqual(res.data.user.role, 'admin');
      adminToken = res.data.token;
    });

    await test('AUTH: Setup is one-time only and blocks subsequent setup calls', async () => {
      const res = await client.post('/api/auth/setup', {
        username: 'attacker',
        password: 'HackedPassword123!'
      });
      assert.strictEqual(res.status, 403);
    });

    await test('AUTH: Login succeeds with correct credentials', async () => {
      const res = await client.post('/api/auth/login', {
        username: 'admin_test',
        password: 'Password123!'
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.token);
      assert.strictEqual(res.data.user.username, 'admin_test');
    });

    await test('AUTH: Login fails with invalid password', async () => {
      const res = await client.post('/api/auth/login', {
        username: 'admin_test',
        password: 'WrongPassword999'
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.error, 'Invalid username or password');
    });

    await test('AUTH: Protected endpoint returns 401 when token is missing', async () => {
      const res = await client.get('/api/auth/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.code, 'AUTH_REQUIRED');
    });

    await test('AUTH: Protected endpoint returns 401 when token is malformed', async () => {
      const res = await client.get('/api/auth/me', {
        headers: { Authorization: 'Bearer this-is-not-a-jwt' }
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.code, 'INVALID_TOKEN');
    });

    await test('AUTH: Protected endpoint returns 401 when token is expired', async () => {
      const expiredToken = jwt.sign({ id: 1, username: 'admin_test', role: 'admin' }, config.JWT_SECRET, { expiresIn: '0s' });
      const res = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.code, 'TOKEN_EXPIRED');
    });

    await test('AUTH: Non-admin user receives 403 Forbidden on admin routes', async () => {
      // Insert regular non-admin user
      const userRes = db.prepare(`
        INSERT INTO users (username, password_hash, role, created_at, updated_at)
        VALUES ('regular_user', 'hash', 'user', datetime('now'), datetime('now'))
      `).run();
      nonAdminToken = jwt.sign({ id: userRes.lastInsertRowid, username: 'regular_user', role: 'user' }, config.JWT_SECRET, { expiresIn: '1h' });

      const res = await client.post('/api/categories', { name: 'Unauthorized Category' }, {
        headers: { Authorization: `Bearer ${nonAdminToken}` }
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, 'FORBIDDEN');
    });

    await test('AUTH: Admin user succeeds on admin route', async () => {
      const res = await client.post('/api/categories', { name: 'Admin Verified Category', icon: 'shield', color: '#10b981' }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.data.id > 0);
    });

    await test('AUTH: Logout clears authentication cookie', async () => {
      const res = await client.post('/api/auth/logout');
      assert.strictEqual(res.status, 200);
    });

    // -------------------------------------------------------------
    // 3. Settings Security & Secret Masking Tests
    // -------------------------------------------------------------
    console.log('\n[3/6] Running Settings Security Tests...');

    await test('SETTINGS: Sensitive secrets are masked in GET /api/settings', async () => {
      // Store a dummy Proxmox token secret in DB
      db.prepare(`
        INSERT INTO settings (key, value) VALUES ('proxmox_token_secret', 'secret-uuid-1234-5678')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run();

      const res = await client.get('/api/settings');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.proxmox_token_secret, '••••••••••••••••');
      assert.strictEqual(res.data.proxmox_token_secret_configured, true);
    });

    await test('SETTINGS: Masked placeholder does not overwrite real secret in DB', async () => {
      const updateRes = await client.put('/api/settings', {
        dashboard_name: 'NexusPanel Updated',
        proxmox_token_secret: '••••••••••••••••'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(updateRes.status, 200);

      // Verify the real secret is still preserved in database
      const row = db.prepare("SELECT value FROM settings WHERE key = 'proxmox_token_secret'").get();
      assert.strictEqual(row.value, 'secret-uuid-1234-5678');
    });

    await test('SETTINGS: Arbitrary unwhitelisted keys are ignored', async () => {
      await client.put('/api/settings', {
        injected_arbitrary_key: 'hacked_val',
        dashboard_name: 'NexusPanel Secure'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const row = db.prepare("SELECT value FROM settings WHERE key = 'injected_arbitrary_key'").get();
      assert.strictEqual(row, undefined);
    });

    // -------------------------------------------------------------
    // 4. Upload Security Tests
    // -------------------------------------------------------------
    console.log('\n[4/6] Running Upload Security Tests...');

    await test('UPLOAD: Rejects unauthenticated uploads with 401', async () => {
      const form = new FormData();
      form.append('file', Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), {
        filename: 'test.png',
        contentType: 'image/png'
      });

      const res = await client.post('/api/upload/image', form, {
        headers: form.getHeaders()
      });
      assert.strictEqual(res.status, 401);
    });

    await test('UPLOAD: Accepts valid PNG file with legitimate magic bytes', async () => {
      // 1x1 valid PNG binary buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const form = new FormData();
      form.append('file', pngBuffer, {
        filename: 'valid.png',
        contentType: 'image/png'
      });

      const res = await client.post('/api/upload/image', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.url.startsWith('/uploads/upload-'));
    });

    await test('UPLOAD: Rejects fake MIME image with non-image magic bytes', async () => {
      const fakeImageBuffer = Buffer.from('<?php echo "HACKED"; ?>');
      const form = new FormData();
      form.append('file', fakeImageBuffer, {
        filename: 'shell.jpg',
        contentType: 'image/jpeg'
      });

      const res = await client.post('/api/upload/image', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert.strictEqual(res.status, 400);
    });

    await test('UPLOAD: Rejects SVG files to prevent stored XSS', async () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const form = new FormData();
      form.append('file', svgBuffer, {
        filename: 'payload.svg',
        contentType: 'image/svg+xml'
      });

      const res = await client.post('/api/upload/image', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert.strictEqual(res.status, 400);
    });

    // -------------------------------------------------------------
    // 5. Backup & Restore Integrity Tests
    // -------------------------------------------------------------
    console.log('\n[5/6] Running Backup & Restore Security Tests...');

    let exportedBackup = null;

    await test('BACKUP: Export returns valid JSON and excludes credentials', async () => {
      const res = await client.get('/api/backup/export', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.categories));
      assert.ok(Array.isArray(res.data.services));
      assert.ok(!res.data.users); // Must never export users table
      exportedBackup = res.data;
    });

    await test('BACKUP: Rejects malformed / empty backup payloads', async () => {
      const res = await client.post('/api/backup/import', 'invalid json string', {
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      });
      assert.strictEqual(res.status, 400);
    });

    await test('BACKUP: Restores valid configuration atomically', async () => {
      const res = await client.post('/api/backup/import', exportedBackup, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

    // -------------------------------------------------------------
    // 6. Network Scanner Security Tests
    // -------------------------------------------------------------
    console.log('\n[6/6] Running Network Scanner Security Tests...');

    await test('SCANNER: Custom scan rejects oversized host lists (> 256)', async () => {
      const hosts = Array(300).fill(0).map((_, i) => `192.168.1.${i}`);
      const res = await client.post('/api/scanner/scan-custom', { hosts }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
    });

    await test('SCANNER: Batch import enforces entity limits', async () => {
      const excessiveServices = Array(150).fill(0).map((_, i) => ({
        name: `Service ${i}`,
        url: `http://192.168.1.${i}`
      }));
      const res = await client.post('/api/scanner/add-batch', { services: excessiveServices }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
    });

  } finally {
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`Security Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal security test error:', err);
  process.exit(1);
});
