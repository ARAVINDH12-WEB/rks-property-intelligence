import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${cleanName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext.toLowerCase()}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (.jpg, .png, .webp, .svg) are allowed'));
    }
  },
});

// POST /api/upload — Public / Auth upload handler saving to /uploads/ directory
router.post('/', optionalAuthenticate, upload.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided in upload request' });
      return;
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const relativeUrl = `/uploads/${req.file.filename}`;
    const absoluteUrl = `${protocol}://${host}${relativeUrl}`;

    console.log(`[Upload Endpoint] Successfully saved file ${req.file.filename} (${req.file.size} bytes)`);

    res.status(201).json({
      success: true,
      url: relativeUrl,
      publicUrl: absoluteUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err: any) {
    console.error('[Upload Endpoint Error]:', err);
    res.status(500).json({ error: err?.message || 'Failed to upload image' });
  }
});

export default router;
