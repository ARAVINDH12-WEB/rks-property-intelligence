import app from './index.js';
import { getDb } from './db/index.js';
import http from 'http';

async function verifyPart2LoginAndSiteVisits() {
  console.log('🧪 Testing Part 2: Login & Site Visit Booking Robustness & Status Codes...\n');

  await getDb();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5996, resolve));
  const BASE_URL = 'http://127.0.0.1:5996/api';

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
    // 1. Valid Admin Login
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'admin123' }),
    });
    const adminData = (await adminRes.json()) as any;
    assert(adminRes.status === 200 && !!adminData.token && adminData.user?.role === 'ADMIN', 'Valid Admin login -> 200 OK with token & user info');

    // 2. Valid Manager Login
    const mgrRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@rks.com', password: 'manager123' }),
    });
    const mgrData = (await mgrRes.json()) as any;
    assert(mgrRes.status === 200 && !!mgrData.token && mgrData.user?.role === 'MANAGER', 'Valid Manager login -> 200 OK with token & user info');

    // 3. Invalid Email (Non-existent user)
    const badEmailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@rks.com', password: 'admin123' }),
    });
    const badEmailData = (await badEmailRes.json()) as any;
    assert(badEmailRes.status === 401 && badEmailData.error === 'Invalid email or password', `Non-existent user -> 401 Unauthorized (error: "${badEmailData.error}")`);

    // 4. Invalid Password
    const badPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'wrongpassword' }),
    });
    const badPassData = (await badPassRes.json()) as any;
    assert(badPassRes.status === 401 && badPassData.error === 'Invalid email or password', `Incorrect password -> 401 Unauthorized (error: "${badPassData.error}")`);

    // 5. Empty Credentials
    const emptyCredsRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });
    const emptyCredsData = (await emptyCredsRes.json()) as any;
    assert(emptyCredsRes.status === 400, `Empty credentials -> 400 Bad Request (error: "${emptyCredsData.error}")`);

    // 6. Valid Site Visit Booking with property
    const visitPropRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Lakshmi Narayan',
        customer_phone: '+91 98401 55667',
        customer_email: 'lakshmi@outlook.com',
        visit_date: '2026-09-28',
        time_slot: '02:00 PM - 04:00 PM',
        pickup_required: true,
        pickup_location: 'Tambaram Railway Station',
        property_id: 1,
      }),
    });
    const visitPropData = (await visitPropRes.json()) as any;
    assert(visitPropRes.status === 201 && !!visitPropData.bookingReference, `Valid site visit booking (with property) -> 201 Created (Ref: ${visitPropData.bookingReference})`);

    // 7. Valid General Site Visit Booking without property
    const visitGenRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Ravi Kumar',
        customer_phone: '+91 98402 33445',
        visit_date: '2026-09-29',
        time_slot: '10:00 AM - 12:00 PM',
        notes: 'Looking for OMR villa plots',
      }),
    });
    const visitGenData = (await visitGenRes.json()) as any;
    assert(visitGenRes.status === 201 && !!visitGenData.bookingReference, `Valid site visit booking (general) -> 201 Created (Ref: ${visitGenData.bookingReference})`);

    // 8. Invalid Site Visit Booking (Missing name)
    const noNameRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_phone: '+91 98402 33445',
        visit_date: '2026-09-29',
      }),
    });
    const noNameData = (await noNameRes.json()) as any;
    assert(noNameRes.status === 400 && noNameData.error === 'Customer name is required', `Missing customer name -> 400 Bad Request (error: "${noNameData.error}")`);

    // 9. Invalid Site Visit Booking (Missing phone)
    const noPhoneRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Ravi Kumar',
        visit_date: '2026-09-29',
      }),
    });
    const noPhoneData = (await noPhoneRes.json()) as any;
    assert(noPhoneRes.status === 400 && noPhoneData.error === 'Customer phone number is required', `Missing phone number -> 400 Bad Request (error: "${noPhoneData.error}")`);

    console.log(`\n🎉 PART 2 VERIFICATION COMPLETE: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

verifyPart2LoginAndSiteVisits().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
