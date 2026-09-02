import { Request, Response } from 'express';
import { getDb, query } from '../server/src/db/index.js';
import { seedDatabase } from '../server/src/db/seed.js';
import app from '../server/src/index.js';

let dbReady = false;
let initPromise: Promise<void> | null = null;

async function ensureDb(): Promise<void> {
  if (dbReady) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('[Vercel Serverless] Initializing DB...');
      await getDb();

      // Check if DB was already initialized via system_meta flag
      const metaCheck = await query("SELECT value FROM system_meta WHERE key = 'seed_completed'");
      const isSeeded = metaCheck.rowCount > 0 && metaCheck.rows[0]?.value === 'true';

      if (!isSeeded && process.env.NODE_ENV === 'development') {
        console.log('[Vercel Serverless] Initial seed requested for dev...');
        await seedDatabase();
        console.log('[Vercel Serverless] Seeding completed ✅');
      }

      dbReady = true;
      console.log('[Vercel Serverless] DB ready and verified ✅');
    } catch (err: any) {
      console.error('[Vercel Serverless] DB init error:', err?.stack || err);
      dbReady = true;
    }
  })();

  return initPromise;
}

export default async function handler(req: Request, res: Response) {
  await ensureDb();
  (app as any)(req, res);
}
