import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/settings/whatsapp - Public/Customer accessible
router.get('/whatsapp', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query("SELECT value FROM system_settings WHERE key = 'whatsapp_number'");
    const whatsappNumber = result.rows[0]?.value || '+919840011223';
    res.json({
      whatsapp_number: whatsappNumber,
      default_message: "Hi, I'm interested in learning more about your properties.",
    });
  } catch (error: any) {
    console.error('[Settings Error]:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp configuration' });
  }
});

// PUT /api/settings/whatsapp - Admin ONLY
router.put('/whatsapp', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { whatsapp_number } = req.body;

    if (!whatsapp_number || !String(whatsapp_number).trim()) {
      res.status(400).json({ error: 'WhatsApp number is required' });
      return;
    }

    const trimmedNumber = String(whatsapp_number).trim().replace(/\s+/g, '');

    // Validate international phone number format: starts with +, followed by 10 to 15 digits
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    if (!phoneRegex.test(trimmedNumber)) {
      res.status(400).json({
        error: 'Invalid phone format. Please provide full international format with country code (e.g., +919840011223).',
      });
      return;
    }

    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'Administrator';

    // Upsert into system_settings
    await query(
      `INSERT INTO system_settings (key, value, description, updated_by, updated_at)
       VALUES ('whatsapp_number', $1, 'Customer Connect Official WhatsApp Number', $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET
         value = $1,
         updated_by = $2,
         updated_at = CURRENT_TIMESTAMP`,
      [trimmedNumber, userId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'SYSTEM_SETTINGS', null, 'UPDATE_SETTINGS', $3)`,
      [userId, userName, `Updated official WhatsApp connect number to ${trimmedNumber}`]
    );

    res.json({
      message: 'WhatsApp number updated successfully!',
      whatsapp_number: trimmedNumber,
    });
  } catch (error: any) {
    console.error('[Update Settings Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to update WhatsApp settings' });
  }
});

export default router;
