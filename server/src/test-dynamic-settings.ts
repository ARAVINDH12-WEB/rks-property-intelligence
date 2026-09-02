import app from './index.js';
import { getDb, query } from './db/index.js';
import http from 'http';

async function testDynamicAdminSettings() {
  console.log('🧪 Starting Verification of Admin-Configurable Settings (Phase 1)...\n');

  await getDb();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5999, resolve));
  const BASE_URL = 'http://127.0.0.1:5999/api';

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as Admin & Manager
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'admin123' }),
    });
    const adminToken = ((await adminLogin.json()) as any).token;

    const mgrLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@rks.com', password: 'manager123' }),
    });
    const mgrToken = ((await mgrLogin.json()) as any).token;

    // 2. Public GET /api/settings
    const getSettingsRes = await fetch(`${BASE_URL}/settings`);
    const getSettingsData = (await getSettingsRes.json()) as any;
    assert(
      getSettingsRes.status === 200 && typeof getSettingsData.settings === 'object',
      `GET /api/settings (Public / Customer) -> 200 OK (Loaded ${Object.keys(getSettingsData.settings || {}).length} dynamic settings)`
    );

    // 3. Manager blocked from modifying settings
    const mgrPutRes = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mgrToken}`,
      },
      body: JSON.stringify({ settings: { stat_total_plots: '999+' } }),
    });
    assert(
      mgrPutRes.status === 403,
      'Manager blocked from updating site settings (403 Forbidden)'
    );

    // 4. Admin Batch Update
    const batchUpdateRes = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        settings: {
          stat_total_plots: '75+ Verified Plots',
          stat_base_rate: '₹920/sq.ft',
          contact_phone: '+91 98409 99888',
          toggle_whatsapp_button: 'false',
        },
      }),
    });
    const batchData = (await batchUpdateRes.json()) as any;
    assert(
      batchUpdateRes.status === 200 && batchData.updatedKeys?.length === 4,
      `PUT /api/settings (Admin Batch Update) -> 200 OK (Updated 4 keys: ${batchData.updatedKeys?.join(', ')})`
    );

    // 5. Verify instant reflection on public GET
    const fetchUpdatedRes = await fetch(`${BASE_URL}/settings`);
    const fetchUpdatedData = (await fetchUpdatedRes.json()) as any;
    assert(
      fetchUpdatedData.settings.stat_total_plots === '75+ Verified Plots' &&
        fetchUpdatedData.settings.stat_base_rate === '₹920/sq.ft' &&
        fetchUpdatedData.settings.contact_phone === '+91 98409 99888' &&
        fetchUpdatedData.settings.toggle_whatsapp_button === 'false',
      'GET /api/settings immediately reflects new values on next fetch without code redeployment'
    );

    // 6. Admin Single Key Update
    const singlePutRes = await fetch(`${BASE_URL}/settings/stat_total_acreage`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ value: '180+ Acres' }),
    });
    const singlePutData = (await singlePutRes.json()) as any;
    assert(
      singlePutRes.status === 200 && singlePutData.value === '180+ Acres',
      `PUT /api/settings/stat_total_acreage -> 200 OK (Updated to '${singlePutData.value}')`
    );

    console.log(`\n🎉 PHASE 1 DYNAMIC ADMIN SETTINGS VERIFICATION: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

testDynamicAdminSettings().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
