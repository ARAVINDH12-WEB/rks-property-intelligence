import { getDb, query } from './db/index.js';
import fs from 'fs';
import path from 'path';

async function performBackup() {
  await getDb();
  const tables = [
    'users',
    'locations',
    'projects',
    'properties',
    'property_images',
    'property_documents',
    'property_history',
    'audit_logs',
    'import_batches',
    'site_visits',
    'customer_visitors',
    'offers',
    'system_meta'
  ];

  const backupData: Record<string, any> = {};

  for (const table of tables) {
    try {
      const res = await query(`SELECT * FROM ${table}`);
      backupData[table] = res.rows;
    } catch (err: any) {
      backupData[table] = { error: err.message };
    }
  }

  const backupPath = path.join(process.cwd(), 'database_backup_checkpoint.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✅ Safety Checkpoint: Database snapshot successfully backed up to ${backupPath}`);
}

performBackup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backup error:', err);
    process.exit(1);
  });
