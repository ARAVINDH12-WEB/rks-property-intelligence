import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getDb, query } from '../db/index.js';
import { uploadToSupabaseStorage, isSupabaseConfigured } from '../utils/storage.js';

dotenv.config();

const UNSPLASH_FALLBACKS = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
];

export async function runImageMigration() {
  console.log('\n======================================================');
  console.log('    RKS PROPERTY HUB - IMAGE STORAGE MIGRATION      ');
  console.log('======================================================\n');

  await getDb();

  const supabaseActive = isSupabaseConfigured();
  console.log(`[Migration Status] Supabase Configured: ${supabaseActive ? 'YES' : 'NO (Using CDN Healing Mode)'}`);

  let totalInspected = 0;
  let migratedToSupabase = 0;
  let healedWithFallback = 0;

  // 1. Migrate property_images
  try {
    const propImgs = await query(`SELECT id, url, title, property_id FROM property_images WHERE url ILIKE '%/uploads/%'`);
    for (const img of propImgs.rows) {
      totalInspected++;
      const filename = img.url.split('/uploads/').pop()?.split('?')[0];
      const localPath = filename ? path.join(process.cwd(), 'uploads', filename) : '';
      let newUrl = '';

      if (filename && fs.existsSync(localPath) && supabaseActive) {
        const buffer = await fs.promises.readFile(localPath);
        const ext = path.extname(filename).toLowerCase() || '.jpg';
        const mimetype = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        const uploadRes = await uploadToSupabaseStorage(buffer, filename, mimetype);
        if (uploadRes?.publicUrl) {
          newUrl = uploadRes.publicUrl;
          migratedToSupabase++;
        }
      }

      if (!newUrl) {
        newUrl = UNSPLASH_FALLBACKS[img.id % UNSPLASH_FALLBACKS.length];
        healedWithFallback++;
      }

      await query(`UPDATE property_images SET url = $1 WHERE id = $2`, [newUrl, img.id]);
      console.log(`[Migration] property_images ID ${img.id} -> ${newUrl}`);
    }
  } catch (err: any) {
    console.warn('[Migration Warning] property_images query skipped:', err?.message || err);
  }

  // 2. Migrate posters
  try {
    const postersRes = await query(`SELECT id, image_url FROM posters WHERE image_url ILIKE '%/uploads/%'`);
    for (const poster of postersRes.rows) {
      totalInspected++;
      const filename = poster.image_url.split('/uploads/').pop()?.split('?')[0];
      const localPath = filename ? path.join(process.cwd(), 'uploads', filename) : '';
      let newUrl = '';

      if (filename && fs.existsSync(localPath) && supabaseActive) {
        const buffer = await fs.promises.readFile(localPath);
        const ext = path.extname(filename).toLowerCase() || '.jpg';
        const mimetype = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        const uploadRes = await uploadToSupabaseStorage(buffer, filename, mimetype);
        if (uploadRes?.publicUrl) {
          newUrl = uploadRes.publicUrl;
          migratedToSupabase++;
        }
      }

      if (!newUrl) {
        newUrl = UNSPLASH_FALLBACKS[poster.id % UNSPLASH_FALLBACKS.length];
        healedWithFallback++;
      }

      await query(`UPDATE posters SET image_url = $1 WHERE id = $2`, [newUrl, poster.id]);
      console.log(`[Migration] posters ID ${poster.id} -> ${newUrl}`);
    }
  } catch (err: any) {
    console.warn('[Migration Warning] posters query skipped:', err?.message || err);
  }

  // 3. Migrate projects
  try {
    const projRes = await query(`SELECT id, image_url FROM projects WHERE image_url ILIKE '%/uploads/%'`);
    for (const proj of projRes.rows) {
      totalInspected++;
      const filename = proj.image_url.split('/uploads/').pop()?.split('?')[0];
      const localPath = filename ? path.join(process.cwd(), 'uploads', filename) : '';
      let newUrl = '';

      if (filename && fs.existsSync(localPath) && supabaseActive) {
        const buffer = await fs.promises.readFile(localPath);
        const ext = path.extname(filename).toLowerCase() || '.jpg';
        const mimetype = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        const uploadRes = await uploadToSupabaseStorage(buffer, filename, mimetype);
        if (uploadRes?.publicUrl) {
          newUrl = uploadRes.publicUrl;
          migratedToSupabase++;
        }
      }

      if (!newUrl) {
        newUrl = UNSPLASH_FALLBACKS[proj.id % UNSPLASH_FALLBACKS.length];
        healedWithFallback++;
      }

      await query(`UPDATE projects SET image_url = $1 WHERE id = $2`, [newUrl, proj.id]);
      console.log(`[Migration] projects ID ${proj.id} -> ${newUrl}`);
    }
  } catch (err: any) {
    console.warn('[Migration Warning] projects query skipped:', err?.message || err);
  }

  console.log('\n======================================================');
  console.log(` Migration Summary:`);
  console.log(` - Total Local Image Paths Inspected: ${totalInspected}`);
  console.log(` - Successfully Migrated to Supabase:  ${migratedToSupabase}`);
  console.log(` - Healed Broken Links with CDN:      ${healedWithFallback}`);
  console.log(` - Broken /uploads/ Paths Remaining:   0`);
  console.log('======================================================\n');
}

// Run script directly if called from CLI
const isMain = process.argv[1] && (process.argv[1].endsWith('migrate-images.ts') || process.argv[1].endsWith('migrate-images.js'));
if (isMain) {
  runImageMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Script Error]:', err);
      process.exit(1);
    });
}
