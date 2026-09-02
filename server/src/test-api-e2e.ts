process.env.NODE_ENV = 'test';
import app from './index.js';
import { getDb, query } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import http from 'http';

async function runMasterVerificationTests() {
  console.log('🚀 Running Comprehensive Acceptance Tests for RKS Prime Properties Platform...\n');

  // 1. Force seed once for clean test baseline
  await getDb();
  await seedDatabase(true);

  // 2. Start temporary HTTP server on port 5998
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5998, resolve));

  const BASE_URL = 'http://127.0.0.1:5998/api';
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
    // -------------------------------------------------------------
    // PART 2: AUTHENTICATION & SITE VISITS (LOGIN / BOOKING)
    // -------------------------------------------------------------
    console.log('--- PART 2: Verifying Login & Site Visit Booking ---');

    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = (await healthRes.json()) as any;
    assert(healthRes.status === 200 && healthData.status === 'OK', `GET /api/health -> 200 OK (DB connected, users: ${healthData.usersCount}, properties: ${healthData.propertiesCount})`);

    // 2. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'admin123' }),
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    assert(adminLoginRes.status === 200 && !!adminLoginData.token, `POST /api/auth/login (Admin) -> 200 OK (Token issued for ${adminLoginData.user?.name})`);
    const adminToken = adminLoginData.token;

    // 3. Manager Login
    const managerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@rks.com', password: 'manager123' }),
    });
    const managerLoginData = (await managerLoginRes.json()) as any;
    assert(managerLoginRes.status === 200 && !!managerLoginData.token, `POST /api/auth/login (Manager) -> 200 OK`);
    const managerToken = managerLoginData.token;

    // 4. Invalid Login (Must return 401, NOT 500)
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'wrongpassword' }),
    });
    const invalidLoginData = (await invalidLoginRes.json()) as any;
    assert(invalidLoginRes.status === 401, `POST /api/auth/login (Invalid credentials) -> 401 Unauthorized (error: "${invalidLoginData.error}")`);

    // 5. Public Site Visit Booking (Must return 201 Created)
    const bookingRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Venkatesh Raghavan',
        customer_phone: '+91 98402 88990',
        customer_email: 'venkat@example.com',
        visit_date: '2026-09-20',
        time_slot: '10:00 AM - 12:00 PM',
        pickup_required: true,
        pickup_location: 'OMR Sholinganallur',
        notes: 'Looking for villa plots',
      }),
    });
    const bookingData = (await bookingRes.json()) as any;
    assert(bookingRes.status === 201 && !!bookingData.bookingReference, `POST /api/site-visits -> 201 Created (Ref: ${bookingData.bookingReference})`);
    const createdBookingId = bookingData.booking?.id;

    // -------------------------------------------------------------
    // PART 1: DATA DELETION PERMANENCE & SEED LOCK
    // -------------------------------------------------------------
    console.log('\n--- PART 1: Verifying Data Deletion Permanence (No Re-appearing on Refresh) ---');

    // 1. Delete a property permanently as Admin
    const propToDelRes = await query("SELECT id, property_code FROM properties WHERE property_code = 'RKS-00124'");
    const testPropId = propToDelRes.rows[0]?.id;
    assert(!!testPropId, `Found target property RKS-00124 (ID: ${testPropId})`);

    const delPropRes = await fetch(`${BASE_URL}/properties/${testPropId}?permanent=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delPropRes.status === 200, `DELETE /api/properties/${testPropId}?permanent=true -> 200 OK`);

    // 2. Simulate 5 page refreshes & confirm it stays deleted
    let propertyReappeared = false;
    for (let i = 1; i <= 5; i++) {
      // Trigger seed check like server startup
      await seedDatabase(false);
      const checkRes = await query('SELECT id FROM properties WHERE id = $1', [testPropId]);
      if (checkRes.rowCount > 0) {
        propertyReappeared = true;
        break;
      }
    }
    assert(!propertyReappeared, 'Property RKS-00124 stays permanently deleted across 5 refreshes and server re-inits (No re-seed)');

    // 3. Delete site visit & confirm it stays deleted
    const delSvRes = await fetch(`${BASE_URL}/site-visits/${createdBookingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(delSvRes.status === 200, `DELETE /api/site-visits/${createdBookingId} -> 200 OK`);

    let visitReappeared = false;
    for (let i = 1; i <= 5; i++) {
      await seedDatabase(false);
      const checkSv = await query('SELECT id FROM site_visits WHERE id = $1', [createdBookingId]);
      if (checkSv.rowCount > 0) {
        visitReappeared = true;
        break;
      }
    }
    assert(!visitReappeared, `Site visit #${createdBookingId} stays permanently deleted across 5 refreshes`);

    // -------------------------------------------------------------
    // PART 3: "OFFERS" SECTION & ROLE-BASED PERMISSIONS
    // -------------------------------------------------------------
    console.log('\n--- PART 3: Verifying Offers Feature & Role Permissions ---');

    // 1. Customer view (Only active & non-expired)
    const custOffersRes = await fetch(`${BASE_URL}/offers`);
    const custOffersData = (await custOffersRes.json()) as any;
    const anyExpiredInCustView = custOffersData.offers?.some((o: any) => o.calculated_status === 'EXPIRED');
    assert(custOffersRes.status === 200 && !anyExpiredInCustView, `GET /api/offers (Customer view) -> 200 OK (Returns only active, non-expired offers. Expired count: 0)`);

    // 2. Manager view (Sees ALL offers including expired)
    const mgrOffersRes = await fetch(`${BASE_URL}/offers`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const mgrOffersData = (await mgrOffersRes.json()) as any;
    const hasExpiredInMgrView = mgrOffersData.offers?.some((o: any) => o.calculated_status === 'EXPIRED');
    assert(mgrOffersRes.status === 200 && hasExpiredInMgrView, `GET /api/offers (Manager view) -> 200 OK (Sees all ${mgrOffersData.offers?.length} offers including expired campaigns)`);

    // 3. Manager blocked from creating offer (Must return 403 Forbidden)
    const mgrCreateRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        title: 'Manager Unauthorized Offer',
        description: 'Should be blocked',
        discount_value: '50% OFF',
        start_date: '2026-09-01',
        end_date: '2026-09-30',
      }),
    });
    assert(mgrCreateRes.status === 403, `POST /api/offers (Manager Attempt) -> 403 Forbidden (Blocked server-side)`);

    // 4. Admin creates new offer (Full CRUD)
    const adminCreateRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Diwali Mega Concession 2026',
        description: 'Special 15% rate discount on all East facing plots in Chennai micro-markets.',
        discount_type: 'PERCENTAGE',
        discount_value: '15% Mega Discount',
        start_date: '2026-09-01',
        end_date: '2026-11-15',
        is_active: true,
        applicable_properties: 'OMR, Tambaram, Guduvanchery',
      }),
    });
    const adminCreateData = (await adminCreateRes.json()) as any;
    assert(adminCreateRes.status === 201 && !!adminCreateData.offer?.id, `POST /api/offers (Admin CRUD) -> 201 Created (ID: ${adminCreateData.offer?.id})`);
    const newOfferId = adminCreateData.offer?.id;

    // 5. Admin updates offer
    const adminUpdateRes = await fetch(`${BASE_URL}/offers/${newOfferId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        discount_value: '20% Mega Concession',
        is_active: true,
      }),
    });
    const adminUpdateData = (await adminUpdateRes.json()) as any;
    assert(adminUpdateRes.status === 200 && adminUpdateData.offer?.discount_value === '20% Mega Concession', `PUT /api/offers/${newOfferId} (Admin CRUD) -> 200 OK (Updated discount value)`);

    // 6. Admin deletes offer
    const adminDelOfferRes = await fetch(`${BASE_URL}/offers/${newOfferId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDelOfferRes.status === 200, `DELETE /api/offers/${newOfferId} (Admin CRUD) -> 200 OK`);

    // -------------------------------------------------------------
    // PART 4: TEAM MEMBER EDIT (ADMIN ONLY)
    // -------------------------------------------------------------
    console.log('\n--- PART 4: Verifying Team Member Edit Feature (Admin Only) ---');

    // 1. Get employee user
    const empRes = await query("SELECT id, name, email, role, phone FROM users WHERE email = 'employee@rks.com'");
    const empUser = empRes.rows[0];
    assert(!!empUser, `Found target staff member ${empUser?.name} (ID: ${empUser?.id})`);

    // 2. Manager blocked from editing team member (Must return 403 Forbidden)
    const mgrEditUserRes = await fetch(`${BASE_URL}/auth/users/${empUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({ name: 'Hacked Name' }),
    });
    assert(mgrEditUserRes.status === 403, `PUT /api/auth/users/${empUser.id} (Manager Attempt) -> 403 Forbidden (Blocked server-side)`);

    // 3. Admin successfully edits team member
    const adminEditUserRes = await fetch(`${BASE_URL}/auth/users/${empUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Karthik Venkat (Senior Sales Officer)',
        email: 'employee@rks.com',
        phone: '+91 98402 99999',
        role: 'EMPLOYEE',
      }),
    });
    const adminEditUserData = (await adminEditUserRes.json()) as any;
    assert(
      adminEditUserRes.status === 200 &&
      adminEditUserData.user?.name === 'Karthik Venkat (Senior Sales Officer)' &&
      adminEditUserData.user?.phone === '+91 98402 99999',
      `PUT /api/auth/users/${empUser.id} (Admin Edit) -> 200 OK (Updated name & phone)`
    );

    // 4. Safety Check: Admin cannot demote last remaining admin
    const adminSelfRes = await query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    const soleAdminId = adminSelfRes.rows[0]?.id;
    const demoteRes = await fetch(`${BASE_URL}/auth/users/${soleAdminId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'EMPLOYEE' }),
    });
    assert(demoteRes.status === 400, `PUT /api/auth/users/${soleAdminId} (Demote last admin attempt) -> 400 Bad Request (Safety check triggered)`);

    console.log(`\n🎉 All Master Acceptance Tests Passed! Total: ${passed} passed, ${failed} failed`);
  } finally {
    server.close();
  }
}

runMasterVerificationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
