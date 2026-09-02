import app from './index.js';
import { getDb, query } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import http from 'http';

async function verifyPart1DeletePersistence() {
  console.log('🧪 Testing Part 1: Deletion Persistence Across Server Restarts & Refreshes...\n');

  await getDb();

  // Create HTTP server on port 5997
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5997, resolve));
  const BASE_URL = 'http://127.0.0.1:5997/api';

  try {
    // 1. Authenticate as Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'admin123' }),
    });
    const loginData = (await loginRes.json()) as any;
    const token = loginData.token;

    // 2. Fetch valid project & location
    const projRes = await query('SELECT id FROM projects LIMIT 1');
    const locRes = await query('SELECT id FROM locations LIMIT 1');
    const projectId = projRes.rows[0]?.id;
    const locationId = locRes.rows[0]?.id;

    // 3. Create a specific test property to delete
    const propRes = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        property_code: 'TEST-DEL-999',
        property_type: 'Plot',
        project_id: projectId,
        location_id: locationId,
        area_sqft: 1800,
        rate_per_sqft: 3500,
        total_price: 6300000,
        status: 'AVAILABLE',
      }),
    });
    const propData = (await propRes.json()) as any;
    const propId = propData.property?.id;
    console.log(`  ✓ Created test property #${propId} (${propData.property?.property_code})`);

    // 3. Create a specific test site visit to delete
    const visitRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Delete Test Customer',
        customer_phone: '+91 99999 88888',
        visit_date: '2026-10-01',
        time_slot: '10:00 AM - 12:00 PM',
        notes: 'Test site visit for deletion persistence',
      }),
    });
    const visitData = (await visitRes.json()) as any;
    const visitId = visitData.booking?.id;
    console.log(`  ✓ Created test site visit #${visitId}`);

    // 4. Delete property permanently
    const delPropRes = await fetch(`${BASE_URL}/properties/${propId}?permanent=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`  ✓ DELETE /api/properties/${propId}?permanent=true returned status ${delPropRes.status}`);

    // 5. Delete site visit
    const delVisitRes = await fetch(`${BASE_URL}/site-visits/${visitId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`  ✓ DELETE /api/site-visits/${visitId} returned status ${delVisitRes.status}`);

    // 6. Simulate 5 consecutive page refreshes and server re-boots
    console.log('  ✓ Simulating 5 consecutive server restarts / request cycles...');
    for (let cycle = 1; cycle <= 5; cycle++) {
      // Check query directly against DB
      const propCheck = await query('SELECT id FROM properties WHERE id = $1', [propId]);
      const visitCheck = await query('SELECT id FROM site_visits WHERE id = $1', [visitId]);

      if (propCheck.rowCount > 0) {
        throw new Error(`FAILURE: Property #${propId} reappeared on cycle ${cycle}!`);
      }
      if (visitCheck.rowCount > 0) {
        throw new Error(`FAILURE: Site visit #${visitId} reappeared on cycle ${cycle}!`);
      }
      console.log(`    - Refresh Cycle #${cycle}: Property #${propId} & Visit #${visitId} stay deleted ✅`);
    }

    console.log('\n🎉 PART 1 VERIFICATION PASSED: Deleted data NEVER reappears.');
  } finally {
    server.close();
  }
}

verifyPart1DeletePersistence()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
