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

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_uIB07yjwYUtp@ep-blue-band-b4dmhdz8-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

export function getConnectionString(): string {
  let conn = (
    process.env.DATABASE_URL ||
    process.env.INTERNAL_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_PRIVATE_URL ||
    DEFAULT_NEON_URL
  ).trim();

  // Strip unsupported channel_binding parameter for node-postgres (pg) compatibility
  conn = conn.replace(/[?&]channel_binding=[^&]+/gi, '');
  if (conn.includes('&') && !conn.includes('?')) {
    conn = conn.replace('&', '?');
  }
  return conn;
}

export const isRemotePostgres = true;

export async function getDb(): Promise<{ type: 'pool' | 'pglite'; client: pg.Pool | PGlite }> {
  if (initPromise) {
    await initPromise;
    if (pgPool) return { type: 'pool', client: pgPool };
    if (pgliteDb) return { type: 'pglite', client: pgliteDb };
  }

  initPromise = (async () => {
    const connectionString = getConnectionString();
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.RAILWAY_ENVIRONMENT;

    let poolSuccess = false;
    if (connectionString) {
      try {
        console.log('[Database] Connecting to PostgreSQL Pool via connection string...');
        const useSsl = connectionString.includes('sslmode=') || connectionString.includes('neon.tech') || (isProduction && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));
        
        const tempPool = new Pool({
          connectionString,
          ssl: useSsl ? { rejectUnauthorized: false } : undefined,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 3000,
        });

        // Test connection with strict 3-second timeout
        const connectPromise = tempPool.connect();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection attempt timed out after 3000ms')), 3000)
        );
        const client = await Promise.race([connectPromise, timeoutPromise]);
        try {
          await client.query('SELECT 1');
          let maskedHost = 'localhost';
          try {
            const parsedUrl = new URL(connectionString);
            const hostname = parsedUrl.hostname;
            if (hostname.includes('render.com') || hostname.includes('neon.tech')) {
              const parts = hostname.split('.');
              const prefix = parts[0];
              const maskedPrefix = prefix.length > 5 ? `${prefix.slice(0, 5)}...` : prefix;
              maskedHost = `${maskedPrefix}.${parts.slice(1).join('.')}`;
            } else {
              maskedHost = hostname;
            }
          } catch {
            maskedHost = 'PostgreSQL Host';
          }
          console.log(`[Database Safety] Connected to PostgreSQL Host: ${maskedHost} (Mode: Production Pool) ✅`);
        } finally {
          client.release();
        }

        pgPool = tempPool;
        await initSchema();
        poolSuccess = true;
      } catch (poolErr: any) {
        console.warn(`⚠️ [Database Warning] Failed to connect to PostgreSQL Pool (${poolErr.message}). Falling back to embedded PGlite...`);
        pgPool = null;
      }
    }

    if (!poolSuccess) {
      console.log('[Database] No remote DATABASE_URL provided. Initializing embedded PGlite engine...');
      const isCloud = isProduction || !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION || process.env.RENDER);
      let dataDir = process.env.DATA_DIR;

      if (!dataDir || dataDir === './data/postgres') {
        dataDir = isCloud
          ? path.join('/tmp', 'rks-postgres-data')
          : path.join(projectRootDir, 'data', 'postgres');
      } else if (!path.isAbsolute(dataDir)) {
        dataDir = path.resolve(projectRootDir, dataDir);
      }

      let initialized = false;
      try {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        } else {
          // Clean stale lockfiles from previous terminated instances
          try {
            const pidFile = path.join(dataDir, 'postmaster.pid');
            if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
            const lockFile = path.join(dataDir, '.s.PGSQL.5432.lock.out');
            if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
          } catch (e: any) {
            console.warn('[Database] Note cleaning lockfiles:', e.message);
          }
        }
        console.log(`[Database] Initializing PGlite at directory: ${dataDir}`);
        try {
          const diskDb = new PGlite(dataDir);
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Directory init timeout')), 3000));
          await Promise.race([diskDb.waitReady, timeout]);
          pgliteDb = diskDb;
          initialized = true;
        } catch (initErr: any) {
          console.warn(`[Database] PGlite directory initialization notice (${initErr.message}). Switching to fast in-memory mode...`);
        }
      } catch (dirErr: any) {
        console.warn(`[Database] Could not write to ${dataDir} (${dirErr.message}), falling back to in-memory mode`);
      }

      if (!initialized) {
        pgliteDb = new PGlite();
        await pgliteDb.waitReady;
      }

      await initSchema();
      console.log('[Database] Embedded PGlite PostgreSQL Engine Ready & Schema Verified ✅');
    }
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

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

    // Ensure CMS pages table exists and is populated
    try {
      const pageCheck = await query(`SELECT count(*)::int as count FROM pages`);
      if ((pageCheck.rows[0]?.count || 0) === 0) {
        console.log('[Schema] Seeding initial CMS pages...');
        const cmsPages = [
          { title: 'Home | RKS Property Hub', slug: '/', meta_title: 'DTCP & RERA Approved Residential Plots in Tamil Nadu | RKS Property Hub', meta_description: 'Explore DTCP & RERA approved residential & commercial plots across Chennai, Trichy, Coimbatore & Hosur with clear Patta titles and free cab site visits.' },
          { title: 'Property Listings | RKS Property Hub', slug: '/properties', meta_title: 'Verified Land & Residential Plot Inventory | RKS Property Hub', meta_description: 'Browse transparent DTCP approved plots, villas, commercial & agricultural land listings with live pricing and interactive search.' },
          { title: 'Plots in Chennai | RKS Property Hub', slug: '/plots/chennai', meta_title: 'DTCP Approved Plots in Chennai & Perungalathur | RKS Property Hub', meta_description: 'Discover prime residential plots and commercial land for sale in Chennai and Perungalathur growth corridors with 100% clear titles.' },
          { title: 'Plots in Trichy | RKS Property Hub', slug: '/plots/trichy', meta_title: 'Plots for Sale in Trichy & Thiruverumbur | RKS Property Hub', meta_description: 'Buy premium plots in Trichy near ring roads and riverfront locations. Clear Patta titles and immediate construction readiness.' },
          { title: 'Plots in Coimbatore | RKS Property Hub', slug: '/plots/coimbatore', meta_title: 'Residential Plots in Coimbatore & Kalapatti | RKS Property Hub', meta_description: 'Invest in elevated plots near Kalapatti IT Corridor in Coimbatore. Gated community amenities and panoramic hill views.' },
          { title: 'Plots in Hosur | RKS Property Hub', slug: '/plots/hosur', meta_title: 'Plots in Hosur Electronic City Corridor | RKS Property Hub', meta_description: 'Strategic plotted land investment along Hosur Road industrial and tech hub. High appreciation potential.' },
          { title: 'Plots in Bangalore Corridor | RKS Property Hub', slug: '/plots/bangalore-corridor', meta_title: 'Plots along Chennai-Bangalore Industrial Highway | RKS Property Hub', meta_description: 'High-yield plotted developments along NH-48 Chennai-Bangalore industrial corridor.' },
          { title: 'About Us | RKS Property Hub', slug: '/about', meta_title: 'About RKS Property Hub | Trusted Real Estate Developers', meta_description: 'Over 15 years of excellence delivering DTCP & RERA verified plots and land across Tamil Nadu with 100% legal transparency.' },
          { title: 'Contact Us | RKS Property Hub', slug: '/contact', meta_title: 'Contact RKS Property Hub | Site Visit & Enquiry Desk', meta_description: 'Get in touch with RKS Property Hub advisors or book a free cab pickup for your property site inspection.' },
          { title: 'Legal & Compliance | RKS Property Hub', slug: '/legal', meta_title: 'Legal Terms & Title Verification | RKS Property Hub', meta_description: 'Our commitment to clear titles, DTCP & RERA layout approvals, Patta documentation, and transparent buyer protections.' }
        ];

        for (const page of cmsPages) {
          await query(
            `INSERT INTO pages (title, slug, meta_title, meta_description, is_published) 
             VALUES ($1, $2, $3, $4, true) 
             ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description`,
            [page.title, page.slug, page.meta_title, page.meta_description]
          );
        }
      }
    } catch (e: any) {
      console.warn('[Schema Notice] CMS pages auto-seed warning:', e?.message || e);
    }
  } catch (error: any) {
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate key'))) {
      console.log('ℹ️ PostgreSQL Schema already initialized.');
    } else {
      console.warn('⚠️ Schema initialization warning:', error?.message || error);
    }
  }
}
