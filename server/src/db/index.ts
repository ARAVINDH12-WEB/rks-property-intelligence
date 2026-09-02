import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { SCHEMA_SQL } from './schema.js';

dotenv.config();

let db: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

export async function getDb(): Promise<PGlite> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
      let dataDir = process.env.DATA_DIR;

      if (!dataDir) {
        dataDir = isServerless
          ? path.join('/tmp', 'rks-postgres-data')
          : path.join(process.cwd(), 'data', 'postgres');
      }

      try {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        console.log(`[Database] Initializing PGlite at directory: ${dataDir}`);
        db = new PGlite(dataDir);
      } catch (dirErr: any) {
        console.warn(`[Database] Could not write to ${dataDir} (${dirErr.message}), falling back to in-memory mode`);
        db = new PGlite();
      }

      await db.waitReady;
      await initSchema(db);
      console.log('[Database] PostgreSQL Engine Ready & Schema Verified ✅');
      return db;
    } catch (err: any) {
      console.error('[Database] Fatal Error initializing PGlite:', err?.stack || err);
      // Fallback to in-memory instance so server never crashes on startup
      db = new PGlite();
      await db.waitReady;
      await initSchema(db);
      return db;
    }
  })();

  return initPromise;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  const instance = await getDb();
  try {
    const result = await instance.query(sql, params);
    return {
      rows: (result.rows || []) as T[],
      rowCount: result.rows ? result.rows.length : 0,
    };
  } catch (err: any) {
    console.error('[Database Query Error]:', {
      sql,
      params,
      message: err?.message,
      stack: err?.stack,
    });
    throw err;
  }
}

export async function initSchema(targetDb?: PGlite): Promise<void> {
  const instance = targetDb || (await getDb());
  try {
    await instance.exec(SCHEMA_SQL);
    console.log('✅ PostgreSQL Schema initialized successfully.');
  } catch (error: any) {
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate key'))) {
      console.log('ℹ️ PostgreSQL Schema already initialized.');
    } else {
      console.warn('⚠️ Schema initialization warning:', error?.message || error);
    }
  }
}
