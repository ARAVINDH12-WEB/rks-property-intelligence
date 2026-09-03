import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { SCHEMA_SQL } from './schema.js';

dotenv.config();

const { Pool } = pg;

const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
// If running from server/ or server/src or server/dist, resolve root directory
const projectRootDir = baseDir.includes('server')
  ? path.resolve(baseDir.split('server')[0])
  : baseDir;

let pgliteDb: PGlite | null = null;
let pgPool: pg.Pool | null = null;
let initPromise: Promise<void> | null = null;

export const isRemotePostgres = !!process.env.DATABASE_URL;

export async function getDb(): Promise<{ type: 'pool' | 'pglite'; client: pg.Pool | PGlite }> {
  if (initPromise) {
    await initPromise;
    if (pgPool) return { type: 'pool', client: pgPool };
    if (pgliteDb) return { type: 'pglite', client: pgliteDb };
  }

  initPromise = (async () => {
    if (process.env.DATABASE_URL) {
      console.log('[Database] Connecting to PostgreSQL via DATABASE_URL on Railway/Cloud...');
      const isProduction = process.env.NODE_ENV === 'production';
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction && !process.env.DATABASE_URL.includes('localhost')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test connection
      const client = await pgPool.connect();
      try {
        await client.query('SELECT 1');
        console.log('[Database] PostgreSQL Pool Connected Successfully ✅');
      } finally {
        client.release();
      }

      await initSchema();
    } else {
      const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
      let dataDir = process.env.DATA_DIR;

      if (!dataDir) {
        dataDir = isServerless
          ? path.join('/tmp', 'rks-postgres-data')
          : path.join(projectRootDir, 'data', 'postgres');
      }

      try {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        console.log(`[Database] Initializing embedded PGlite at directory: ${dataDir}`);
        pgliteDb = new PGlite(dataDir);
      } catch (dirErr: any) {
        console.warn(`[Database] Could not write to ${dataDir} (${dirErr.message}), falling back to in-memory mode`);
        pgliteDb = new PGlite();
      }

      await pgliteDb.waitReady;
      await initSchema();
      console.log('[Database] Local PostgreSQL Engine Ready & Schema Verified ✅');
    }
  })();

  await initPromise;
  if (pgPool) return { type: 'pool', client: pgPool };
  return { type: 'pglite', client: pgliteDb! };
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  await getDb();
  try {
    if (pgPool) {
      const result = await pgPool.query(sql, params);
      return {
        rows: (result.rows || []) as T[],
        rowCount: result.rowCount || 0,
      };
    } else if (pgliteDb) {
      const result = await pgliteDb.query(sql, params);
      return {
        rows: (result.rows || []) as T[],
        rowCount: result.rows ? result.rows.length : 0,
      };
    }
    throw new Error('Database instance not initialized');
  } catch (err: any) {
    console.error('[Database Query Error]:', {
      sql,
      params,
      message: err?.message,
    });
    throw err;
  }
}

export async function initSchema(): Promise<void> {
  try {
    if (pgPool) {
      await pgPool.query(SCHEMA_SQL);
      console.log('✅ Remote PostgreSQL Schema initialized successfully.');
    } else if (pgliteDb) {
      await pgliteDb.exec(SCHEMA_SQL);
      console.log('✅ Embedded PostgreSQL Schema initialized successfully.');
    }
  } catch (error: any) {
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate key'))) {
      console.log('ℹ️ PostgreSQL Schema already initialized.');
    } else {
      console.warn('⚠️ Schema initialization warning:', error?.message || error);
    }
  }
}
