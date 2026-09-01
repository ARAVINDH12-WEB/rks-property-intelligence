import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let db: PGlite;

export async function getDb(): Promise<PGlite> {
  if (!db) {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data', 'postgres');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new PGlite(dataDir);
    await db.waitReady;
    await initSchema();
  }
  return db;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  const instance = await getDb();
  const result = await instance.query(sql, params);
  return {
    rows: (result.rows || []) as T[],
    rowCount: result.rows ? result.rows.length : 0,
  };
}

export async function initSchema(): Promise<void> {
  try {
    let schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    }
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await db.exec(schemaSql);
      console.log('✅ PostgreSQL Schema initialized successfully.');
    }
  } catch (error: any) {
    // If table already exists or minor warning, continue
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate key'))) {
      console.log('ℹ️ PostgreSQL Schema already initialized.');
    } else {
      console.warn('⚠️ Schema check note:', error.message || error);
    }
  }
}
