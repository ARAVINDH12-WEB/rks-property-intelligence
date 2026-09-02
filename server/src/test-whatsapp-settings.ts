import app from './index.js';
import { getDb } from './db/index.js';
import http from 'http';

async function verifyWhatsAppFeature() {
  console.log('🧪 Testing Part 6 & 7: WhatsApp Dynamic Connect & Admin Settings RBAC...\n');

  await getDb();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5995, resolve));
  const BASE_URL = 'http://127.0.0.1:5995/api';

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
    // 1. Get Admin & Manager Tokens
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rks.com', password: 'admin123' }),
    });
    const adminToken = ((await adminLoginRes.json()) as any).token;

    const mgrLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@rks.com', password: 'manager123' }),
    });
    const mgrToken = ((await mgrLoginRes.json()) as any).token;

    // 2. Public GET /api/settings/whatsapp (Customer accessible without auth)
    const publicGetRes = await fetch(`${BASE_URL}/settings/whatsapp`);
    const publicGetData = (await publicGetRes.json()) as any;
    assert(
      publicGetRes.status === 200 && !!publicGetData.whatsapp_number,
      `GET /api/settings/whatsapp (Public / Customer) -> 200 OK (Current: ${publicGetData.whatsapp_number})`
    );

    // 3. Manager blocked from updating WhatsApp number (403 Forbidden)
    const mgrPutRes = await fetch(`${BASE_URL}/settings/whatsapp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mgrToken}`,
      },
      body: JSON.stringify({ whatsapp_number: '+919999988888' }),
    });
    assert(mgrPutRes.status === 403, `PUT /api/settings/whatsapp (Manager Attempt) -> 403 Forbidden (Blocked server-side)`);

    // 4. Admin invalid phone validation (400 Bad Request)
    const badPhoneRes = await fetch(`${BASE_URL}/settings/whatsapp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ whatsapp_number: '12345' }),
    });
    const badPhoneData = (await badPhoneRes.json()) as any;
    assert(
      badPhoneRes.status === 400,
      `PUT /api/settings/whatsapp (Invalid format) -> 400 Bad Request (error: "${badPhoneData.error}")`
    );

    // 5. Admin updates WhatsApp number to new valid international number (+919840099887)
    const updateRes = await fetch(`${BASE_URL}/settings/whatsapp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ whatsapp_number: '+919840099887' }),
    });
    const updateData = (await updateRes.json()) as any;
    assert(
      updateRes.status === 200 && updateData.whatsapp_number === '+919840099887',
      `PUT /api/settings/whatsapp (Admin Update) -> 200 OK (Updated to +919840099887)`
    );

    // 6. Verify instant reflection on public customer fetch
    const publicGet2Res = await fetch(`${BASE_URL}/settings/whatsapp`);
    const publicGet2Data = (await publicGet2Res.json()) as any;
    assert(
      publicGet2Res.status === 200 && publicGet2Data.whatsapp_number === '+919840099887',
      `GET /api/settings/whatsapp (Next Customer Fetch) -> 200 OK (Reflects +919840099887 immediately without redeploy)`
    );

    console.log(`\n🎉 PART 6 & 7 VERIFICATION COMPLETE: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

verifyWhatsAppFeature().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
