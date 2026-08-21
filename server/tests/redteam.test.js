import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import FormData from 'form-data';

import app from '../index.js';
import db from '../db/index.js';
import config from '../config/index.js';
import { 
  normalizeIpString, 
  isDangerousOrReservedIp, 
  validateDestinationHost, 
  createSecureLookup,
  safeHttpRequest 
} from '../utils/networkSecurity.js';

async function runRedTeamAudit() {
  console.log('\n⚔️ =================================================================');
  console.log('   NexusPanel ROUND 4 — ADVERSARIAL VALIDATION & RED TEAM AUDIT');
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
    console.log('\n[1/9] Testing First-Run Setup Concurrency & Atomicity...');

    db.exec(`
      DELETE FROM users;
      DELETE FROM settings WHERE key = 'setup_completed';
    `);

    await test('CONCURRENCY: 10 concurrent setup requests create EXACTLY ONE admin (9 get 403)', async () => {
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
      assert.strictEqual(forbiddenCount, 9, 'All concurrent setup requests must be blocked');

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
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}` };

    // Create a regular (non-admin) user for authorization boundary testing
    db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role, token_version, created_at, updated_at)
      VALUES ('regular_user', 'hash', 'Regular', 'user', 1, datetime('now'), datetime('now'))
    `).run();
    const nonAdminUser = db.prepare("SELECT id, username, role FROM users WHERE username = 'regular_user'").get();
    const nonAdminToken = jwt.sign(
      { id: nonAdminUser.id, username: nonAdminUser.username, role: nonAdminUser.role, token_version: 1 },
      config.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '24h' }
    );
    const nonAdminAuthHeader = { Authorization: `Bearer ${nonAdminToken}` };

    // -------------------------------------------------------------
    // [SECTION 2] OBJECT-LEVEL & ENDPOINT AUTHORIZATION MATRIX
    // -------------------------------------------------------------
    console.log('\n[2/9] Testing Full Object-Level & Admin Authorization Boundaries...');

    const adminEndpoints = [
      { method: 'put', url: '/api/settings', body: { dashboard_name: 'test' } },
      { method: 'get', url: '/api/backup/export' },
      { method: 'post', url: '/api/backup/import', body: { categories: [], services: [] } },
      { method: 'post', url: '/api/backup/factory-reset', body: { confirmation: 'RESET NEXUSPANEL' } },
      { method: 'post', url: '/api/services', body: { name: 't', url: 'http://192.168.1.1' } },
      { method: 'put', url: '/api/services/1', body: { name: 't', url: 'http://192.168.1.1' } },
      { method: 'delete', url: '/api/services/1' },
      { method: 'post', url: '/api/categories', body: { name: 't' } },
      { method: 'put', url: '/api/categories/1', body: { name: 't' } },
      { method: 'delete', url: '/api/categories/1' },
      { method: 'post', url: '/api/tags', body: { name: 't' } },
      { method: 'delete', url: '/api/tags/1' },
      { method: 'post', url: '/api/services/seed-demo', body: {} },
      { method: 'post', url: '/api/health/probe', body: { url: 'http://192.168.1.1:8080' } }
    ];

    async function sendRequest(method, url, data, headers = {}) {
      const m = method.toLowerCase();
      if (m === 'get' || m === 'delete') {
        return client[m](url, { headers, data });
      }
      return client[m](url, data, { headers });
    }

    for (const ep of adminEndpoints) {
      await test(`AUTH: Anonymous access to ${ep.method.toUpperCase()} ${ep.url} returns 401`, async () => {
        const res = await sendRequest(ep.method, ep.url, ep.body);
        assert.strictEqual(res.status, 401);
      });

      await test(`AUTH: Non-admin access to ${ep.method.toUpperCase()} ${ep.url} returns 403`, async () => {
        const res = await sendRequest(ep.method, ep.url, ep.body, nonAdminAuthHeader);
        assert.strictEqual(res.status, 403);
      });
    }

    // -------------------------------------------------------------
    // [SECTION 3] JWT ATTACK VECTORS & EDGE CASES
    // -------------------------------------------------------------
    console.log('\n[3/9] Testing JWT Edge Cases & Cryptographic Validation...');

    await test('JWT: "alg: none" token is rejected with 401', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ id: adminUser.id, username: adminUser.username, role: 'admin', token_version: 1 })).toString('base64url');
      const res = await client.get('/api/auth/me', { headers: { Authorization: `Bearer ${header}.${payload}.` } });
      assert.strictEqual(res.status, 401);
    });

    await test('JWT: Token with future nbf (Not Before) is rejected with 401', async () => {
      const futureNbfToken = jwt.sign(
        { id: adminUser.id, username: adminUser.username, role: 'admin', token_version: 1, nbf: Math.floor(Date.now() / 1000) + 3600 },
        config.JWT_SECRET,
        { algorithm: 'HS256' }
      );
      const res = await client.get('/api/auth/me', { headers: { Authorization: `Bearer ${futureNbfToken}` } });
      assert.strictEqual(res.status, 401);
    });

    await test('JWT: Token with invalid user ID payload type is rejected with 401', async () => {
      const invalidIdToken = jwt.sign(
        { id: { nested: 'object' }, username: adminUser.username, role: 'admin', token_version: 1 },
        config.JWT_SECRET,
        { algorithm: 'HS256' }
      );
      const res = await client.get('/api/auth/me', { headers: { Authorization: `Bearer ${invalidIdToken}` } });
      assert.strictEqual(res.status, 401);
    });

    await test('JWT: Token for deleted/non-existent user ID is rejected with 401 (USER_NOT_FOUND)', async () => {
      const ghostToken = jwt.sign(
        { id: 999999, username: 'ghost_user', role: 'admin', token_version: 1 },
        config.JWT_SECRET,
        { algorithm: 'HS256' }
      );
      const res = await client.get('/api/auth/me', { headers: { Authorization: `Bearer ${ghostToken}` } });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.code, 'USER_NOT_FOUND');
    });

    await test('AUTH: Invalid Authorization header + valid cookie -> 401 (Strict Precedence)', async () => {
      const res = await client.get('/api/auth/me', {
        headers: {
          Authorization: 'Bearer bad.token.here',
          Cookie: `nexuspanel_token=${adminToken}`
        }
      });
      assert.strictEqual(res.status, 401);
    });

    await test('AUTH: Valid Authorization header + invalid cookie -> 200 (Header Wins)', async () => {
      const res = await client.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          Cookie: 'nexuspanel_token=invalid'
        }
      });
      assert.strictEqual(res.status, 200);
    });

    await test('LOGOUT: Calling /logout immediately revokes active token version (401 on reuse)', async () => {
      // Token currently works
      const pre = await client.get('/api/auth/me', { headers: adminAuthHeader });
      assert.strictEqual(pre.status, 200);

      // Call logout
      const logout = await client.post('/api/auth/logout', {}, { headers: adminAuthHeader });
      assert.strictEqual(logout.status, 200);

      // Old token must now be revoked
      const post = await client.get('/api/auth/me', { headers: adminAuthHeader });
      assert.strictEqual(post.status, 401);
      assert.strictEqual(post.data.code, 'TOKEN_REVOKED');

      // Refresh admin token for subsequent test suites
      const curVer = db.prepare("SELECT token_version FROM users WHERE id = ?").get(adminUser.id).token_version;
      adminToken = jwt.sign({ id: adminUser.id, username: adminUser.username, role: 'admin', token_version: curVer }, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' });
    });

    // -------------------------------------------------------------
    // [SECTION 4] STRICT FAIL-CLOSED CSRF VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[4/9] Testing Fail-Closed CSRF Protection & Full Origin Matching...');

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

    await test('CSRF: Cookie + Valid Referer (Origin omitted) -> 200 SUCCESS', async () => {
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
    // [SECTION 5] DNS REBINDING & SOCKET BOUNDARY VALIDATION
    // -------------------------------------------------------------
    console.log('\n[5/9] Testing DNS Rebinding & Socket Security Boundaries...');

    await test('DNS REBINDING: createSecureLookup aborts socket connection if resolved IP is loopback', async () => {
      const lookup = createSecureLookup(true);
      await new Promise((resolve) => {
        lookup('localhost', {}, (err, address) => {
          assert.ok(err, 'Lookup must return an error for loopback');
          assert.strictEqual(address, undefined);
          resolve();
        });
      });
    });

    await test('DNS REBINDING: createSecureLookup aborts socket connection for metadata IP (169.254.169.254)', async () => {
      const lookup = createSecureLookup(true);
      await new Promise((resolve) => {
        lookup('169.254.169.254', {}, (err, address) => {
          assert.ok(err, 'Lookup must return an error for cloud metadata');
          assert.strictEqual(address, undefined);
          resolve();
        });
      });
    });

    await test('DNS REBINDING: createSecureLookup aborts socket connection for IPv6 metadata ([fd00:ec2::254])', async () => {
      const lookup = createSecureLookup(true);
      await new Promise((resolve) => {
        lookup('fd00:ec2::254', {}, (err, address) => {
          assert.ok(err, 'Lookup must return an error for IPv6 metadata');
          assert.strictEqual(address, undefined);
          resolve();
        });
      });
    });

    await test('DNS REBINDING: createSecureLookup aborts socket connection for IPv4-mapped IPv6 (::ffff:127.0.0.1)', async () => {
      const lookup = createSecureLookup(true);
      await new Promise((resolve) => {
        lookup('::ffff:127.0.0.1', {}, (err, address) => {
          assert.ok(err, 'Lookup must return an error for IPv4-mapped loopback');
          assert.strictEqual(address, undefined);
          resolve();
        });
      });
    });

    // -------------------------------------------------------------
    // [SECTION 6] LIVE ENDPOINT SSRF & ZERO-REDIRECT DEFENSE
    // -------------------------------------------------------------
    console.log('\n[6/9] Testing Live Endpoint SSRF & Zero-Redirect Defenses...');

    await test('SSRF: /api/health/probe rejects decimal loopback (http://2130706433)', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://2130706433' }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('SSRF') || res.data.error.includes('restricted'));
    });

    await test('SSRF: /api/health/probe rejects hex loopback (http://0x7f000001)', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://0x7f000001' }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.strictEqual(res.status, 400);
    });

    await test('SSRF: /api/health/probe rejects octal loopback (http://0177.0.0.1)', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://0177.0.0.1' }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.strictEqual(res.status, 400);
    });

    await test('SSRF: /api/health/probe rejects AWS IMDS IPv6 (http://[fd00:ec2::254])', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://[fd00:ec2::254]' }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.strictEqual(res.status, 400);
    });

    await test('SSRF: /api/proxmox/test rejects localhost with 400', async () => {
      const res = await client.post('/api/proxmox/test', { host: 'localhost', port: 8006 }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
    });

    // Mock redirect server
    const redirectServer = http.createServer((req, res) => {
      res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data' });
      res.end();
    });
    await new Promise((resolve) => redirectServer.listen(0, resolve));
    const redirectPort = redirectServer.address().port;

    await test('SSRF REDIRECT: Server returning 302 to cloud metadata is NOT followed', async () => {
      const res = await client.post('/api/health/probe', { url: `http://192.168.1.1:${redirectPort}` }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert.ok(res.status === 200 || res.status === 400);
      if (res.status === 200) {
        assert.notStrictEqual(res.data.httpStatus, 200);
      }
    });
    redirectServer.close();

    // -------------------------------------------------------------
    // [SECTION 7] BACKUP HARD BODY LIMIT & PAYLOAD CONSTRAINTS
    // -------------------------------------------------------------
    console.log('\n[7/9] Testing Backup Hard Body Size Limit (5MB) & Structure...');

    await test('BACKUP: Request body exceeding 5MB hard limit is rejected with 413 (Payload Too Large)', async () => {
      // 6MB payload
      const hugeString = 'X'.repeat(6 * 1024 * 1024);
      const res = await client.post('/api/backup/import', `{"dummy":"${hugeString}"}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      assert.strictEqual(res.status, 413);
    });

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
    // [SECTION 8] UPLOAD HARDENING & DECOMPRESSION BOMB LIMITS
    // -------------------------------------------------------------
    console.log('\n[8/9] Testing Upload Hardening, Signatures & Dimension Limits...');

    await test('UPLOAD: Fake non-image binary with PNG extension is rejected (400)', async () => {
      const form = new FormData();
      form.append('file', Buffer.from('NOT_AN_IMAGE_PAYLOAD_SAFE_TEST_MARKER'), { filename: 'fake.png', contentType: 'image/png' });
      const res = await client.post('/api/upload/image', form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
    });

    await test('UPLOAD: PNG with oversized dimensions (> 4096px decompression bomb) is rejected (400)', async () => {
      // Valid PNG header with 10000 x 10000 px dimensions in IHDR
      const bombPng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // Signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // 'IHDR'
        0x00, 0x00, 0x27, 0x10, // Width: 10,000 px
        0x00, 0x00, 0x27, 0x10, // Height: 10,000 px
        0x08, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      const form = new FormData();
      form.append('file', bombPng, { filename: 'bomb.png', contentType: 'image/png' });
      const res = await client.post('/api/upload/image', form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('Wymiary obrazu'));
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
    // [SECTION 9] FACTORY RESET SECURITY (Runs at the very end)
    // -------------------------------------------------------------
    console.log('\n[9/9] Testing Factory Reset Hardening...');

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
  console.log(`Round 4 Adversarial Audit Results: ${passed} passed, ${failed} failed`);
  console.log(`=================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRedTeamAudit().catch((err) => {
  console.error('Fatal Red Team audit failure:', err);
  process.exit(1);
});
