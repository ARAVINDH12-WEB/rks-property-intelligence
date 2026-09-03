import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, query } from './index.js';

export async function seedDatabase(force: boolean = false) {
  // Prevent seeding completely in production unless explicitly forced for some maintenance reason
  if (process.env.NODE_ENV === 'production' && !force) {
    console.log('ℹ️ Production environment detected. Skipping seed script.');
    return;
  }

  await getDb();

  // Check if initial seeding already completed
  if (!force) {
    try {
      const metaCheck = await query("SELECT value FROM system_meta WHERE key = 'seed_completed'");
      if (metaCheck.rowCount > 0 && metaCheck.rows[0]?.value === 'true') {
        console.log('ℹ️ Database already seeded. Skipping re-seed.');
        return;
      }
    } catch {
      // Table might not exist yet, proceed with seed
    }
  }

  console.log('🌱 Starting database initialization for RKS Property Intelligence...');

  // 1. Clean the database (only if forced or first run on a dev/empty db)
  await query('DELETE FROM audit_logs');
  await query('DELETE FROM property_history');
  await query('DELETE FROM property_documents');
  await query('DELETE FROM property_images');
  await query('DELETE FROM properties');
  await query('DELETE FROM projects');
  await query('DELETE FROM locations');
  await query('DELETE FROM site_visits');
  await query('DELETE FROM offers');
  await query('DELETE FROM users'); // Wipes all users, including old demo accounts

  // 2. Initialize Single Secure Admin
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@rks.com';
  let adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  let generatedPassword = false;

  if (!adminPassword) {
    adminPassword = crypto.randomBytes(8).toString('hex'); // 16 char random password
    generatedPassword = true;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5)`,
    ['System Administrator', adminEmail, passwordHash, 'ADMIN', '']
  );

  console.log('----------------------------------------------------');
  console.log('✅ Single secure admin account created successfully.');
  console.log(`Email: ${adminEmail}`);
  if (generatedPassword) {
    console.log(`Password: ${adminPassword}`);
    console.log('⚠️ IMPORTANT: Please copy this password now! It will not be shown again.');
  } else {
    console.log('Password: (Set via environment variable)');
  }
  console.log('----------------------------------------------------');

  // Mark seed as completed
  await query(
    `INSERT INTO system_meta (key, value) VALUES ('seed_completed', 'true')
     ON CONFLICT (key) DO UPDATE SET value = 'true'`
  );

  console.log('🌱 Database initialization complete.');
}
