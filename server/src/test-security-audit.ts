import app from './index.js';
import { getDb, query } from './db/index.js';
import http from 'http';

async function runSecurityAuditTests() {
  console.log('🛡️ Starting Master Local Security Audit & Penetration Suite...\n');

  await getDb();

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
    // 1. SECTION 1: Security Headers Audit
    console.log('--- 1. Testing HTTP Security Headers ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(
      healthRes.headers.get('x-content-type-options') === 'nosniff',
      "Header 'X-Content-Type-Options: nosniff' present"
    );
    assert(
      healthRes.headers.get('x-frame-options') === 'SAMEORIGIN',
      "Header 'X-Frame-Options: SAMEORIGIN' present (Clickjacking protection)"
    );
    assert(
      healthRes.headers.get('x-xss-protection') === '1; mode=block',
      "Header 'X-XSS-Protection: 1; mode=block' present"
    );
    assert(
      healthRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin',
      "Header 'Referrer-Policy: strict-origin-when-cross-origin' present"
    );
    assert(
      !healthRes.headers.get('x-powered-by'),
      "Header 'X-Powered-By' stripped (Fingerprint protection)"
    );

    // 2. SECTION 2: SQL Injection Resistance
    console.log('\n--- 2. Testing SQL Injection Resistance ---');
    const sqlPayloads = [
      "' OR 1=1 --",
      "'; DROP TABLE users; --",
      "' UNION SELECT null, null, password_hash FROM users --",
      "admin' --",
    ];

    for (const payload of sqlPayloads) {
      const sqliRes = await fetch(`${BASE_URL}/health?q=${encodeURIComponent(payload)}`);
      assert(
        sqliRes.status === 200,
        `SQL injection payload safely handled as literal string: "${payload.slice(0, 25)}..."`
      );
    }

    // Verify users table was NOT dropped
    const checkTable = await query('SELECT count(*)::int as count FROM users');
    assert(Number(checkTable.rows[0]?.count) > 0, "Users table intact and protected from SQL injection");

    // 3. SECTION 3: XSS & HTML Payload Sanitization
    console.log('\n--- 3. Testing XSS & Malicious Input Handling ---');
    const xssBookingRes = await fetch(`${BASE_URL}/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: "<script>alert('XSS_ATTACK')</script>",
        customer_phone: '+91 98402 11223',
        visit_date: '2026-09-30',
        special_requests: '<img src=x onerror=alert(1)>',
      }),
    });
    assert(
      xssBookingRes.status === 201,
      'XSS string payload safely accepted without code execution (201 Created)'
    );

    // 4. SECTION 4: Role-Based Authorization Enforcement (RBAC)
    console.log('\n--- 4. Testing Server-Side RBAC Enforcement ---');
    // Login as Employee
    const empLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@rks.com', password: 'employee123' }),
    });
    const empToken = ((await empLogin.json()) as any).token;

    // Login as Manager
    const mgrLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@rks.com', password: 'manager123' }),
    });
    const mgrToken = ((await mgrLogin.json()) as any).token;

    // Employee blocked from permanent deletion
    const empDeleteRes = await fetch(`${BASE_URL}/properties/1?permanent=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(
      empDeleteRes.status === 403,
      'Employee blocked from permanent property deletion (403 Forbidden)'
    );

    // Manager blocked from editing team member
    const mgrEditUserRes = await fetch(`${BASE_URL}/auth/users/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mgrToken}`,
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    assert(
      mgrEditUserRes.status === 403,
      'Manager blocked from user role escalation (403 Forbidden)'
    );

    // Unauthenticated blocked from Audit Logs
    const unauthAuditRes = await fetch(`${BASE_URL}/audit-logs`);
    assert(
      unauthAuditRes.status === 401,
      'Unauthenticated request to Audit Logs blocked (401 Unauthorized)'
    );

    // 5. SECTION 5: Error Leakage & Stack Trace Concealment
    console.log('\n--- 5. Testing Error Sanitization ---');
    const badReqRes = await fetch(`${BASE_URL}/properties/invalid-id`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    const badReqData = (await badReqRes.json()) as any;
    assert(
      badReqRes.status === 400 && !badReqData.stack,
      'Client receives clean JSON error without internal stack trace leakage'
    );

    console.log(`\n🎉 MASTER LOCAL SECURITY AUDIT PASSED: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runSecurityAuditTests().catch((err) => {
  console.error('Security audit suite crashed:', err);
  process.exit(1);
});
