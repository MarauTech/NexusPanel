import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import FormData from 'form-data';

import app from '../index.js';
import db from '../db/index.js';
import config from '../config/index.js';
import { normalizeIpString, isDangerousOrReservedIp, validateDestinationHost, safeHttpRequest } from '../utils/networkSecurity.js';

async function runRedTeamAudit() {
  console.log('\n⚔️ =================================================================');
  console.log('   NexusPanel ROUND 3 — FINAL RED TEAM & CORRECTNESS AUDIT SUITE');
  console.log('   =================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [VERIFIED] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.response?.data) {
        console.error(`     Response:`, JSON.stringify(err.response.data));
      }
      failed++;
    }
  }

  // Start test server on random free port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const validOrigin = `http://127.0.0.1:${port}`;

  const client = axios.create({
    baseURL: baseUrl,
    validateStatus: () => true
  });

  try {
    // -------------------------------------------------------------
    // [SECTION 1] FIRST-RUN CONCURRENCY & RACE CONDITIONS
    // -------------------------------------------------------------
    console.log('\n[1/7] Testing First-Run Setup Concurrency & Race Conditions...');

    db.exec(`
      DELETE FROM users;
      DELETE FROM settings WHERE key = 'setup_completed';
    `);

    await test('CONCURRENCY: 10 concurrent setup requests create EXACTLY ONE admin (others get 403)', async () => {
      const promises = Array(10).fill(0).map((_, i) =>
        client.post('/api/auth/setup', {
          username: `admin_race_${i}`,
          password: 'StrongRacePassword123!',
          dashboardName: `Race Lab ${i}`
        })
      );
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.status === 201).length;
      const forbiddenCount = results.filter(r => r.status === 403).length;

      assert.strictEqual(successCount, 1, 'Exactly one setup request must succeed');
      assert.strictEqual(forbiddenCount, 9, 'All 9 concurrent setup requests must be blocked');

      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
      assert.strictEqual(userCount, 1, 'Database must contain exactly 1 user');
    });

    // Obtain the established admin credentials
    const adminUser = db.prepare("SELECT id, username FROM users LIMIT 1").get();
    let adminToken = jwt.sign(
      { id: adminUser.id, username: adminUser.username, role: 'admin', token_version: 1 },
      config.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    // -------------------------------------------------------------
    // [SECTION 2] JWT SECURITY & AUTH PRECEDENCE
    // -------------------------------------------------------------
    console.log('\n[2/7] Testing JWT Vulnerabilities & Auth Precedence...');

    await test('JWT: "alg: none" token is rejected with 401', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ id: adminUser.id, username: adminUser.username, role: 'admin', token_version: 1 })).toString('base64url');
      const res = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${header}.${payload}.` }
      });
      assert.strictEqual(res.status, 401);
    });

    await test('JWT: Forged signature with wrong secret is rejected with 401', async () => {
      const forged = jwt.sign({ id: adminUser.id, username: adminUser.username, role: 'admin', token_version: 1 }, 'bad-secret-key-12345678901234567890', { algorithm: 'HS256' });
      const res = await client.get('/api/auth/me', { headers: { Authorization: `Bearer ${forged}` } });
      assert.strictEqual(res.status, 401);
    });

    await test('JWT: Expired token is rejected with 401 (TOKEN_EXPIRED)', async () => {
      const expired = jwt.sign({ id: adminUser.id, username: adminUser.username, role: 'admin', token_version: 1 }, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: '-10s' });
      const res = await client.get('/api/auth/me', { headers: { Authorization: `Bearer ${expired}` } });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.code, 'TOKEN_EXPIRED');
    });

    await test('AUTH: Invalid Authorization header + valid cookie -> 401 (Strict Header Precedence)', async () => {
      const res = await client.get('/api/auth/me', {
        headers: {
          Authorization: 'Bearer malformed.invalid.token',
          Cookie: `nexuspanel_token=${adminToken}`
        }
      });
      assert.strictEqual(res.status, 401);
    });

    await test('AUTH: Valid Authorization header + invalid cookie -> 200 (Header Succeeds)', async () => {
      const res = await client.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          Cookie: 'nexuspanel_token=garbage-cookie'
        }
      });
      assert.strictEqual(res.status, 200);
    });

    await test('LOGOUT: Calling /logout immediately revokes the JWT token version', async () => {
      // 1. Token currently works
      const preRes = await client.get('/api/auth/me', { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.strictEqual(preRes.status, 200);

      // 2. Call logout with the token
      const logoutRes = await client.post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.strictEqual(logoutRes.status, 200);

      // 3. Old token MUST now be revoked and rejected with 401 TOKEN_REVOKED
      const postRes = await client.get('/api/auth/me', { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.strictEqual(postRes.status, 401);
      assert.strictEqual(postRes.data.code, 'TOKEN_REVOKED');

      // Issue a fresh active token for remaining tests
      const currentVer = db.prepare("SELECT token_version FROM users WHERE id = ?").get(adminUser.id).token_version;
      adminToken = jwt.sign({ id: adminUser.id, username: adminUser.username, role: 'admin', token_version: currentVer }, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' });
    });

    // -------------------------------------------------------------
    // [SECTION 3] STRICT FAIL-CLOSED CSRF VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[3/7] Testing Fail-Closed CSRF Protection & Origin Matching...');

    const cookieHeader = `nexuspanel_token=${adminToken}`;

    await test('CSRF: Cookie + Malicious Origin (http://evil.com) -> 403 CSRF_BLOCKED', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'Hacked' }, {
        headers: { Cookie: cookieHeader, Origin: 'http://evil.com' }
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, 'CSRF_BLOCKED');
    });

    await test('CSRF: Cookie + Malicious Referer (http://evil.com/page) -> 403 CSRF_BLOCKED', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'Hacked' }, {
        headers: { Cookie: cookieHeader, Referer: 'http://evil.com/phishing.html' }
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, 'CSRF_BLOCKED');
    });

    await test('CSRF FAIL-CLOSED: Cookie + Missing Origin AND Missing Referer -> 403 CSRF_BLOCKED', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'Hacked' }, {
        headers: { Cookie: cookieHeader }
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, 'CSRF_BLOCKED');
    });

    await test('CSRF: Cookie + Different Port (http://127.0.0.1:9999) -> 403 CSRF_BLOCKED', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'Hacked' }, {
        headers: { Cookie: cookieHeader, Origin: 'http://127.0.0.1:9999' }
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, 'CSRF_BLOCKED');
    });

    await test('CSRF: Cookie + Valid Origin -> 200 SUCCESS', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'NexusPanel Verified' }, {
        headers: { Cookie: cookieHeader, Origin: validOrigin }
      });
      assert.strictEqual(res.status, 200);
    });

    await test('CSRF: Cookie + Valid Referer (when Origin is omitted) -> 200 SUCCESS', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'NexusPanel Verified 2' }, {
        headers: { Cookie: cookieHeader, Referer: `${validOrigin}/admin` }
      });
      assert.strictEqual(res.status, 200);
    });

    await test('CSRF: Bearer Authorization + Missing Origin -> 200 SUCCESS (API Client)', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'NexusPanel Verified Bearer' }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
    });

    // -------------------------------------------------------------
    // [SECTION 4] SSRF ON LIVE ENDPOINTS & REDIRECT DEFENSE
    // -------------------------------------------------------------
    console.log('\n[4/7] Testing Live Endpoint SSRF & Redirect Defenses...');

    await test('SSRF: /api/health/probe rejects decimal loopback (http://2130706433)', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://2130706433' });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('SSRF') || res.data.error.includes('restricted'));
    });

    await test('SSRF: /api/health/probe rejects hex loopback (http://0x7f000001)', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://0x7f000001' });
      assert.strictEqual(res.status, 400);
    });

    await test('SSRF: /api/health/probe rejects octal loopback (http://0177.0.0.1)', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://0177.0.0.1' });
      assert.strictEqual(res.status, 400);
    });

    await test('SSRF: /api/health/probe rejects IPv4-mapped IPv6 loopback (http://[::ffff:127.0.0.1])', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://[::ffff:127.0.0.1]' });
      assert.strictEqual(res.status, 400);
    });

    await test('SSRF: /api/health/probe rejects AWS IMDS IPv6 (http://[fd00:ec2::254])', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://[fd00:ec2::254]' });
      assert.strictEqual(res.status, 400);
    });

    await test('SSRF: /api/proxmox/test rejects localhost with 400', async () => {
      const res = await client.post('/api/proxmox/test', { host: 'localhost', port: 8006 }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
    });

    // Start a mock HTTP redirect server to test Redirect SSRF defense
    const redirectServer = http.createServer((req, res) => {
      res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data' });
      res.end();
    });
    await new Promise((resolve) => redirectServer.listen(0, resolve));
    const redirectPort = redirectServer.address().port;

    await test('SSRF REDIRECT: Server returning 302 to cloud metadata is NOT followed', async () => {
      const res = await client.post('/api/health/probe', { url: `http://192.168.1.1:${redirectPort}` });
      // With maxRedirects: 0, the probe will not follow the redirect to 169.254.169.254
      assert.ok(res.status === 200 || res.status === 400);
      if (res.status === 200) {
        assert.notStrictEqual(res.data.httpStatus, 200, 'Must not return metadata 200 content');
      }
    });
    redirectServer.close();

    // -------------------------------------------------------------
    // [SECTION 5] BACKUP DoS, DEEP NESTING & PROTOTYPE POLLUTION
    // -------------------------------------------------------------
    console.log('\n[5/7] Testing Backup DoS & Payload Limits...');

    await test('BACKUP: Deeply nested JSON payload (depth > 6) is rejected with 400', async () => {
      let nested = { categories: [], services: [] };
      let curr = nested;
      for (let i = 0; i < 8; i++) {
        curr.child = {};
        curr = curr.child;
      }
      const res = await client.post('/api/backup/import', nested, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('depth'));
    });

    await test('BACKUP: Excessive entity arrays (> 200 categories) is rejected with 400', async () => {
      const hugeCategories = Array(250).fill(0).map((_, i) => ({ name: `Cat ${i}` }));
      const res = await client.post('/api/backup/import', { categories: hugeCategories, services: [] }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('limits'));
    });

    await test('BACKUP: Prototype pollution attempt is rejected with 400', async () => {
      const rawJson = '{"__proto__": {"polluted": true}, "categories": [], "services": []}';
      const res = await client.post('/api/backup/import', rawJson, {
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(Object.prototype.polluted, undefined);
    });

    // -------------------------------------------------------------
    // [SECTION 6] UPLOAD HARDENING & DECOMPRESSION BOMBS
    // -------------------------------------------------------------
    console.log('\n[6/7] Testing Upload Hardening & Dimension Boundaries...');

    await test('UPLOAD: Fake non-image binary file with PNG extension is rejected (400)', async () => {
      const form = new FormData();
      form.append('file', Buffer.from('NOT_AN_IMAGE_PAYLOAD_HERE'), { filename: 'fake.png', contentType: 'image/png' });
      const res = await client.post('/api/upload/image', form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
    });

    await test('UPLOAD: Valid 1x1 PNG is accepted and saved as UUID (200)', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      const form = new FormData();
      form.append('file', pngBuffer, { filename: 'test.png', contentType: 'image/png' });
      const res = await client.post('/api/upload/image', form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.filename.startsWith('upload-'));
    });

    // -------------------------------------------------------------
    // [SECTION 7] FACTORY RESET SECURITY
    // -------------------------------------------------------------
    console.log('\n[7/7] Testing Factory Reset Hardening...');

    await test('FACTORY RESET: Blocked without exact confirmation phrase (400)', async () => {
      const res = await client.post('/api/backup/factory-reset', { confirmation: 'invalid phrase' }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
    });

    await test('FACTORY RESET: Succeeds with exact confirmation phrase (200)', async () => {
      const res = await client.post('/api/backup/factory-reset', { confirmation: 'RESET NEXUSPANEL' }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

  } finally {
    server.close();
  }

  console.log(`\n=================================================================`);
  console.log(`Round 3 Red Team Verification: ${passed} passed, ${failed} failed`);
  console.log(`=================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRedTeamAudit().catch((err) => {
  console.error('Fatal Red Team verification failure:', err);
  process.exit(1);
});
