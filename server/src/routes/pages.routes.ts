import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';

const router = Router();

// GET /api/pages - List all published CMS pages
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, title, slug, meta_title, meta_description, is_published, updated_at 
       FROM pages 
       WHERE is_published = true 
       ORDER BY title ASC`
    );
    res.json({ success: true, pages: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch CMS pages' });
  }
});

// GET /api/pages/:slug - Get page by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slugParam = req.params.slug.replace(/^\/+/, '');
    const result = await query(
      `SELECT id, title, slug, content, meta_title, meta_description, is_published, updated_at 
       FROM pages 
       WHERE slug = $1 OR slug = $2 LIMIT 1`,
      [slugParam, `/${slugParam}`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ success: true, page: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch page metadata' });
  }
});

export default router;
