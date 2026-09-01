import { getDb, query } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { calculateTotalPrice, calculateAreaConversions } from './utils/calculations.js';

async function runAcceptanceTests() {
  console.log('🧪 Starting Acceptance & Verification Tests for RKS Property Intelligence...\n');
  await getDb();
  const preCheck = await query('SELECT count(*)::int as count FROM properties');
  if (preCheck.rows[0]?.count === 0) {
    await seedDatabase();
  }

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // Test 1: Relational Schema & Property Count
  const countRes = await query('SELECT count(*)::int as count FROM properties WHERE archived = false');
  assert(countRes.rows[0]?.count >= 20, `Database contains ${countRes.rows[0]?.count} properties (>= 20 required)`);

  // Test 2: Core Visual Priority Fields Verification
  const propRes = await query(`
    SELECT property_code, area_sqft, rate_per_sqft, total_price, status
    FROM properties WHERE property_code = 'RKS-00124'
  `);
  const prop = propRes.rows[0];
  assert(!!prop, 'Found sample master property RKS-00124');
  assert(Number(prop.area_sqft) === 2400, `Area Sq.Ft matches: 2400 sq.ft`);
  assert(Number(prop.rate_per_sqft) === 5200, `Rate per Sq.Ft matches: ₹5,200`);
  assert(Number(prop.total_price) === 12480000, `Total Price auto-calculated correctly: ₹1,24,80,000`);
  assert(prop.status === 'AVAILABLE', `Status is AVAILABLE`);

  // Test 3: Land Unit Conversions
  const conversions = calculateAreaConversions(2400);
  assert(conversions.grounds === 1, '1 Ground = 2,400 Sq.Ft conversion accurate');
  assert(conversions.cents === 5.51, '5.51 Cents conversion accurate');
  assert(conversions.sqm === 222.97, '222.97 Sq.Meters conversion accurate');

  // Test 4: Dynamic Auto-Calculation Formula
  const calcPrice = calculateTotalPrice(3600, 5300);
  assert(calcPrice === 19080000, '3,600 sq.ft * ₹5,300/sq.ft = ₹1,90,80,000');

  // Test 5: Projects & Locations Relations
  const prjRes = await query(`
    SELECT prj.name, count(p.id)::int as unit_count
    FROM projects prj
    LEFT JOIN properties p ON prj.id = p.project_id
    GROUP BY prj.id, prj.name
  `);
  assert(prjRes.rows.length >= 6, `Found ${prjRes.rows.length} projects linked with properties`);

  // Test 6: Audit Logging Integrity
  const auditRes = await query('SELECT count(*)::int as count FROM audit_logs');
  assert(auditRes.rows[0]?.count > 0, `Audit log records tracked: ${auditRes.rows[0]?.count}`);

  // Test 7: Property History Timeline Integrity
  const histRes = await query('SELECT count(*)::int as count FROM property_history');
  assert(histRes.rows[0]?.count > 0, `Property timeline events tracked: ${histRes.rows[0]?.count}`);

  // Test 8: Site Visit Booking Integrity
  const svRes = await query('SELECT count(*)::int as count FROM site_visits');
  assert(svRes.rows[0]?.count > 0, `Site visits seeded & active: ${svRes.rows[0]?.count}`);

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runAcceptanceTests().then(() => process.exit(0)).catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
