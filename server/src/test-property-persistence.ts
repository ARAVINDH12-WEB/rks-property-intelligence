import app from './index.js';
import { getDb, query } from './db/index.js';
import http from 'http';

async function testPropertyPersistence() {
  console.log('🧪 Starting Property Creation & Import Persistence Verification...\n');

  await getDb();

  // Start temporary test server
  let server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5996, resolve));
  let BASE_URL = 'http://127.0.0.1:5996/api';

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
    // 1. Authenticate as Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'admin123' }),
    });
    const loginData = (await loginRes.json()) as any;
    const token = loginData.token;
    assert(loginRes.status === 200 && !!token, 'Admin authentication successful');

    // 2. Fetch Projects and Locations to get valid IDs
    const projRes = await fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const projData = (await projRes.json()) as any;
    const projectId = projData.projects[0]?.id || 1;

    const locRes = await fetch(`${BASE_URL}/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const locData = (await locRes.json()) as any;
    const locationId = locData.locations[0]?.id || 1;

    // 3. STEP 1 & 2: Single Property Creation via POST /api/properties
    const singlePropCode = `RKS-NEW-PROP-${Date.now().toString().slice(-4)}`;
    console.log(`\n--- Step 1: Testing Single Property Creation (${singlePropCode}) ---`);
    const createRes = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        property_code: singlePropCode,
        project_id: projectId,
        location_id: locationId,
        property_type: 'Residential Plot',
        category: 'Premium',
        status: 'AVAILABLE',
        plot_number: 'Plot 777',
        area_sqft: 2400,
        rate_per_sqft: 4500,
        total_price: 10800000,
        facing: 'North',
        road_width: '40 ft',
        description: 'New premium test plot for persistence validation',
      }),
    });

    const createData = (await createRes.json()) as any;
    assert(
      createRes.status === 201 && createData.property?.id > 0,
      `POST /api/properties -> 201 Created with database-generated ID #${createData.property?.id}`
    );

    // 4. STEP 3: Bulk Spreadsheet Import via POST /api/import/commit
    const importPropCode = `RKS-IMP-ROW-${Date.now().toString().slice(-4)}`;
    console.log(`\n--- Step 2: Testing Bulk Import Commit (${importPropCode}) ---`);
    const importRes = await fetch(`${BASE_URL}/import/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: 'test_inventory_batch.xlsx',
        rows: [
          {
            isValid: true,
            property_code: importPropCode,
            project_name: 'RKS Green Valley',
            location_name: 'Chennai',
            property_type: 'Villa',
            status: 'AVAILABLE',
            plot_number: 'Villa V-99',
            survey_number: 'SF-108/2',
            area_sqft: 3200,
            rate_per_sqft: 6500,
            total_price: 20800000,
            facing: 'East',
            road_width: '50 ft',
            description: 'Imported luxury villa unit',
          },
        ],
      }),
    });

    const importData = (await importRes.json()) as any;
    assert(
      importRes.status === 200 && importData.importedCount === 1,
      `POST /api/import/commit -> 200 OK (Imported ${importData.importedCount} rows successfully)`
    );

    // 5. STEP 4: Query Database directly to verify raw SQL persistence
    const rawCheckSingle = await query('SELECT * FROM properties WHERE property_code = $1', [singlePropCode]);
    assert(rawCheckSingle.rowCount === 1, `Direct SQL verification: '${singlePropCode}' exists in 'properties' table`);

    const rawCheckImport = await query('SELECT * FROM properties WHERE property_code = $1', [importPropCode]);
    assert(rawCheckImport.rowCount === 1, `Direct SQL verification: '${importPropCode}' exists in 'properties' table`);

    // 6. STEP 5: Verify 5 Consecutive Refresh Cycles (GET /api/properties)
    console.log('\n--- Step 3: Verifying 5 Consecutive Page Refreshes ---');
    for (let i = 1; i <= 5; i++) {
      const fetchRes = await fetch(`${BASE_URL}/properties?q=${singlePropCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchData = (await fetchRes.json()) as any;
      const found = fetchData.properties?.some((p: any) => p.property_code === singlePropCode);
      assert(found, `Refresh cycle ${i}/5: '${singlePropCode}' returned in GET /api/properties list`);
    }

    // 7. STEP 6: Full Server Shutdown & Restart Simulation
    console.log('\n--- Step 4: Simulating Server Shutdown & Full Reboot ---');
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('  🔌 Server successfully closed.');

    // Reboot on a new port (5997)
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(5997, resolve));
    BASE_URL = 'http://127.0.0.1:5997/api';
    console.log('  ⚡ Server restarted on fresh socket.');

    // 8. STEP 7: Re-verify both properties exist after complete reboot
    const postRebootSingle = await fetch(`${BASE_URL}/properties?q=${singlePropCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const postRebootSingleData = (await postRebootSingle.json()) as any;
    const singleStillExists = postRebootSingleData.properties?.some((p: any) => p.property_code === singlePropCode);
    assert(singleStillExists, `POST-REBOOT VERIFICATION: Created property '${singlePropCode}' survives server restart`);

    const postRebootImport = await fetch(`${BASE_URL}/properties?q=${importPropCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const postRebootImportData = (await postRebootImport.json()) as any;
    const importStillExists = postRebootImportData.properties?.some((p: any) => p.property_code === importPropCode);
    assert(importStillExists, `POST-REBOOT VERIFICATION: Imported property '${importPropCode}' survives server restart`);

    console.log(`\n🎉 PROPERTY PERSISTENCE VERIFICATION COMPLETE: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

testPropertyPersistence().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
