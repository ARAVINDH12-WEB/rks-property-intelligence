import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { optionalAuthenticate } from '../middleware/auth.js';
import { uploadToSupabaseStorage, isSupabaseConfigured } from '../utils/storage.js';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage for direct Supabase upload / buffer processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max file size
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (.jpg, .png, .webp, .svg) are allowed'));
    }
  },
});

// POST /api/upload — Universal Image Upload (Supabase Cloud Storage with local disk fallback)
router.post('/', optionalAuthenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided in upload request' });
      return;
    }

    const ext = path.extname(req.file.originalname) || '.jpg';
    const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${cleanName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext.toLowerCase()}`;

    // 1. Try Supabase Storage upload if credentials are provided
    if (isSupabaseConfigured()) {
      const supabaseResult = await uploadToSupabaseStorage(
        req.file.buffer,
        uniqueFilename,
        req.file.mimetype
      );

      if (supabaseResult?.publicUrl) {
        console.log(`[Upload Endpoint] Successfully saved file to Supabase Storage: ${supabaseResult.publicUrl}`);
        res.status(201).json({
          success: true,
          url: supabaseResult.publicUrl,
          publicUrl: supabaseResult.publicUrl,
          filename: uniqueFilename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          storage: 'supabase',
        });
        return;
      }
    }

    // 2. Fallback to Local Filesystem Storage (for offline local dev mode)
    const filePath = path.join(uploadsDir, uniqueFilename);
    await fs.promises.writeFile(filePath, req.file.buffer);

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const relativeUrl = `/uploads/${uniqueFilename}`;
    const absoluteUrl = `${protocol}://${host}${relativeUrl}`;

    console.log(`[Upload Endpoint] Saved file to local storage fallback: ${uniqueFilename}`);

    res.status(201).json({
      success: true,
      url: relativeUrl,
      publicUrl: absoluteUrl,
      filename: uniqueFilename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      storage: 'local',
    });
  } catch (err: any) {
    console.error('[Upload Endpoint Error]:', err);
    res.status(500).json({ error: err?.message || 'Failed to upload image' });
  }
});

export default router;
