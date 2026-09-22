import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { memoryCache } from '../utils/cache.js';
import { authenticate, optionalAuthenticate, authorize } from '../middleware/auth.js';
import { deleteStorageFile } from '../utils/storage.js';

const router = Router();

// GET /api/posters — Public: Get active, non-expired posters ordered by display_order
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = 'public_posters';
    const cachedPosters = memoryCache.get<any>(cacheKey);
    if (cachedPosters) {
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
      res.setHeader('X-Cache-Status', 'HIT');
      res.json(cachedPosters);
      return;
    }

    const result = await query(
      `SELECT * FROM posters 
       WHERE is_active = true 
         AND (start_date IS NULL OR start_date <= CURRENT_DATE) 
         AND (end_date IS NULL OR end_date >= CURRENT_DATE)
       ORDER BY display_order ASC, created_at DESC`
    );
    const payload = { posters: result.rows };
    memoryCache.set(cacheKey, payload, 60);
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    res.setHeader('X-Cache-Status', 'MISS');
    res.json(payload);
  } catch (error: any) {
    console.error('Error fetching posters:', error);
    res.status(500).json({ error: 'Failed to fetch posters' });
  }
});

// GET /api/posters/admin — Admin/Manager/Public Read: Get all posters including inactive
router.get('/admin', optionalAuthenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`SELECT * FROM posters ORDER BY display_order ASC, created_at DESC`);
    res.json({ posters: result.rows });
  } catch (error: any) {
    console.error('Error fetching admin posters:', error);
    res.status(500).json({ error: 'Failed to fetch admin posters' });
  }
});

// POST /api/posters — Admin ONLY: Create new poster
router.post('/', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, image_url, link_url, alt_text, display_order = 0, is_active = true, start_date, end_date } = req.body;

    if (!image_url?.trim()) {
      res.status(400).json({ error: 'Image URL is required' });
      return;
    }

    const result = await query(
      `INSERT INTO posters (title, image_url, link_url, alt_text, display_order, is_active, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        title?.trim() || null,
        image_url.trim(),
        link_url?.trim() || null,
        alt_text?.trim() || title?.trim() || 'RKS Property Hub Banner',
        display_order,
        is_active,
        start_date || null,
        end_date || null,
      ]
    );

    memoryCache.clearAll();
    res.status(201).json({ message: 'Poster created successfully', poster: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating poster:', error);
    res.status(500).json({ error: error?.message || 'Failed to create poster' });
  }
});

// PUT /api/posters/:id — Admin ONLY: Update poster
router.put('/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, image_url, link_url, alt_text, display_order, is_active, start_date, end_date } = req.body;

    if (!image_url?.trim()) {
      res.status(400).json({ error: 'Image URL is required' });
      return;
    }

    const result = await query(
      `UPDATE posters SET
        title = $1,
        image_url = $2,
        link_url = $3,
        alt_text = $4,
        display_order = $5,
        is_active = $6,
        start_date = $7,
        end_date = $8,
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [
        title?.trim() || null,
        image_url.trim(),
        link_url?.trim() || null,
        alt_text?.trim() || title?.trim() || 'RKS Property Hub Banner',
        display_order ?? 0,
        is_active ?? true,
        start_date || null,
        end_date || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Poster not found' });
      return;
    }

    memoryCache.clearAll();
    res.json({ message: 'Poster updated successfully', poster: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating poster:', error);
    res.status(500).json({ error: error?.message || 'Failed to update poster' });
  }
});

// PATCH /api/posters/:id/toggle — Admin ONLY: Toggle active status
router.patch('/:id/toggle', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`UPDATE posters SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *`, [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Poster not found' });
      return;
    }

    memoryCache.clearAll();
    res.json({ message: 'Poster status updated', poster: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to toggle poster' });
  }
});

// DELETE /api/posters/:id — Admin ONLY: Delete poster
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await query(`SELECT image_url FROM posters WHERE id = $1`, [id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'Poster not found' });
      return;
    }

    const imageUrl = existing.rows[0].image_url;
    await query(`DELETE FROM posters WHERE id = $1`, [id]);
    if (imageUrl) {
      await deleteStorageFile(imageUrl).catch(() => {});
    }

    memoryCache.clearAll();
    res.json({ message: 'Poster deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting poster:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete poster' });
  }
});

export default router;
