// Comprehensive automated integration & unit tests for NexusPanel
import assert from 'assert';
import axios from 'axios';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`\n🚀 Starting NexusPanel Automated Test Suite against ${BASE_URL}\n`);
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

  // 1. Health API Tests
  await test('GET /api/health returns status ok', async () => {
    const res = await axios.get(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
  });

  await test('POST /api/health/probe successfully probes valid host', async () => {
    const res = await axios.post(`${BASE_URL}/api/health/probe`, { url: `${BASE_URL}/api/health` });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'online');
    assert.ok(typeof res.data.responseTime === 'number');
  });

  await test('POST /api/health/probe rejects invalid protocol (SSRF guard)', async () => {
    try {
      await axios.post(`${BASE_URL}/api/health/probe`, { url: 'file:///etc/passwd' });
      assert.fail('Should have rejected non-http protocol');
    } catch (err) {
      assert.strictEqual(err.response.status, 400);
      assert.ok(err.response.data.error.includes('http'));
    }
  });

  // 2. Settings API Tests
  await test('GET /api/settings returns all dashboard settings', async () => {
    const res = await axios.get(`${BASE_URL}/api/settings`);
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.data === 'object');
    assert.ok('dashboard_name' in res.data);
    assert.ok('theme' in res.data);
    assert.ok('accent_color' in res.data);
  });

  await test('PUT /api/settings updates settings successfully', async () => {
    const updateRes = await axios.put(`${BASE_URL}/api/settings`, {
      dashboard_name: 'NexusPanel Test Hub',
      theme: 'dark'
    });
    assert.strictEqual(updateRes.status, 200);

    const getRes = await axios.get(`${BASE_URL}/api/settings`);
    assert.strictEqual(getRes.data.dashboard_name, 'NexusPanel Test Hub');
  });

  // 3. Categories API Tests
  let testCatId = null;
  await test('POST /api/categories creates a new category', async () => {
    const res = await axios.post(`${BASE_URL}/api/categories`, {
      name: 'Automated Test Category',
      icon: 'shield',
      color: '#10b981',
      sort_order: 99
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.data.id > 0);
    testCatId = res.data.id;
  });

  await test('GET /api/categories lists categories including created one', async () => {
    const res = await axios.get(`${BASE_URL}/api/categories`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    const found = res.data.find(c => c.id === testCatId);
    assert.ok(found);
    assert.strictEqual(found.name, 'Automated Test Category');
  });

  await test('PUT /api/categories/:id updates category', async () => {
    const res = await axios.put(`${BASE_URL}/api/categories/${testCatId}`, {
      name: 'Updated Test Category',
      icon: 'server',
      color: '#6366f1'
    });
    assert.strictEqual(res.status, 200);

    const getRes = await axios.get(`${BASE_URL}/api/categories`);
    const found = getRes.data.find(c => c.id === testCatId);
    assert.strictEqual(found.name, 'Updated Test Category');
  });

  // 4. Services API Tests
  let testSvcId = null;
  await test('POST /api/services creates a service with tags & validation', async () => {
    const res = await axios.post(`${BASE_URL}/api/services`, {
      name: 'Automated Test Service (ąćęłńóśźż)',
      description: 'Testing unicode Polish diacritics and special chars & < > " \' /',
      url: 'https://192.168.1.100:8443',
      category_id: testCatId,
      icon: 'proxmox',
      color: '#e57000',
      open_new_tab: 1,
      enabled: 1,
      favorite: 1,
      health_check_enabled: 1,
      health_check_url: 'https://192.168.1.100:8443',
      custom_badge: 'Test Node',
      tags: ['autotest', 'hypervisor', 'docker']
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.data.id > 0);
    testSvcId = res.data.id;
  });

  await test('GET /api/services lists services with populated tags and categories', async () => {
    const res = await axios.get(`${BASE_URL}/api/services`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    const found = res.data.find(s => s.id === testSvcId);
    assert.ok(found);
    assert.strictEqual(found.category_name, 'Updated Test Category');
    assert.strictEqual(found.favorite, 1);
    assert.ok(Array.isArray(found.tags));
    assert.ok(found.tags.some(t => t.name === 'autotest'));
  });

  await test('PUT /api/services/:id updates service details', async () => {
    const res = await axios.put(`${BASE_URL}/api/services/${testSvcId}`, {
      name: 'Automated Test Service (Updated)',
      description: 'Updated description',
      url: 'https://192.168.1.100:8443',
      category_id: testCatId,
      icon: 'server',
      color: '#6366f1',
      open_new_tab: 1,
      enabled: 1,
      favorite: 0,
      tags: ['autotest', 'updated']
    });
    assert.strictEqual(res.status, 200);

    const getRes = await axios.get(`${BASE_URL}/api/services/${testSvcId}`);
    assert.strictEqual(getRes.data.name, 'Automated Test Service (Updated)');
    assert.strictEqual(getRes.data.favorite, 0);
  });

  // 5. Validation Rejection Tests
  await test('POST /api/services rejects empty name and url', async () => {
    try {
      await axios.post(`${BASE_URL}/api/services`, { name: '', url: '' });
      assert.fail('Should have failed validation');
    } catch (err) {
      assert.strictEqual(err.response.status, 400);
      assert.ok(err.response.data.errors);
    }
  });

  // 6. Tags API Tests
  let testTagId = null;
  await test('POST /api/tags creates a tag', async () => {
    const res = await axios.post(`${BASE_URL}/api/tags`, {
      name: 'test-tag-isolated',
      color: '#ef4444'
    });
    assert.strictEqual(res.status, 201);
    testTagId = res.data.id;
  });

  await test('GET /api/tags lists tags with usage count', async () => {
    const res = await axios.get(`${BASE_URL}/api/tags`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    const found = res.data.find(t => t.id === testTagId);
    assert.ok(found);
    assert.strictEqual(found.name, 'test-tag-isolated');
  });

  // 7. Backup Export and Import Tests
  let exportedData = null;
  await test('GET /api/backup/export exports clean JSON structure', async () => {
    const res = await axios.get(`${BASE_URL}/api/backup/export`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.categories));
    assert.ok(Array.isArray(res.data.services));
    assert.ok(Array.isArray(res.data.settings));
    exportedData = res.data;
  });

  await test('POST /api/backup/import restores backup cleanly', async () => {
    const res = await axios.post(`${BASE_URL}/api/backup/import`, exportedData);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  // 8. Cleanup test entities
  await test('DELETE /api/services/:id removes test service', async () => {
    const res = await axios.delete(`${BASE_URL}/api/services/${testSvcId}`);
    assert.strictEqual(res.status, 200);
  });

  await test('DELETE /api/categories/:id removes test category', async () => {
    const res = await axios.delete(`${BASE_URL}/api/categories/${testCatId}`);
    assert.strictEqual(res.status, 200);
  });

  await test('DELETE /api/tags/:id removes test tag', async () => {
    const res = await axios.delete(`${BASE_URL}/api/tags/${testTagId}`);
    assert.strictEqual(res.status, 200);
  });

  // 9. Seed Demo API test
  await test('POST /api/services/seed-demo loads 10 homelab apps cleanly', async () => {
    const res = await axios.post(`${BASE_URL}/api/services/seed-demo`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    const servicesRes = await axios.get(`${BASE_URL}/api/services`);
    assert.ok(servicesRes.data.length >= 10);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
