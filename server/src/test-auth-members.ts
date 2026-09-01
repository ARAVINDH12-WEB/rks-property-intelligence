import { query, getDb } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rks_property_intelligence_super_secret_jwt_key_2026';

async function testAuthAndMembers() {
  console.log('🧪 Testing Authentication, Sign-Up & Member Onboarding...\n');
  await getDb();
  const preCheck = await query('SELECT count(*)::int as count FROM users');
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

  // Test 1: Register New Customer / Public Member
  const testEmail = `customer_${Date.now()}@gmail.com`;
  const salt = await bcrypt.genSalt(10);
  const passHash = await bcrypt.hash('customerPass123', salt);

  const regRes = await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, 'VIEWER', '+91 98400 99887')
     RETURNING id, name, email, role, phone`,
    ['Test Customer Member', testEmail, passHash]
  );
  const newUser = regRes.rows[0];
  assert(!!newUser && newUser.role === 'VIEWER', 'Public member registered successfully with role VIEWER');

  // Test 2: Token verification
  const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });
  const decoded: any = jwt.verify(token, JWT_SECRET);
  assert(decoded.email === testEmail, 'JWT token generated and verified accurately');

  // Test 3: Add Staff Member as Admin
  const staffEmail = `sales_officer_${Date.now()}@rks.com`;
  const staffHash = await bcrypt.hash('rks_password123', salt);
  const staffRes = await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, 'EMPLOYEE', '+91 99400 11223')
     RETURNING id, name, email, role, phone`,
    ['Kavitha Balakrishnan (Sales Executive)', staffEmail, staffHash]
  );
  const staffUser = staffRes.rows[0];
  assert(!!staffUser && staffUser.role === 'EMPLOYEE', 'Staff executive added with role EMPLOYEE');

  // Test 4: Verify All Members Listed
  const allUsersRes = await query('SELECT count(*)::int as count FROM users');
  assert(allUsersRes.rows[0]?.count >= 6, `Total registered members directory: ${allUsersRes.rows[0]?.count}`);

  console.log(`\n📊 Auth & Member Tests Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

testAuthAndMembers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });
