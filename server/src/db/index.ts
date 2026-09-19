import pg from 'pg';
import dotenv from 'dotenv';
import { SCHEMA_SQL } from './schema.js';

dotenv.config();

const { Pool } = pg;

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

export async function getDb(): Promise<{ type: 'pool'; client: pg.Pool }> {
  if (initPromise) {
    await initPromise;
    return { type: 'pool', client: pgPool! };
  }

  initPromise = (async () => {
    const connectionString = getConnectionString();
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.RAILWAY_ENVIRONMENT;

    console.log('[Database] Connecting to PostgreSQL Pool via connection string...');
    const useSsl = connectionString.includes('sslmode=') || connectionString.includes('neon.tech') || (isProduction && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));
    
    pgPool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection with 5-second timeout
    const connectPromise = pgPool.connect();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PostgreSQL connection attempt timed out (5000ms)')), 5000)
    );
    const client = await Promise.race([connectPromise, timeoutPromise]);
    try {
      await client.query('SELECT 1');
      console.log('[Database Safety] Connected to PostgreSQL Host (Mode: Production Pool) ✅');
    } finally {
      client.release();
    }

    await initSchema();
  })().catch((err) => {
    initPromise = null;
    console.error('⚠️ [Database Error]:', err?.message || err);
    throw err;
  });

  await initPromise;
  return { type: 'pool', client: pgPool! };
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
             ON CONFLICT (slug) DO NOTHING`,
            [page.title, page.slug, page.meta_title, page.meta_description]
          );
        }
        console.log('[Schema] CMS pages seeded successfully.');
      }
    } catch {
      // Ignore fallback if table not yet created
    }
  } catch (err: any) {
    console.error('❌ Remote PostgreSQL Schema initialization error:', err.message);
  }
}
