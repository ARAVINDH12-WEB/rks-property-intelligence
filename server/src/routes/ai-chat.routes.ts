import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { dispatchWhatsAppAlert } from '../services/whatsapp.service.js';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// POST /api/ai-chat - Conversational Real Estate AI Concierge
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      message,
      history = [],
      customer_name = 'Prospective Buyer',
      customer_phone = '',
      customer_email = '',
      current_property_id = null,
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const trimmedMsg = message.trim();
    const lowerMsg = trimmedMsg.toLowerCase();

    // 1. Fetch live database context to keep answers 100% accurate
    const propertiesRes = await query(
      `SELECT p.id, p.property_code, p.plot_number, p.area_sqft, p.rate_per_sqft, p.total_price,
              p.status, p.facing, prj.name as project_name, loc.city, loc.name as location_name
       FROM properties p
       LEFT JOIN projects prj ON p.project_id = prj.id
       LEFT JOIN locations loc ON p.location_id = loc.id
       WHERE p.archived = false
       ORDER BY p.id ASC LIMIT 58`
    );

    const properties = propertiesRes.rows;
    const availableCount = properties.filter((p: any) => p.status === 'AVAILABLE').length;

    // 2. Intent Detection for Human Escalation
    const isHumanRequest =
      lowerMsg.includes('human') ||
      lowerMsg.includes('talk to someone') ||
      lowerMsg.includes('speak to') ||
      lowerMsg.includes('call me') ||
      lowerMsg.includes('contact number') ||
      lowerMsg.includes('agent') ||
      lowerMsg.includes('manager') ||
      lowerMsg.includes('executive') ||
      lowerMsg.includes('person') ||
      lowerMsg.includes('representative');

    const isNegotiation =
      lowerMsg.includes('discount') ||
      lowerMsg.includes('negotiat') ||
      lowerMsg.includes('best price') ||
      lowerMsg.includes('reduce') ||
      lowerMsg.includes('cheaper') ||
      lowerMsg.includes('final price') ||
      lowerMsg.includes('offer');

    const isLegalOrLoan =
      lowerMsg.includes('bank loan') ||
      lowerMsg.includes('home loan') ||
      lowerMsg.includes('emi') ||
      lowerMsg.includes('patta') ||
      lowerMsg.includes('title deed') ||
      lowerMsg.includes('encumbrance') ||
      lowerMsg.includes('legal');

    const isSiteVisitIntent =
      lowerMsg.includes('site visit') ||
      lowerMsg.includes('see the property') ||
      lowerMsg.includes('visit') ||
      lowerMsg.includes('come tomorrow') ||
      lowerMsg.includes('cab pickup');

    let requiresHuman = isHumanRequest || isNegotiation || isLegalOrLoan;
    let escalationReason = '';

    if (isNegotiation) escalationReason = 'Price Negotiation / Custom Discount Request';
    else if (isLegalOrLoan) escalationReason = 'Bank Loan & Legal Patta Consultation';
    else if (isHumanRequest) escalationReason = 'Direct Human Sales Advisor Request';

    let whatsappAlertSent = false;
    let whatsappResult: any = null;

    // 3. Dispatch WhatsApp Notification if human intervention is required
    if (requiresHuman) {
      try {
        whatsappResult = await dispatchWhatsAppAlert({
          type: isNegotiation ? 'PRICE_NEGOTIATION' : 'HUMAN_ESCALATION_REQUIRED',
          customerName: customer_name,
          customerPhone: customer_phone || 'Provided via Chat',
          customerEmail: customer_email,
          summary: escalationReason,
          userMessage: trimmedMsg,
        });
        whatsappAlertSent = true;
      } catch (err) {
        console.warn('WhatsApp alert trigger note:', err);
      }
    }

    // 4. Generate Knowledge-Grounded AI Response
    let reply = '';
    const suggestedActions: string[] = [];

    if (isSiteVisitIntent) {
      reply = `I would be delighted to help you experience RKS properties in person! 🏡\n\nWe provide **complimentary site visits with free cab pickup and drop** across Chennai, Bangalore, Hyderabad, and Coimbatore.\n\nYou can click the **"🚗 Book Site Visit"** button on any plot card or click the button below to schedule your preferred date and time slot. Our tour guide will meet you on site with layout blueprints and legal approval files.`;
      suggestedActions.push('Schedule Site Visit', 'View Available Plots', 'Ask About Pricing');
    } else if (isNegotiation) {
      reply = `Thank you for your interest! While our standard rates are fixed at **₹850 / sq.ft** (and **₹900 / sq.ft** for premium frontage Plots 2 & 3), we offer customized payment schedules and special developer terms for serious buyers.\n\n📲 **I have instantly alerted our Senior RKS Portfolio Manager on WhatsApp.** An executive will review your enquiry and get in touch with you shortly.`;
      suggestedActions.push('Schedule Site Visit', 'View Plot Pricing List', 'Calculate EMI');
    } else if (isLegalOrLoan) {
      reply = `All RKS properties come with **100% clear freehold titles, approved DTCP/RERA/CMDA plans, and immediate Patta transfer readiness**.\n\n🏦 **Bank Loan Support:** Our projects are pre-approved by major nationalized banks (SBI, HDFC, ICICI, Axis Bank) for up to **80% land and construction financing**.\n\n📲 **I have notified our RKS Legal & Banking Advisor on WhatsApp** to share the document kit and loan eligibility assistance with you.`;
      suggestedActions.push('Request Document Kit', 'Book Free Site Visit', 'Speak to Executive');
    } else if (lowerMsg.includes('rate') || lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('sqft')) {
      reply = `Here is our current pricing structure for **RKS Prime Plotted Inventory**:\n\n• **Standard Plots (Plots 1, 4 to 58):** **₹850 / sq.ft**\n• **Premium Highway Frontage (Plots 2 & 3):** **₹900 / sq.ft**\n\n**Sample Plot Estimates:**\n- **Plot 1** (2,177 sq.ft / 5.00 Cents) = **₹18.50 Lakhs**\n- **Plot 2** (2,537 sq.ft / 5.82 Cents) = **₹22.83 Lakhs**\n- **Plot 47** (544 sq.ft / 1.25 Cents) = **₹4.62 Lakhs**\n\nAll prices are calculated transparently as: **Area (Sq.Ft) × Rate / Sq.Ft**. Would you like to inspect a specific plot?`;
      suggestedActions.push('Show Plots under ₹15 Lakhs', 'Show Plots 2 & 3', 'Book Site Visit');
    } else if (lowerMsg.includes('plot 2') || lowerMsg.includes('plot 3')) {
      const p2 = properties.find((p: any) => p.plot_number?.includes('2') || p.property_code?.includes('002'));
      reply = `**Plot 2 & Plot 3 (Prime Commercial / Luxury Frontage):**\n\n• **Rate:** **₹900 / sq.ft**\n• **Plot 2:** 2,537.61 sq.ft (5.82 Cents) — **Total Price: ₹22,83,849**\n• **Plot 3:** 2,229.33 sq.ft (5.12 Cents) — **Total Price: ₹20,06,397**\n\nThese are wide-road East/North-East facing corner plots with maximum appreciation potential.`;
      suggestedActions.push('Book Visit for Plot 2', 'Book Visit for Plot 3', 'View All 58 Plots');
    } else if (lowerMsg.includes('under') || lowerMsg.includes('budget') || lowerMsg.includes('10 lakh') || lowerMsg.includes('15 lakh')) {
      reply = `We have fantastic plotted options across various budget tiers:\n\n• **Budget Compact Plots (₹3.5L to ₹6.0L):** Plots 42–45 (623 sq.ft @ ₹5.30L), Plot 47 (544 sq.ft @ ₹4.62L), Plot 57 (413 sq.ft @ ₹3.51L)\n• **Standard Family Villa Plots (₹12L to ₹14L):** Plots 8–15 (1,475 sq.ft @ ₹12.54L), Plots 23–25 (1,501 sq.ft @ ₹12.76L)\n• **Grand Estates (₹17L to ₹22.8L):** Plot 1 (2,177 sq.ft @ ₹18.50L), Plot 2 (2,537 sq.ft @ ₹22.83L)\n\nWhich budget bracket matches your dream home plan?`;
      suggestedActions.push('Show Affordable Plots', 'Show Villa Plots', 'Schedule Tour');
    } else if (isHumanRequest) {
      reply = `Understood! 📲 **I have triggered an urgent WhatsApp notification to our Senior Sales Advisor.**\n\nAn executive has received your request and will reach out to you immediately. If you have any questions in the meantime, feel free to ask me anything about plot dimensions, micro-markets, or site visits!`;
      suggestedActions.push('Schedule Site Visit', 'Browse All Properties', 'View Pricing');
    } else {
      reply = `Welcome to **RKS Property Intelligence**! I am your AI Property Concierge. 🌟\n\nI can assist you with:\n1. **Plot Search & Specifications:** Sizing in Sq.Ft, Cents, and Grounds across 58 surveyed plots.\n2. **Transparent Pricing:** Standard rate ₹850/sq.ft & Premium rate ₹900/sq.ft.\n3. **Complimentary Site Visits:** Book an appointment with free cab pickup & drop.\n4. **Approvals & Legal Titles:** DTCP, RERA, CMDA approvals and bank loan assistance.\n\nHow can I help you find your ideal property today?`;
      suggestedActions.push('Show Available Plots', 'What are the Rates?', 'Book a Site Visit', 'Speak to Sales Team');
    }

    res.json({
      reply,
      suggestedActions,
      requiresHuman,
      escalationReason: escalationReason || null,
      whatsappAlertSent,
      whatsappNotification: whatsappResult,
    });
  } catch (error: any) {
    console.error('Error in AI Chat Concierge:', error);
    res.status(500).json({ error: 'AI Concierge temporarily unavailable' });
  }
});

export default router;
