import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/projects - List projects with live KPI metrics
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const projectsResult = await query(`
      SELECT
        prj.*,
        loc.name as location_name,
        loc.city as city,
        loc.state as state,
        COUNT(p.id)::int as total_properties,
        COUNT(CASE WHEN p.status = 'AVAILABLE' THEN 1 END)::int as available_properties,
        COUNT(CASE WHEN p.status = 'RESERVED' THEN 1 END)::int as reserved_properties,
        COUNT(CASE WHEN p.status = 'SOLD' THEN 1 END)::int as sold_properties,
        COUNT(CASE WHEN p.status = 'UPCOMING' THEN 1 END)::int as upcoming_properties,
        COALESCE(SUM(p.total_price), 0)::numeric as total_inventory_value,
        COALESCE(AVG(p.rate_per_sqft), 0)::numeric as average_rate
      FROM projects prj
      LEFT JOIN locations loc ON prj.location_id = loc.id
      LEFT JOIN properties p ON prj.id = p.project_id AND p.archived = false
      GROUP BY prj.id, loc.id
      ORDER BY prj.name ASC
    `);

    res.json({ projects: projectsResult.rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Single project with linked properties
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const prjResult = await query(
      `SELECT prj.*, loc.name as location_name, loc.city, loc.state
       FROM projects prj
       LEFT JOIN locations loc ON prj.location_id = loc.id
       WHERE prj.id = $1`,
      [id]
    );

    if (prjResult.rowCount === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const propertiesResult = await query(
      `SELECT p.*,
        (SELECT url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_primary = true LIMIT 1) as primary_image_url
       FROM properties p
       WHERE p.project_id = $1 AND p.archived = false
       ORDER BY p.property_code ASC`,
      [id]
    );

    res.json({
      project: prjResult.rows[0],
      properties: propertiesResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// POST /api/projects - Create project
router.post('/', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, description, location_id, status = 'ACTIVE', image_url, total_area_acres, developer = 'RKS Group' } = req.body;

    if (!name || !code) {
      res.status(400).json({ error: 'Project Name and Code are required' });
      return;
    }

    const insertResult = await query(
      `INSERT INTO projects (name, code, description, location_id, status, image_url, total_area_acres, developer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, code.trim().toUpperCase(), description, location_id || null, status, image_url || null, total_area_acres || 0, developer]
    );

    res.status(201).json({ message: 'Project created successfully', project: insertResult.rows[0] });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create project' });
  }
});

export default router;
