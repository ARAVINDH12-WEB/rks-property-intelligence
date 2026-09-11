import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public: Create a lead from any public enquiry form
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, source = 'WEBSITE', notes, property_id, property_code, status = 'NEW' } = req.body;
    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }
    const validStatuses = ['NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    const leadStatus = validStatuses.includes(status) ? status : 'NEW';

    const result = await query(
      `INSERT INTO leads (name, phone, email, source, notes, property_id, property_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at`,
      [name.trim(), cleanPhone, email?.trim() || null, source, notes?.trim() || null, property_id || null, property_code || null, leadStatus]
    );
    res.status(201).json({ 
      success: true, 
      leadId: result.rows[0].id, 
      message: 'Enquiry received! Our team will contact you within 24 hours.'
    });
  } catch (err: any) {
    console.error('[Leads] Create error:', err.message);
    res.status(500).json({ error: 'Failed to save enquiry. Please try WhatsApp instead.' });
  }
});

// Protected: List all leads with optional status filter (Staff Only)
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response) => {
  try {
    const { status, limit = '50', offset = '0', q } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (status) { conditions.push(`l.status = $${i++}`); params.push(status); }
    if (q) { conditions.push(`(l.name ILIKE $${i} OR l.phone ILIKE $${i} OR l.email ILIKE $${i})`); params.push(`%${q}%`); i++; }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const dataResult = await query(
      `SELECT l.*, p.total_price, p.area_sqft, p.property_type,
              loc.city as property_city
       FROM leads l
       LEFT JOIN properties p ON l.property_id = p.id
       LEFT JOIN locations loc ON p.location_id = loc.id
       ${where} ORDER BY l.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const countResult = await query(`SELECT COUNT(*) FROM leads l ${where}`, params);
    const statsResult = await query(
      `SELECT status, COUNT(*) as count FROM leads GROUP BY status`
    );
    const stats: Record<string, number> = {};
    statsResult.rows.forEach((r: any) => { stats[r.status] = parseInt(r.count); });
    res.json({ leads: dataResult.rows, total: parseInt(countResult.rows[0].count), stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: Batch Import Leads (CSV / Excel) (Staff Only)
router.post('/batch', authenticate, authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response) => {
  try {
    const { leads, duplicateMode = 'skip' } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'No leads provided for import' });
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ row: number; name?: string; phone?: string; error: string }> = [];

    const validStatuses = ['NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

    for (let index = 0; index < leads.length; index++) {
      const rowNum = index + 1;
      const item = leads[index];
      const name = item.name?.toString()?.trim();
      const rawPhone = item.phone?.toString()?.trim() || '';
      const email = item.email?.toString()?.trim() || null;
      const source = item.source?.toString()?.trim() || 'BULK_IMPORT';
      const statusRaw = item.status?.toString()?.trim()?.toUpperCase() || 'NEW';
      const status = validStatuses.includes(statusRaw) ? statusRaw : 'NEW';
      const property_code = item.property_code?.toString()?.trim() || item.plot_code?.toString()?.trim() || null;
      const notes = item.notes?.toString()?.trim() || null;

      if (!name) {
        errors.push({ row: rowNum, name, phone: rawPhone, error: 'Name is required' });
        failed++;
        continue;
      }

      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        errors.push({ row: rowNum, name, phone: rawPhone, error: 'Valid 10-digit mobile number required' });
        failed++;
        continue;
      }

      // Duplicate check by phone
      const existing = await query(`SELECT id, name, status FROM leads WHERE phone = $1 LIMIT 1`, [cleanPhone]);

      if (existing.rowCount && existing.rowCount > 0) {
        if (duplicateMode === 'skip') {
          skipped++;
          continue;
        } else if (duplicateMode === 'merge') {
          await query(
            `UPDATE leads 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 property_code = COALESCE($3, property_code),
                 notes = CASE WHEN $4 IS NOT NULL THEN COALESCE(notes, '') || ' | ' || $4 ELSE notes END,
                 updated_at = NOW()
             WHERE id = $5`,
            [name, email, property_code, notes, existing.rows[0].id]
          );
          imported++;
          continue;
        }
        // If duplicateMode === 'import', proceed with insert
      }

      try {
        await query(
          `INSERT INTO leads (name, phone, email, source, status, property_code, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [name, cleanPhone, email, source, status, property_code, notes]
        );
        imported++;
      } catch (insertErr: any) {
        errors.push({ row: rowNum, name, phone: rawPhone, error: insertErr.message || 'Database error' });
        failed++;
      }
    }

    // Record audit log
    try {
      const user = (req as any).user;
      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
         VALUES ($1, 'LEADS_BULK_IMPORTED', 'LEAD', NULL, $2, $3)`,
        [
          user?.id || null,
          JSON.stringify({ imported, skipped, failed, total: leads.length, duplicateMode }),
          req.ip || '127.0.0.1'
        ]
      );
    } catch {
      // Non-critical audit log failure
    }

    res.json({
      success: true,
      imported,
      skipped,
      failed,
      total: leads.length,
      errors
    });
  } catch (err: any) {
    console.error('[Leads] Batch import error:', err.message);
    res.status(500).json({ error: err.message || 'Batch import failed' });
  }
});

// Protected: Update lead status (Staff Only)
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const valid = ['NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status value' });
    await query(
      `UPDATE leads SET status = $1, notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3`,
      [status, notes || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: Delete a lead (Admin & Manager Only)
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
  try {
    await query(`DELETE FROM leads WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

