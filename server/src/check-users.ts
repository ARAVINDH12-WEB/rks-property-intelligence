import { getDb, query } from './db/index.js';
import bcrypt from 'bcryptjs';

async function inspectUsers() {
  await getDb();
  const res = await query('SELECT id, name, email, role, password_hash FROM users');
  console.log('Current users count:', res.rowCount);
  for (const u of res.rows) {
    const isAdmin123 = await bcrypt.compare('admin123', u.password_hash);
    const isManager123 = await bcrypt.compare('manager123', u.password_hash);
    console.log({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isAdmin123Match: isAdmin123,
      isManager123Match: isManager123,
    });
  }
}

inspectUsers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
