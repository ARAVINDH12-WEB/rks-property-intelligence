import multer from 'multer';

// Use memory storage — works on Vercel serverless (no persistent disk)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB limit
  },
});

