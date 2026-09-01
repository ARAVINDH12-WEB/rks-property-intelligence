import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/locations - Micro-markets list with property stats
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const locationsResult = await query(`
      SELECT
        loc.*,
        COUNT(p.id)::int as total_properties,
        COUNT(CASE WHEN p.status = 'AVAILABLE' THEN 1 END)::int as available_properties,
        COUNT(CASE WHEN p.status = 'RESERVED' THEN 1 END)::int as reserved_properties,
        COUNT(CASE WHEN p.status = 'SOLD' THEN 1 END)::int as sold_properties,
        COALESCE(SUM(p.total_price), 0)::numeric as total_inventory_value,
        COALESCE(AVG(p.rate_per_sqft), 0)::numeric as average_rate
      FROM locations loc
      LEFT JOIN properties p ON loc.id = p.location_id AND p.archived = false
      GROUP BY loc.id
      ORDER BY loc.city ASC, loc.name ASC
    `);

    res.json({ locations: locationsResult.rows });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// POST /api/locations - Create location
router.post('/', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, city, district, state, pincode, latitude, longitude } = req.body;

    if (!name || !city || !state) {
      res.status(400).json({ error: 'Location Name, City, and State are required' });
      return;
    }

    const insertResult = await query(
      `INSERT INTO locations (name, city, district, state, pincode, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, city, district || null, state, pincode || null, latitude || null, longitude || null]
    );

    res.status(201).json({ message: 'Location created successfully', location: insertResult.rows[0] });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create location' });
  }
});

export default router;
