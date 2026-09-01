import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/reports - Analytics & KPI Command Center Data
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. High-level KPIs
    const kpiResult = await query(`
      SELECT
        COUNT(*)::int as total_properties,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END)::int as available_count,
        COUNT(CASE WHEN status = 'RESERVED' THEN 1 END)::int as reserved_count,
        COUNT(CASE WHEN status = 'SOLD' THEN 1 END)::int as sold_count,
        COUNT(CASE WHEN status = 'BLOCKED' THEN 1 END)::int as blocked_count,
        COUNT(CASE WHEN status = 'HOLD' THEN 1 END)::int as hold_count,
        COUNT(CASE WHEN status = 'UPCOMING' THEN 1 END)::int as upcoming_count,
        COALESCE(SUM(total_price), 0)::numeric as total_inventory_value,
        COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN total_price ELSE 0 END), 0)::numeric as available_inventory_value,
        COALESCE(SUM(CASE WHEN status = 'SOLD' THEN total_price ELSE 0 END), 0)::numeric as sold_inventory_value,
        COALESCE(AVG(rate_per_sqft), 0)::numeric as avg_rate_per_sqft,
        COALESCE(SUM(area_sqft), 0)::numeric as total_area_sqft,
        COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN area_sqft ELSE 0 END), 0)::numeric as available_area_sqft,
        COALESCE(SUM(CASE WHEN status = 'SOLD' THEN area_sqft ELSE 0 END), 0)::numeric as sold_area_sqft
      FROM properties
      WHERE archived = false
    `);

    // 2. Status Breakdown
    const statusResult = await query(`
      SELECT
        status,
        COUNT(*)::int as count,
        COALESCE(SUM(total_price), 0)::numeric as total_value,
        COALESCE(SUM(area_sqft), 0)::numeric as total_area
      FROM properties
      WHERE archived = false
      GROUP BY status
      ORDER BY count DESC
    `);

    // 3. Project Breakdown
    const projectResult = await query(`
      SELECT
        prj.name as project_name,
        prj.code as project_code,
        COUNT(p.id)::int as total_units,
        COUNT(CASE WHEN p.status = 'AVAILABLE' THEN 1 END)::int as available_units,
        COUNT(CASE WHEN p.status = 'SOLD' THEN 1 END)::int as sold_units,
        COALESCE(SUM(p.total_price), 0)::numeric as inventory_value,
        COALESCE(AVG(p.rate_per_sqft), 0)::numeric as avg_rate
      FROM projects prj
      LEFT JOIN properties p ON prj.id = p.project_id AND p.archived = false
      GROUP BY prj.id
      ORDER BY inventory_value DESC
    `);

    // 4. Location Breakdown
    const locationResult = await query(`
      SELECT
        loc.city as city,
        loc.name as location_name,
        COUNT(p.id)::int as total_units,
        COUNT(CASE WHEN p.status = 'AVAILABLE' THEN 1 END)::int as available_units,
        COALESCE(SUM(p.total_price), 0)::numeric as inventory_value,
        COALESCE(AVG(p.rate_per_sqft), 0)::numeric as avg_rate
      FROM locations loc
      LEFT JOIN properties p ON loc.id = p.location_id AND p.archived = false
      GROUP BY loc.id
      ORDER BY total_units DESC
    `);

    // 5. Property Type Breakdown
    const typeResult = await query(`
      SELECT
        property_type,
        COUNT(*)::int as count,
        COALESCE(SUM(total_price), 0)::numeric as total_value,
        COALESCE(AVG(rate_per_sqft), 0)::numeric as avg_rate
      FROM properties
      WHERE archived = false
      GROUP BY property_type
      ORDER BY count DESC
    `);

    // 6. Recent Activity Timeline
    const recentHistoryResult = await query(`
      SELECT
        ph.*,
        p.property_code,
        prj.name as project_name,
        u.name as user_name
      FROM property_history ph
      JOIN properties p ON ph.property_id = p.id
      LEFT JOIN projects prj ON p.project_id = prj.id
      LEFT JOIN users u ON ph.changed_by = u.id
      ORDER BY ph.created_at DESC
      LIMIT 10
    `);

    res.json({
      kpis: kpiResult.rows[0],
      byStatus: statusResult.rows,
      byProject: projectResult.rows,
      byLocation: locationResult.rows,
      byType: typeResult.rows,
      recentActivity: recentHistoryResult.rows,
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to generate analytics report' });
  }
});

export default router;
