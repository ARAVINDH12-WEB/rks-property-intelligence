import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Standard defaults for Phase 1 configuration
export const DEFAULT_SETTINGS: Record<string, string> = {
  // General & Contact
  whatsapp_number: '+919840011223',
  contact_phone: '+91 98400 11223',
  contact_email: 'info@rksgroup.in',
  contact_address: 'No. 42, GST Road, Guindy, Chennai, Tamil Nadu - 600032',
  social_facebook: 'https://facebook.com/rksgroup',
  social_instagram: 'https://instagram.com/rksgroup',
  social_linkedin: 'https://linkedin.com/company/rksgroup',

  // Stats / Numbers
  stat_total_plots: '58+',
  stat_base_rate: '₹850/sq.ft',
  stat_total_acreage: '120+ Acres',
  stat_happy_customers: '2,400+',

  // Feature Toggles (true/false)
  toggle_whatsapp_button: 'true',
  toggle_offers_section: 'true',
  toggle_site_visit_booking: 'true',
  toggle_ai_concierge: 'true',
};

// GET /api/settings - Public / Customer accessible (all global settings with defaults)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT key, value FROM system_settings');
    const settingsMap = { ...DEFAULT_SETTINGS };

    for (const row of result.rows) {
      settingsMap[row.key] = row.value;
    }

    res.json({
      settings: settingsMap,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Settings Error]:', error);
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

// GET /api/settings/whatsapp - Public backward compatibility
router.get('/whatsapp', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query("SELECT value FROM system_settings WHERE key = 'whatsapp_number'");
    const whatsappNumber = result.rows[0]?.value || DEFAULT_SETTINGS.whatsapp_number;
    res.json({
      whatsapp_number: whatsappNumber,
      default_message: "Hi, I'm interested in learning more about your properties.",
    });
  } catch (error: any) {
    console.error('[Settings WhatsApp Error]:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp configuration' });
  }
});

// PUT /api/settings - Admin ONLY (Batch Update)
router.put('/', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Settings object payload is required' });
      return;
    }

    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'Administrator';

    const updatedKeys: string[] = [];

    for (const [key, rawValue] of Object.entries(settings)) {
      if (typeof key !== 'string' || !key.trim()) continue;

      const valueStr = String(rawValue ?? '').trim();

      // Upsert into system_settings
      await query(
        `INSERT INTO system_settings (key, value, updated_by, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET
           value = $2,
           updated_by = $3,
           updated_at = CURRENT_TIMESTAMP`,
        [key.trim(), valueStr, userId]
      );
      updatedKeys.push(key.trim());
    }

    // Record audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'SYSTEM_SETTINGS', null, 'BATCH_UPDATE_SETTINGS', $3)`,
      [userId, userName, `Updated ${updatedKeys.length} site settings: ${updatedKeys.join(', ')}`]
    );

    res.json({
      message: 'Site settings updated successfully!',
      updatedKeys,
    });
  } catch (error: any) {
    console.error('[Batch Settings Update Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to update settings' });
  }
});

// PUT /api/settings/:key - Admin ONLY (Single Key Update)
router.put('/:key', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      res.status(400).json({ error: 'Setting value is required' });
      return;
    }

    const trimmedValue = String(value).trim();
    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'Administrator';

    // Validate phone number if updating whatsapp or contact phone
    if (key === 'whatsapp_number' || key === 'contact_whatsapp') {
      const cleanNum = trimmedValue.replace(/\s+/g, '');
      const phoneRegex = /^\+[1-9]\d{9,14}$/;
      if (!phoneRegex.test(cleanNum)) {
        res.status(400).json({
          error: 'Invalid phone format. Please provide full international format with country code (e.g., +919840011223).',
        });
        return;
      }
    }

    await query(
      `INSERT INTO system_settings (key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET
         value = $2,
         updated_by = $3,
         updated_at = CURRENT_TIMESTAMP`,
      [key, trimmedValue, userId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'SYSTEM_SETTINGS', null, 'UPDATE_SETTINGS', $3)`,
      [userId, userName, `Updated setting '${key}' to '${trimmedValue}'`]
    );

    res.json({
      message: `Setting '${key}' updated successfully!`,
      key,
      value: trimmedValue,
    });
  } catch (error: any) {
    console.error('[Single Setting Update Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to update setting' });
  }
});

export default router;
