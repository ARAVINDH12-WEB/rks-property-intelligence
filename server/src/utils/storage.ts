import fs from 'fs';
import path from 'path';

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET || 'rks-property-images').trim();
  return { url, key, bucket };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export async function uploadToSupabaseStorage(
  buffer: Buffer,
  filename: string,
  mimetype: string,
  targetBucket?: string
): Promise<{ publicUrl: string; bucket: string; path: string } | null> {
  const { url, key, bucket: defaultBucket } = getSupabaseConfig();
  if (!url || !key) return null;

  const bucket = targetBucket || defaultBucket;
  const cleanFilename = filename.replace(/^\/+/, '');
  const uploadEndpoint = `${url}/storage/v1/object/${bucket}/${cleanFilename}`;

  try {
    console.log(`[Storage Utility] Uploading ${buffer.length} bytes to Supabase Storage: ${bucket}/${cleanFilename}`);

    let res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': mimetype,
        'x-upsert': 'true',
      },
      body: buffer,
    });

    // If bucket does not exist (404/400), attempt to create public bucket dynamically
    if (!res.ok && (res.status === 404 || res.status === 400)) {
      console.log(`[Storage Utility] Bucket '${bucket}' may not exist. Attempting auto-creation...`);
      await fetch(`${url}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bucket,
          name: bucket,
          public: true,
        }),
      }).catch(() => {});

      // Retry upload
      res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
          'Content-Type': mimetype,
          'x-upsert': 'true',
        },
        body: buffer,
      });
    }

    if (res.ok) {
      const publicUrl = `${url}/storage/v1/object/public/${bucket}/${cleanFilename}`;
      console.log(`[Storage Utility] Supabase upload success: ${publicUrl}`);
      return { publicUrl, bucket, path: cleanFilename };
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`[Storage Utility] Supabase upload failed with HTTP ${res.status}: ${errText}`);
    }
  } catch (err: any) {
    console.error('[Storage Utility] Supabase upload exception:', err?.message || err);
  }

  return null;
}

/**
 * Deletes a storage file given its public URL or relative path (/uploads/...).
 * Handles both local disk uploads and Supabase Storage files.
 */
export async function deleteStorageFile(url: string | null | undefined): Promise<boolean> {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const cleanUrl = url.trim();
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();

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
      if (match) {
        const [, bucket, filePath] = match;
        const baseUrl = supabaseUrl || cleanUrl.split('/storage/v1/object/')[0];
        const deleteEndpoint = `${baseUrl.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${filePath}`;

        console.log(`[Storage Utility] Deleting Supabase storage object: ${deleteEndpoint}`);
        const res = await fetch(deleteEndpoint, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
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
