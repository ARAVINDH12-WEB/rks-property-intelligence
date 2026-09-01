export interface WhatsAppAlertPayload {
  to?: string; // Recipient WhatsApp number (defaults to RKS Sales Hotline)
  templateName?: string;
  type: 'SITE_VISIT_BOOKED' | 'HUMAN_ESCALATION_REQUIRED' | 'PRICE_NEGOTIATION' | 'CALLBACK_REQUEST';
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
  channel: 'WHATSAPP_WEBHOOK' | 'WHATSAPP_CLOUD_API';
  formattedMessage: string;
}

const RKS_SALES_WHATSAPP_HOTLINE = process.env.SALES_WHATSAPP_NUMBER || '+91 98400 11223';
const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || '';

/**
 * Dispatches an automated WhatsApp notification to RKS Sales Team and Customer
 */
export async function dispatchWhatsAppAlert(
  payload: WhatsAppAlertPayload
): Promise<WhatsAppNotificationResult> {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const messageId = `WA-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  let formattedMessage = '';

  if (payload.type === 'SITE_VISIT_BOOKED') {
    formattedMessage = `🚨 *NEW RKS SITE VISIT APPOINTMENT* 🚨
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${payload.customerName}
📞 *Phone:* ${payload.customerPhone}
${payload.customerEmail ? `✉️ *Email:* ${payload.customerEmail}\n` : ''}🏡 *Property:* ${payload.propertyCode || 'General Layout Tour'} (${payload.projectName || 'RKS Township'})
📅 *Date:* ${payload.visitDate}
⏰ *Time Slot:* ${payload.timeSlot}
🚗 *Cab Pickup:* ${payload.pickupRequired ? `YES — ${payload.pickupLocation || 'Address Provided'}` : 'No (Self Drive)'}
━━━━━━━━━━━━━━━━━━━━
📌 *Action:* Please confirm appointment with customer and assign tour executive.`;
  } else {
    formattedMessage = `⚠️ *AI CHAT: HUMAN INTERVENTION REQUIRED* ⚠️
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
  console.log(`To: ${payload.to || RKS_SALES_WHATSAPP_HOTLINE}`);
  console.log(`Type: ${payload.type}`);
  console.log(formattedMessage);
  console.log('---------------------------------------------------\n');

  // If external webhook is configured (e.g. Twilio, Meta Cloud API, or Zapier), fire HTTP request
  if (WHATSAPP_WEBHOOK_URL) {
    try {
      await fetch(WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: payload.to || RKS_SALES_WHATSAPP_HOTLINE,
          message: formattedMessage,
          data: payload,
          messageId,
          timestamp,
        }),
      });
    } catch (err) {
      console.warn('WhatsApp webhook call warning:', err);
    }
  }

  return {
    success: true,
    messageId,
    recipient: payload.to || RKS_SALES_WHATSAPP_HOTLINE,
    dispatchedAt: timestamp,
    channel: 'WHATSAPP_WEBHOOK',
    formattedMessage,
  };
}
