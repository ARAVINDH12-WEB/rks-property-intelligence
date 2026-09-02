import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireRole, AuthUser } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rks_property_intelligence_super_secret_jwt_key_2026';

// Optional auth helper to check if incoming request is from staff or customer
function extractUser(req: Request): AuthUser | null {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

// GET /api/offers - List Offers (Server-Side Role Filtered)
// Customers see ONLY active, non-expired offers.
// Managers & Admins see ALL offers (active, inactive, expired).
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = extractUser(req);
    const isStaff = user && (user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'EMPLOYEE');

    let sql = `
      SELECT
        o.*,
        u.name as created_by_name,
        CASE
          WHEN o.is_active = false THEN 'INACTIVE'
          WHEN CURRENT_DATE > o.end_date THEN 'EXPIRED'
          WHEN CURRENT_DATE < o.start_date THEN 'SCHEDULED'
          ELSE 'ACTIVE'
        END as calculated_status
      FROM offers o
      LEFT JOIN users u ON o.created_by = u.id
    `;

    if (!isStaff) {
      // Customer / Public View: STRICTLY ACTIVE & VALID DATE RANGE
      sql += ` WHERE o.is_active = true AND CURRENT_DATE >= o.start_date AND CURRENT_DATE <= o.end_date`;
    }

    sql += ` ORDER BY o.is_active DESC, o.end_date DESC, o.id DESC`;

    const result = await query(sql);

    res.json({
      offers: result.rows,
      viewRole: isStaff ? user?.role : 'CUSTOMER',
      count: result.rowCount,
    });
  } catch (error: any) {
    console.error('[Offers Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch offers' });
  }
});

// GET /api/offers/:id - Single offer details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const user = extractUser(req);
    const isStaff = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

    const result = await query(
      `SELECT
        o.*,
        u.name as created_by_name,
        CASE
          WHEN o.is_active = false THEN 'INACTIVE'
          WHEN CURRENT_DATE > o.end_date THEN 'EXPIRED'
          WHEN CURRENT_DATE < o.start_date THEN 'SCHEDULED'
          ELSE 'ACTIVE'
        END as calculated_status
       FROM offers o
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    const offer = result.rows[0];

    // Restrict customer from viewing inactive/expired offer directly by ID
    if (!isStaff && (offer.calculated_status !== 'ACTIVE' || !offer.is_active)) {
      res.status(404).json({ error: 'This promotional offer is no longer available' });
      return;
    }

    res.json({ offer });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch offer' });
  }
});

// POST /api/offers - Create New Offer (Admin ONLY)
router.post('/', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      discount_type = 'PERCENTAGE',
      discount_value,
      start_date,
      end_date,
      is_active = true,
      applicable_properties = 'ALL',
      banner_image_url,
      terms_conditions,
    } = req.body;

    if (!title || !description || !discount_value || !start_date || !end_date) {
      res.status(400).json({
        error: 'Title, description, discount value, start date, and end date are required.',
      });
      return;
    }

    if (new Date(end_date) < new Date(start_date)) {
      res.status(400).json({ error: 'End date cannot be earlier than start date.' });
      return;
    }

    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'Administrator';

    const insertRes = await query(
      `INSERT INTO offers (
        title, description, discount_type, discount_value, start_date, end_date,
        is_active, applicable_properties, banner_image_url, terms_conditions,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11) RETURNING *`,
      [
        title.trim(),
        description.trim(),
        discount_type,
        discount_value.trim(),
        start_date,
        end_date,
        !!is_active,
        applicable_properties ? applicable_properties.trim() : 'ALL',
        banner_image_url ? banner_image_url.trim() : null,
        terms_conditions ? terms_conditions.trim() : null,
        userId,
      ]
    );

    const createdOffer = insertRes.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'OFFER', $3, 'CREATE_OFFER', $4)`,
      [userId, userName, createdOffer.id, `Created promotional offer '${createdOffer.title}' (${createdOffer.discount_value})`]
    );

    res.status(201).json({
      message: 'Promotional offer created successfully!',
      offer: createdOffer,
    });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: error?.message || 'Failed to create offer' });
  }
});

// PUT /api/offers/:id - Update Offer (Admin ONLY)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const {
      title,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      is_active,
      applicable_properties,
      banner_image_url,
      terms_conditions,
    } = req.body;

    const existing = await query('SELECT * FROM offers WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    const current = existing.rows[0];
    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'Administrator';

    const updateRes = await query(
      `UPDATE offers SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        discount_type = COALESCE($3, discount_type),
        discount_value = COALESCE($4, discount_value),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        is_active = COALESCE($7, is_active),
        applicable_properties = COALESCE($8, applicable_properties),
        banner_image_url = COALESCE($9, banner_image_url),
        terms_conditions = COALESCE($10, terms_conditions),
        updated_by = $11,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [
        title ? title.trim() : null,
        description ? description.trim() : null,
        discount_type || null,
        discount_value ? discount_value.trim() : null,
        start_date || null,
        end_date || null,
        is_active !== undefined ? is_active : null,
        applicable_properties ? applicable_properties.trim() : null,
        banner_image_url !== undefined ? banner_image_url : null,
        terms_conditions !== undefined ? terms_conditions : null,
        userId,
        id,
      ]
    );

    const updated = updateRes.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'OFFER', $3, 'UPDATE_OFFER', $4)`,
      [userId, userName, id, `Updated promotional offer '${updated.title}'`]
    );

    res.json({
      message: 'Offer updated successfully!',
      offer: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to update offer' });
  }
});

// DELETE /api/offers/:id - Delete Offer (Admin ONLY)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query('SELECT * FROM offers WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    const current = existing.rows[0];
    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'Administrator';

    await query('DELETE FROM offers WHERE id = $1', [id]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'OFFER', $3, 'DELETE_OFFER', $4)`,
      [userId, userName, id, `Deleted promotional offer '${current.title}'`]
    );

    res.json({ message: 'Offer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to delete offer' });
  }
});

export default router;
