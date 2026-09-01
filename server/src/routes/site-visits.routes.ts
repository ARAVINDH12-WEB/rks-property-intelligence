import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { dispatchWhatsAppAlert } from '../services/whatsapp.service.js';

const router = Router();

// POST /api/site-visits - Customer Booking Endpoint (Public & Internal)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      property_id,
      customer_name,
      customer_phone,
      customer_email,
      visit_date,
      time_slot = '10:00 AM - 12:00 PM',
      pickup_required = false,
      pickup_location,
      attendees_count = 1,
      notes,
    } = req.body;

    if (!customer_name || !customer_phone || !visit_date) {
      res.status(400).json({ error: 'Customer Name, Phone Number, and Visit Date are required' });
      return;
    }

    // Lookup property code and project name if property_id provided
    let propertyCode = 'GENERAL';
    let propInfo: any = null;
    if (property_id) {
      const pRes = await query(
        `SELECT p.property_code, prj.name as project_name, loc.city
         FROM properties p
         LEFT JOIN projects prj ON p.project_id = prj.id
         LEFT JOIN locations loc ON p.location_id = loc.id
         WHERE p.id = $1`,
        [property_id]
      );
      if (pRes.rowCount > 0) {
        propertyCode = pRes.rows[0].property_code;
        propInfo = pRes.rows[0];
      }
    }

    const insertResult = await query(
      `INSERT INTO site_visits (
        property_id, property_code, customer_name, customer_phone, customer_email,
        visit_date, time_slot, pickup_required, pickup_location, attendees_count,
        status, notes
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        'REQUESTED', $11
      ) RETURNING *`,
      [
        property_id || null,
        propertyCode,
        customer_name.trim(),
        customer_phone.trim(),
        customer_email ? customer_email.trim() : null,
        visit_date,
        time_slot,
        !!pickup_required,
        pickup_location || null,
        Number(attendees_count) || 1,
        notes || null,
      ]
    );

    const booking = insertResult.rows[0];

    // Log in Audit Trail
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, details)
       VALUES ($1, $2, 'SITE_VISIT', $3, $4, 'BOOK_VISIT', $5)`,
      [
        null,
        customer_name.trim(),
        booking.id,
        propertyCode,
        `Site visit booked by ${customer_name} (${customer_phone}) for ${visit_date} at ${time_slot}. Pickup: ${pickup_required ? 'YES' : 'NO'}`
      ]
    );

    // If property linked, log in property history
    if (property_id) {
      await query(
        `INSERT INTO property_history (property_id, event_type, old_value, new_value, description)
         VALUES ($1, 'SITE_VISIT_BOOKED', null, 'REQUESTED', $2)`,
        [
          property_id,
          `Site visit booked by ${customer_name} (${customer_phone}) for ${visit_date}`
        ]
      );
    }

    // Dispatch Automated WhatsApp Notification
    let waResult: any = null;
    try {
      waResult = await dispatchWhatsAppAlert({
        type: 'SITE_VISIT_BOOKED',
        customerName: customer_name,
        customerPhone: customer_phone,
        customerEmail: customer_email,
        propertyCode: propertyCode,
        projectName: propInfo?.project_name,
        visitDate: visit_date,
        timeSlot: time_slot,
        pickupRequired: !!pickup_required,
        pickupLocation: pickup_location,
        summary: `Site visit for ${propertyCode} booked by ${customer_name}`,
      });
    } catch (err) {
      console.warn('WhatsApp alert dispatch note:', err);
    }

    res.status(201).json({
      message: 'Site visit successfully scheduled!',
      bookingReference: `SV-${String(booking.id).padStart(5, '0')}`,
      booking,
      property: propInfo,
      whatsappAlert: waResult,
    });
  } catch (error: any) {
    console.error('Error booking site visit:', error);
    res.status(500).json({ error: error.message || 'Failed to book site visit' });
  }
});

// GET /api/site-visits - List all Site Visits with filters
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, date, property_id } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (status && status !== 'ALL') {
      conditions.push(`sv.status = $${paramIdx}`);
      params.push(String(status).toUpperCase());
      paramIdx++;
    }

    if (date) {
      conditions.push(`sv.visit_date = $${paramIdx}`);
      params.push(date);
      paramIdx++;
    }

    if (property_id) {
      conditions.push(`sv.property_id = $${paramIdx}`);
      params.push(parseInt(property_id as string));
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT
        sv.*,
        p.plot_number,
        p.area_sqft,
        p.rate_per_sqft,
        p.total_price,
        prj.name as project_name,
        loc.city as city,
        loc.name as location_name
      FROM site_visits sv
      LEFT JOIN properties p ON sv.property_id = p.id
      LEFT JOIN projects prj ON p.project_id = prj.id
      LEFT JOIN locations loc ON p.location_id = loc.id
      ${whereClause}
      ORDER BY sv.visit_date ASC, sv.id DESC
    `, params);

    // KPI breakdown
    const statsResult = await query(`
      SELECT
        COUNT(*)::int as total_bookings,
        COUNT(CASE WHEN status = 'REQUESTED' THEN 1 END)::int as requested_count,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)::int as confirmed_count,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed_count,
        COUNT(CASE WHEN visit_date = CURRENT_DATE THEN 1 END)::int as today_count
      FROM site_visits
    `);

    res.json({
      site_visits: result.rows,
      stats: statsResult.rows[0] || {},
    });
  } catch (error: any) {
    console.error('Error fetching site visits:', error);
    res.status(500).json({ error: 'Failed to fetch site visits' });
  }
});

// PATCH /api/site-visits/:id/status - Update Status or Assign Agent
router.patch('/:id/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status, assigned_agent_id, assigned_agent_name, notes } = req.body;

    const existingRes = await query('SELECT * FROM site_visits WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      res.status(404).json({ error: 'Site visit not found' });
      return;
    }

    const current = existingRes.rows[0];
    const newStatus = status ? String(status).toUpperCase() : current.status;

    const updateRes = await query(
      `UPDATE site_visits SET
        status = $1,
        assigned_agent_id = COALESCE($2, assigned_agent_id),
        assigned_agent_name = COALESCE($3, assigned_agent_name),
        notes = CASE WHEN $4::text IS NOT NULL AND $4::text != '' THEN COALESCE(notes || E'\n', '') || $4 ELSE notes END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *`,
      [newStatus, assigned_agent_id || null, assigned_agent_name || null, notes || null, id]
    );

    const updated = updateRes.rows[0];

    // Log in Audit Trail
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, details)
       VALUES ($1, $2, 'SITE_VISIT', $3, $4, 'STATUS_CHANGE', $5)`,
      [
        req.user?.id || 1,
        req.user?.name || 'Staff',
        id,
        current.property_code,
        `Site visit for ${current.customer_name} status updated to ${newStatus}${assigned_agent_name ? ` (Assigned to ${assigned_agent_name})` : ''}`
      ]
    );

    res.json({
      message: `Site visit status updated to ${newStatus}`,
      booking: updated,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update site visit' });
  }
});

// DELETE /api/site-visits/:id - Delete / Cancel Visit
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await query('DELETE FROM site_visits WHERE id = $1', [id]);
    res.json({ message: 'Site visit booking removed' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete site visit' });
  }
});

export default router;
