import { Request, Response } from 'express';
import { getDb, query } from '../server/src/db/index.js';
import { seedDatabase } from '../server/src/db/seed.js';
import app from '../server/src/index.js';

let dbReady = false;

async function ensureDb(): Promise<void> {
  if (dbReady) return;
  try {
    await getDb(); // boots PGlite, runs schema.sql (CREATE TABLE IF NOT EXISTS)
    const countRes = await query('SELECT count(*)::int as count FROM properties');
    if (countRes.rows[0]?.count === 0) {
      console.log('[Vercel] DB empty — seeding RKS inventory...');
      await seedDatabase();
    }
    dbReady = true;
    console.log('[Vercel] DB ready ✅');
  } catch (err: any) {
    console.error('[Vercel] DB init error:', err.message);
    dbReady = true; // Don't retry on every request — let queries fail gracefully
  }
}

export default async function handler(req: Request, res: Response) {
  await ensureDb();
  (app as any)(req, res);
}
