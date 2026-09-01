import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/audit-logs - System-wide audit log trail
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
    const offset = (page - 1) * limit;

    const { action, property_code, user_id } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (action && action !== 'ALL') {
      conditions.push(`action = $${paramIdx}`);
      params.push(action);
      paramIdx++;
    }

    if (property_code) {
      conditions.push(`property_code ILIKE $${paramIdx}`);
      params.push(`%${property_code}%`);
      paramIdx++;
    }

    if (user_id) {
      conditions.push(`user_id = $${paramIdx}`);
      params.push(parseInt(user_id as string));
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*)::int as total FROM audit_logs ${whereClause}`, params);
    const total = countResult.rows[0]?.total || 0;

    const dataResult = await query(
      `SELECT * FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      audit_logs: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
