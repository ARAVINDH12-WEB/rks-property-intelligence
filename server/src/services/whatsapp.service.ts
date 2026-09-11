import { query } from '../db/index.js';

export interface WhatsAppAlertPayload {
  to?: string;
  templateName?: string;
  type: 'SITE_VISIT_BOOKED' | 'HUMAN_ESCALATION_REQUIRED' | 'PRICE_NEGOTIATION' | 'CALLBACK_REQUEST' | 'NEW_LEAD';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  propertyCode?: string;
  projectName?: string;
  visitDate?: string;
  timeSlot?: string;
  pickupRequired?: boolean;
  pickupLocation?: string;
  summary: string;
  userMessage?: string;
  timestamp?: string;
}

export interface WhatsAppNotificationResult {
  success: boolean;
  messageId: string;
  recipient: string;
  dispatchedAt: string;
  channel: 'WHATSAPP_WEBHOOK' | 'WHATSAPP_CLOUD_API' | 'CONSOLE_LOG';
  formattedMessage: string;
}

const DEFAULT_SALES_WHATSAPP = process.env.SALES_WHATSAPP_NUMBER || '+91 98400 11223';
const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || '';

/**
 * Dispatches an automated WhatsApp notification to RKS Sales Team / Admin & Customer
 */
export async function dispatchWhatsAppAlert(
  payload: WhatsAppAlertPayload
): Promise<WhatsAppNotificationResult> {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const messageId = `WA-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  let recipient = payload.to;

  if (!recipient) {
    try {
      const settingRes = await query(`SELECT value FROM system_settings WHERE key = 'admin_notification_whatsapp'`);
      if (settingRes.rowCount && settingRes.rows[0]?.value) {
        recipient = settingRes.rows[0].value;
      }
    } catch {}
  }

  if (!recipient) {
    recipient = DEFAULT_SALES_WHATSAPP;
  }

  let formattedMessage = '';

  if (payload.type === 'SITE_VISIT_BOOKED') {
    formattedMessage = `🚨 *NEW RKS SITE VISIT APPOINTMENT* 🚨
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${payload.customerName}
📞 *Phone:* ${payload.customerPhone}
${payload.customerEmail ? `✉️ *Email:* ${payload.customerEmail}\n` : ''}🏡 *Property:* ${payload.propertyCode || 'General Layout Tour'} (${payload.projectName || 'RKS Property Hub'})
📅 *Date:* ${payload.visitDate}
⏰ *Time Slot:* ${payload.timeSlot}
🚗 *Cab Pickup:* ${payload.pickupRequired ? `YES — ${payload.pickupLocation || 'Address Provided'}` : 'No (Self Drive)'}
━━━━━━━━━━━━━━━━━━━━
📌 *Action:* Please confirm appointment with customer and assign tour executive.`;
  } else if (payload.type === 'NEW_LEAD') {
    formattedMessage = `📥 *NEW PROPERTY ENQUIRY / LEAD* 📥
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${payload.customerName}
📞 *Phone:* ${payload.customerPhone}
${payload.customerEmail ? `✉️ *Email:* ${payload.customerEmail}\n` : ''}🏡 *Interested Property:* ${payload.propertyCode || 'General Enquiry'}
📝 *Notes:* ${payload.userMessage || payload.summary || 'None'}
⏰ *Received:* ${timestamp}
━━━━━━━━━━━━━━━━━━━━
📌 *Action:* Sales advisor follow-up required within 24 hours.`;
  } else {
    formattedMessage = `⚠️ *AI CHAT / ENQUIRY INTERVENTION REQUIRED* ⚠️
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${payload.customerName || 'Online Visitor'}
📞 *Phone:* ${payload.customerPhone || 'Not provided'}
💬 *Trigger:* ${payload.summary}
📝 *Customer Said:* "${payload.userMessage || ''}"
${payload.propertyCode ? `🏡 *Interested in:* ${payload.propertyCode} (${payload.projectName || ''})\n` : ''}⏰ *Time:* ${timestamp}
━━━━━━━━━━━━━━━━━━━━
📌 *Action:* Immediate sales advisor follow-up required via WhatsApp / Call.`;
  }

  console.log('\n📲 [WHATSAPP NOTIFICATION DISPATCHED]');
  console.log('---------------------------------------------------');
  console.log(`To: ${recipient}`);
  console.log(`Type: ${payload.type}`);
  console.log(formattedMessage);
  console.log('---------------------------------------------------\n');

  let status = 'DISPATCHED';
  let errorMessage: string | null = null;

  if (WHATSAPP_WEBHOOK_URL) {
    try {
      const resp = await fetch(WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          message: formattedMessage,
          data: payload,
          messageId,
          timestamp,
        }),
      });
      if (!resp.ok) {
        status = 'WEBHOOK_FAILED';
        errorMessage = `HTTP ${resp.status} ${resp.statusText}`;
      }
    } catch (err: any) {
      status = 'WEBHOOK_ERROR';
      errorMessage = err?.message || 'Network error';
      console.warn('WhatsApp webhook call warning:', err);
    }
  }

  try {
    await query(
      `INSERT INTO notification_logs (type, recipient, payload, status, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        payload.type,
        recipient,
        JSON.stringify({ messageId, formattedMessage, payload }),
        status,
        errorMessage,
      ]
    );
  } catch (logErr) {
    console.warn('[WhatsApp] Failed to write notification_log:', logErr);
  }

  return {
    success: status === 'DISPATCHED',
    messageId,
    recipient,
    dispatchedAt: timestamp,
    channel: WHATSAPP_WEBHOOK_URL ? 'WHATSAPP_WEBHOOK' : 'CONSOLE_LOG',
    formattedMessage,
  };
}
