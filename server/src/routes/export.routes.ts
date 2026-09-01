import { Router, Request, Response } from 'express';
import * as xlsx from 'xlsx';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/export - Export properties to Excel or CSV
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { format = 'xlsx', ids, status, project_id, location_id } = req.query;

    const conditions: string[] = ['p.archived = false'];
    const params: any[] = [];
    let paramIdx = 1;

    if (ids && typeof ids === 'string') {
      const idList = ids.split(',').map((id) => parseInt(id)).filter((id) => !isNaN(id));
      if (idList.length > 0) {
        conditions.push(`p.id = ANY($${paramIdx}::int[])`);
        params.push(idList);
        paramIdx++;
      }
    }

    if (status && status !== 'ALL') {
      conditions.push(`p.status = $${paramIdx}`);
      params.push(String(status).toUpperCase());
      paramIdx++;
    }

    if (project_id && project_id !== 'ALL') {
      conditions.push(`p.project_id = $${paramIdx}`);
      params.push(parseInt(project_id as string));
      paramIdx++;
    }

    if (location_id && location_id !== 'ALL') {
      conditions.push(`p.location_id = $${paramIdx}`);
      params.push(parseInt(location_id as string));
      paramIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(`
      SELECT
        p.property_code as "Property ID",
        prj.name as "Project",
        loc.name as "Location",
        loc.city as "City",
        p.property_type as "Property Type",
        p.category as "Category",
        p.plot_number as "Plot Number",
        p.unit_number as "Unit Number",
        p.survey_number as "Survey Number",
        p.area_sqft as "Area (Sq.Ft)",
        p.area_sqm as "Area (Sq.M)",
        p.rate_per_sqft as "Rate / Sq.Ft (INR)",
        p.total_price as "Total Price (INR)",
        p.status as "Availability Status",
        p.facing as "Facing",
        p.road_width as "Road Width",
        p.bedrooms as "Bedrooms",
        p.bathrooms as "Bathrooms",
        p.ownership as "Ownership",
        p.created_at as "Created Date",
        p.updated_at as "Last Updated Date"
      FROM properties p
      LEFT JOIN projects prj ON p.project_id = prj.id
      LEFT JOIN locations loc ON p.location_id = loc.id
      ${whereClause}
      ORDER BY p.property_code ASC
    `, params);

    const data = result.rows;

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'RKS Property Inventory');

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csvOutput = xlsx.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="RKS_Inventory_${timestamp}.csv"`);
      res.send(csvOutput);
    } else {
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="RKS_Inventory_${timestamp}.xlsx"`);
      res.send(buffer);
    }
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

export default router;
