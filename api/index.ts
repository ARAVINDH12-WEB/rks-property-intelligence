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

      // Check if users table is populated
      const userCheck = await query('SELECT count(*)::int as count FROM users');
      const userCount = Number(userCheck.rows[0]?.count || 0);

      const propCheck = await query('SELECT count(*)::int as count FROM properties');
      const propCount = Number(propCheck.rows[0]?.count || 0);

      if (userCount === 0 || propCount === 0) {
        console.log(`[Vercel Serverless] DB needs seeding (users: ${userCount}, properties: ${propCount}). Running seed...`);
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
