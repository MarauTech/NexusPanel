import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import FormData from 'form-data';

import app from '../index.js';
import db from '../db/index.js';
import config from '../config/index.js';
import { normalizeIpString, isDangerousOrReservedIp, validateDestinationHost } from '../utils/networkSecurity.js';

async function runRedTeamAudit() {
  console.log('\n⚔️ =======================================================');
  console.log('   NexusPanel FINAL RED TEAM & SECURITY VERIFICATION AUDIT');
  console.log('   =======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [BLOCKED/DEFENDED] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [VULNERABILITY/FAILURE] ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.response?.data) {
        console.error(`     Response:`, JSON.stringify(err.response.data));
      }
      failed++;
    }
  }

  // Start test server
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
    // [SECTION 1] JWT ATTACK ATTEMPTS
    // -------------------------------------------------------------
    console.log('\n[1/8] Testing JWT Attack Vectors & Signature Forgery...');

    // Reset database state
    db.exec(`
      DELETE FROM users;
      DELETE FROM settings WHERE key = 'setup_completed';
    `);

    // Complete setup with strong 12+ char password
    const setupRes = await client.post('/api/auth/setup', {
      username: 'redteam_admin',
      password: 'StrongAdminPassword2026!',
      dashboardName: 'RedTeam Test Lab'
    });
    assert.strictEqual(setupRes.status, 201);
    let validAdminToken = setupRes.data.token;
    const adminUserId = setupRes.data.user.id;

    await test('JWT: "alg: none" token injection is rejected with 401', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ id: adminUserId, username: 'redteam_admin', role: 'admin', token_version: 1 })).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const res = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${noneToken}` }
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.code, 'INVALID_TOKEN');
    });

    await test('JWT: Forged signature with wrong secret is rejected with 401', async () => {
      const forgedToken = jwt.sign(
        { id: adminUserId, username: 'redteam_admin', role: 'admin', token_version: 1 },
        'wrong-attacker-secret-key-1234567890',
        { algorithm: 'HS256' }
      );
      const res = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${forgedToken}` }
      });
      assert.strictEqual(res.status, 401);
    });

    await test('JWT: Privilege escalation by tampering role in payload is rejected with 401', async () => {
      const parts = validAdminToken.split('.');
      const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      decodedPayload.role = 'super_root_admin';
      const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const res = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${tamperedToken}` }
      });
      assert.strictEqual(res.status, 401);
    });

    await test('JWT: Token revocation on password change invalidates previously issued JWTs', async () => {
      // 1. Change password
      const changeRes = await client.put('/api/auth/password', {
        currentPassword: 'StrongAdminPassword2026!',
        newPassword: 'BrandNewStrongPassword2026!'
      }, {
        headers: { Authorization: `Bearer ${validAdminToken}` }
      });
      assert.strictEqual(changeRes.status, 200);
      const freshToken = changeRes.data.token;

      // 2. Old token MUST be rejected with TOKEN_REVOKED
      const oldTokenRes = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${validAdminToken}` }
      });
      assert.strictEqual(oldTokenRes.status, 401);
      assert.strictEqual(oldTokenRes.data.code, 'TOKEN_REVOKED');

      // 3. Fresh token works and becomes active
      const freshTokenRes = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${freshToken}` }
      });
      assert.strictEqual(freshTokenRes.status, 200);
      validAdminToken = freshToken;
    });

    // -------------------------------------------------------------
    // [SECTION 2] CSRF & ORIGIN MANIPULATION
    // -------------------------------------------------------------
    console.log('\n[2/8] Testing CSRF & Cross-Origin State Mutation Attacks...');

    // Login to obtain cookie
    const loginRes = await client.post('/api/auth/login', {
      username: 'redteam_admin',
      password: 'BrandNewStrongPassword2026!'
    });
    assert.strictEqual(loginRes.status, 200);
    const activeToken = loginRes.data.token;
    const cookieHeader = `nexuspanel_token=${activeToken}`;

    await test('CSRF: Cross-Origin POST /api/settings with cookie is blocked by CSRF guard (403)', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'Hacked Dashboard' }, {
        headers: {
          Cookie: cookieHeader,
          Origin: 'http://attacker-evil-website.com'
        }
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, 'CSRF_BLOCKED');
    });

    await test('CSRF: Cross-Origin Referer on state-changing endpoint is blocked (403)', async () => {
      const res = await client.put('/api/settings', { dashboard_name: 'Hacked Referer' }, {
        headers: {
          Cookie: cookieHeader,
          Referer: 'http://malicious-referrer-site.org/attack.html'
        }
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.code, 'CSRF_BLOCKED');
    });

    // -------------------------------------------------------------
    // [SECTION 3] ADVANCED SSRF BYPASS ATTEMPTS
    // -------------------------------------------------------------
    console.log('\n[3/8] Testing Advanced SSRF Obfuscation & Encoded Addresses...');

    await test('SSRF: Decimal IP normalization (2130706433 -> 127.0.0.1)', () => {
      assert.strictEqual(normalizeIpString('2130706433'), '127.0.0.1');
      assert.strictEqual(isDangerousOrReservedIp('2130706433'), true);
    });

    await test('SSRF: Hex IP normalization (0x7f000001 -> 127.0.0.1)', () => {
      assert.strictEqual(normalizeIpString('0x7f000001'), '127.0.0.1');
      assert.strictEqual(isDangerousOrReservedIp('0x7f000001'), true);
    });

    await test('SSRF: Octal IP normalization (0177.0.0.1 -> 127.0.0.1)', () => {
      assert.strictEqual(normalizeIpString('0177.0.0.1'), '127.0.0.1');
      assert.strictEqual(isDangerousOrReservedIp('0177.0.0.1'), true);
    });

    await test('SSRF: Userinfo URL stripping (user:pass@127.0.0.1)', () => {
      assert.strictEqual(normalizeIpString('admin:secret@127.0.0.1'), '127.0.0.1');
      assert.strictEqual(isDangerousOrReservedIp('admin:secret@127.0.0.1'), true);
    });

    await test('SSRF: IPv4-mapped IPv6 loopback (::ffff:127.0.0.1) is blocked', () => {
      assert.strictEqual(isDangerousOrReservedIp('::ffff:127.0.0.1'), true);
    });

    await test('SSRF: AWS ECS Task metadata IP (169.254.170.2) is blocked', () => {
      assert.strictEqual(isDangerousOrReservedIp('169.254.170.2'), true);
    });

    await test('SSRF: AWS IMDS IPv6 metadata ([fd00:ec2::254]) is blocked', () => {
      assert.strictEqual(isDangerousOrReservedIp('fd00:ec2::254'), true);
    });

    await test('SSRF: /api/health/probe rejects decimal loopback (http://2130706433)', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://2130706433' });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('SSRF') || res.data.error.includes('restricted'));
    });

    await test('SSRF: /api/health/probe rejects cloud metadata (http://169.254.169.254/latest/meta-data)', async () => {
      const res = await client.post('/api/health/probe', { url: 'http://169.254.169.254/latest/meta-data' });
      assert.strictEqual(res.status, 400);
    });

    await test('SSRF: /api/proxmox/test rejects localhost host input with 400', async () => {
      const res = await client.post('/api/proxmox/test', {
        host: '127.0.0.1',
        port: 8006
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('SSRF') || res.data.error.includes('Nieprawidłowy'));
    });

    // -------------------------------------------------------------
    // [SECTION 4] PASSWORD POLICY & BRUTE-FORCE RESILIENCE
    // -------------------------------------------------------------
    console.log('\n[4/8] Testing Password Policy Enforcements...');

    await test('POLICY: Weak 6-character password on password change is rejected with 400', async () => {
      const res = await client.put('/api/auth/password', {
        currentPassword: 'BrandNewStrongPassword2026!',
        newPassword: 'short'
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('12'));
    });

    // -------------------------------------------------------------
    // [SECTION 5] UPLOAD SECURITY (POLYGLOT & MAGIC BYTES)
    // -------------------------------------------------------------
    console.log('\n[5/8] Testing Polyglot File Uploads & Extension Mismatches...');

    await test('UPLOAD: Fake non-image binary file with PNG extension is rejected (400)', async () => {
      const form = new FormData();
      form.append('file', Buffer.from('PLAIN_TEXT_NOT_AN_IMAGE_FILE_DATA_HERE'), {
        filename: 'fake_image.png',
        contentType: 'image/png'
      });

      const res = await client.post('/api/upload/image', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${activeToken}`
        }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('podpis binarny'));
    });

    await test('UPLOAD: Path traversal in filename is sanitized to random UUID (200)', async () => {
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
        filename: '../../../../etc/cron.d/exploit.png',
        contentType: 'image/png'
      });

      const res = await client.post('/api/upload/image', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${activeToken}`
        }
      });
      assert.strictEqual(res.status, 200);
      assert.ok(!res.data.filename.includes('..'));
      assert.ok(res.data.filename.startsWith('upload-'));
    });

    // -------------------------------------------------------------
    // [SECTION 6] PROTOTYPE POLLUTION & BACKUP INTEGRITY
    // -------------------------------------------------------------
    console.log('\n[6/8] Testing Prototype Pollution & Backup Exploit Payloads...');

    await test('BACKUP: Prototype pollution in JSON payload is rejected (400)', async () => {
      const payload = {
        categories: [],
        services: [],
        __proto__: { polluted: true }
      };
      // Send raw json with __proto__ key
      const rawJson = '{"__proto__": {"polluted": true}, "categories": [], "services": []}';
      const res = await client.post('/api/backup/import', rawJson, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        }
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(Object.prototype.polluted, undefined);
    });

    // -------------------------------------------------------------
    // [SECTION 7] SCANNER BOUNDARY ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n[7/8] Testing Network Scanner Limits...');

    await test('SCANNER: Huge arbitrary CIDR / host count is blocked (400)', async () => {
      const tooManyHosts = Array(500).fill('192.168.1.1');
      const res = await client.post('/api/scanner/scan-custom', {
        hosts: tooManyHosts
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      assert.strictEqual(res.status, 400);
    });

    // -------------------------------------------------------------
    // [SECTION 8] FACTORY RESET SECURITY (Run at the very end)
    // -------------------------------------------------------------
    console.log('\n[8/8] Testing Factory Reset Hardening...');

    await test('FACTORY RESET: Operation without explicit confirmation phrase is blocked (400)', async () => {
      const res = await client.post('/api/backup/factory-reset', {
        confirmation: 'yes please'
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('RESET NEXUSPANEL'));
    });

    await test('FACTORY RESET: Operation with exact confirmation phrase succeeds', async () => {
      const res = await client.post('/api/backup/factory-reset', {
        confirmation: 'RESET NEXUSPANEL'
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

  } finally {
    server.close();
  }

  console.log(`\n=======================================================`);
  console.log(`Final Red Team Results: ${passed} passed, ${failed} failed`);
  console.log(`=======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRedTeamAudit().catch((err) => {
  console.error('Fatal Red Team test failure:', err);
  process.exit(1);
});
