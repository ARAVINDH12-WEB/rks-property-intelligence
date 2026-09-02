import app from './index.js';
import { getDb, query } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import http from 'http';

async function runE2ETests() {
  console.log('🚀 Running E2E API Verification for Login, Site Visits, and Dashboard Endpoints...\n');

  // 1. Ensure DB is seeded
  await getDb();
  const userCheck = await query('SELECT count(*)::int as count FROM users');
  if (Number(userCheck.rows[0]?.count || 0) === 0) {
    await seedDatabase();
  }

  // 2. Start temporary HTTP server on port 5999
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
    // TEST 1: Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = (await healthRes.json()) as any;
    assert(healthRes.status === 200 && healthData.status === 'OK', `GET /api/health -> 200 OK (DB connected, ${healthData.usersCount} users, ${healthData.propertiesCount} properties)`);

    // TEST 2: POST /api/auth/login with valid admin credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'admin123' }),
    });
    const loginData = (await loginRes.json()) as any;
    assert(loginRes.status === 200 && !!loginData.token, `POST /api/auth/login (valid admin) -> 200 OK with token (${loginData.user?.name}, role: ${loginData.user?.role})`);

    const authToken = loginData.token;

    // TEST 3: POST /api/auth/login with invalid credentials (MUST return 401, not 500)
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'wrongpassword' }),
    });
    const invalidLoginData = (await invalidLoginRes.json()) as any;
    assert(invalidLoginRes.status === 401 && invalidLoginData.error.includes('Invalid email or password'), `POST /api/auth/login (wrong password) -> 401 Unauthorized (error: "${invalidLoginData.error}")`);

    // TEST 4: POST /api/site-visits (Public Customer Booking)
    const bookingRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Anand Sharma',
        customer_phone: '+91 98401 55667',
        customer_email: 'anand@example.com',
        visit_date: '2026-09-15',
        time_slot: '10:00 AM - 12:00 PM',
        pickup_required: true,
        pickup_location: 'Velachery, Chennai',
        notes: 'Interested in East facing residential plots',
      }),
    });
    const bookingData = (await bookingRes.json()) as any;
    assert(bookingRes.status === 201 && !!bookingData.bookingReference, `POST /api/site-visits (public booking) -> 201 Created (Ref: ${bookingData.bookingReference})`);

    // TEST 5: POST /api/site-visits validation error (Missing required name/phone -> 400 Bad Request, not 500)
    const invalidBookingRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: '',
        customer_phone: '',
        visit_date: '',
      }),
    });
    const invalidBookingData = (await invalidBookingRes.json()) as any;
    assert(invalidBookingRes.status === 400, `POST /api/site-visits (invalid payload) -> 400 Bad Request (error: "${invalidBookingData.error}")`);

    // TEST 6: Authenticated Dashboard Endpoints using token
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };

    const propRes = await fetch(`${BASE_URL}/properties`, { headers: authHeaders });
    assert(propRes.status === 200, `GET /api/properties (with token) -> 200 OK`);

    const svRes = await fetch(`${BASE_URL}/site-visits`, { headers: authHeaders });
    assert(svRes.status === 200, `GET /api/site-visits (with token) -> 200 OK`);

    const prjRes = await fetch(`${BASE_URL}/projects`, { headers: authHeaders });
    assert(prjRes.status === 200, `GET /api/projects (with token) -> 200 OK`);

    const locRes = await fetch(`${BASE_URL}/locations`, { headers: authHeaders });
    assert(locRes.status === 200, `GET /api/locations (with token) -> 200 OK`);

    const repRes = await fetch(`${BASE_URL}/reports`, { headers: authHeaders });
    assert(repRes.status === 200, `GET /api/reports (with token) -> 200 OK`);

    console.log(`\n📊 Verification Results: ${passed} passed, ${failed} failed`);
  } finally {
    server.close();
  }
}

runE2ETests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
