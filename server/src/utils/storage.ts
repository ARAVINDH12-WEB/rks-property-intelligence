import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

/**
 * Deletes a storage file given its public URL or relative path (/uploads/...).
 * Handles both local disk uploads and Supabase Storage files.
 */
export async function deleteStorageFile(url: string | null | undefined): Promise<boolean> {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const cleanUrl = url.trim();

  try {
    // 1. Local disk file cleanup (/uploads/filename.ext)
    if (cleanUrl.includes('/uploads/')) {
      const filename = cleanUrl.split('/uploads/').pop()?.split('?')[0];
      if (filename) {
        const filePath = path.join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          console.log(`[Storage Utility] Deleted local file: ${filePath}`);
          return true;
        }
      }
      return false;
    }

    // 2. Supabase Storage cleanup (https://.../storage/v1/object/public/bucket/filename)
    if (cleanUrl.includes('/storage/v1/object/')) {
      const match = cleanUrl.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
      if (match && (SUPABASE_URL || cleanUrl.startsWith('http'))) {
        const [, bucket, filePath] = match;
        const baseUrl = SUPABASE_URL || cleanUrl.split('/storage/v1/object/')[0];
        const deleteEndpoint = `${baseUrl.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${filePath}`;

        console.log(`[Storage Utility] Deleting Supabase storage object: ${deleteEndpoint}`);
        const res = await fetch(deleteEndpoint, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
          },
        });

        if (res.ok) {
          console.log(`[Storage Utility] Supabase storage deletion successful: ${bucket}/${filePath}`);
          return true;
        } else {
          console.warn(`[Storage Utility] Supabase storage delete HTTP error ${res.status}:`, await res.text().catch(() => ''));
        }
      }
    }
  } catch (err: any) {
    console.error(`[Storage Utility] Exception unlinking storage file (${cleanUrl}):`, err?.message || err);
  }

  return false;
}
