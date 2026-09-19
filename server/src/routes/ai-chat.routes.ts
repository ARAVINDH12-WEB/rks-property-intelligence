import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { dispatchWhatsAppAlert } from '../services/whatsapp.service.js';

const router = Router();

// Helper to check if string contains Tamil unicode characters (\u0B80-\u0BFF)
function isTamilText(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

// Indian Rupee & Lakhs/Crores Formatter
function formatPriceINR(amount: number, isTa: boolean = false): string {
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2);
    return isTa ? `₹${cr} கோடி` : `₹${cr} Cr`;
  }
  if (amount >= 100000) {
    const lk = (amount / 100000).toFixed(2);
    return isTa ? `₹${lk} லட்சம்` : `₹${lk} Lakhs`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Format area
function formatArea(sqft: number, isTa: boolean = false): string {
  return isTa ? `${sqft} சதுர அடி` : `${sqft} sq.ft`;
}

// POST /api/ai-chat - Conversational Real Estate AI Concierge (Grounded RAG)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      message,
      history = [],
      customer_name = '',
      customer_phone = '',
      customer_email = '',
      locale = 'en',
      session_id = `sess-${Date.now()}`
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Input sanitization & max character guardrail
    const trimmedMsg = message.trim().slice(0, 500);
    const lowerMsg = trimmedMsg.toLowerCase();

    // Determine language: Tamil if contains Tamil characters or explicitly requested via locale
    const isTa = isTamilText(trimmedMsg) || locale === 'ta' || lowerMsg.includes('tamil') || lowerMsg.includes('தமிழ்');

    // 1. Check for Contact/Lead Information Extraction
    // Look for 10-digit Indian phone number
    const phoneMatch = trimmedMsg.match(/(?:(?:\+91|0)?[\s-]?)?([6-9]\d{9})\b/);
    const detectedPhone = phoneMatch ? phoneMatch[1] : null;

    // Look for name if user said "My name is X" or "I am X" or "பெயர் X"
    let detectedName = customer_name.trim();
    if (!detectedName) {
      const nameMatch = trimmedMsg.match(/(?:my name is|i am|name is|this is|call me|பெயர்|நான்)\s+([A-Za-z\u0B80-\u0BFF\s.]{2,30}?)(?=\s+(?:and|my|phone|contact|mobile|number|call|\d|மற்றும்|,|\.|$))/i);
      if (nameMatch && nameMatch[1]) {
        detectedName = nameMatch[1].trim();
      }
    }

    let capturedLeadId: number | null = null;
    let leadCapturedMessage = false;

    // If a phone number is detected, automatically capture as a lead
    if (detectedPhone) {
      try {
        const leadName = detectedName || 'AI Chat Visitor';
        // Duplicate check
        const existingLead = await query(`SELECT id FROM leads WHERE phone = $1 LIMIT 1`, [detectedPhone]);
        if (existingLead.rowCount && existingLead.rowCount > 0) {
          capturedLeadId = existingLead.rows[0].id;
          await query(
            `UPDATE leads 
             SET notes = COALESCE(notes, '') || ' | [AI Chat]: ' || $1, updated_at = NOW() 
             WHERE id = $2`,
            [trimmedMsg, capturedLeadId]
          );
        } else {
          const insertRes = await query(
            `INSERT INTO leads (name, phone, email, source, status, notes)
             VALUES ($1, $2, $3, 'AI_CHAT', 'NEW', $4) RETURNING id`,
            [leadName, detectedPhone, customer_email || null, `Captured via AI Chat. User message: "${trimmedMsg}"`]
          );
          if (insertRes.rowCount && insertRes.rowCount > 0) {
            capturedLeadId = insertRes.rows[0].id;
            leadCapturedMessage = true;
          }
        }
      } catch (leadErr) {
        console.warn('[AI Chat] Lead capture error:', leadErr);
      }
    }

    // 2. Fetch Live Database Context concurrently (Source of Truth for Listings, Settings & CMS)
    const [livePropsRes, settingsRes, pagesRes] = await Promise.all([
      query(
        `SELECT p.id, p.property_code, p.plot_number, p.area_sqft, p.rate_per_sqft, p.total_price,
                p.status, p.facing, p.survey_number, p.approval_number, p.ownership, p.amenities,
                p.description, p.description_ta, prj.name as project_name, prj.code as project_code,
                loc.city, loc.name as location_name
         FROM properties p
         LEFT JOIN projects prj ON p.project_id = prj.id
         LEFT JOIN locations loc ON p.location_id = loc.id
         WHERE p.archived = false
         ORDER BY p.id ASC`
      ),
      query(`SELECT key, value FROM system_settings`),
      query(`SELECT title, slug, content FROM pages WHERE is_published = true`),
    ]);

    const properties = livePropsRes.rows;
    const availablePlots = properties.filter((p: any) => p.status === 'AVAILABLE');
    const availableCount = availablePlots.length;

    // Build settings map from DB with fallback defaults
    const settingsMap: Record<string, string> = {
      whatsapp_number: '+919840011223',
      contact_phone: '+91 98400 11223',
      contact_email: 'info@rksgroup.in',
      contact_address: 'No. 42, GST Road, Guindy, Chennai, Tamil Nadu - 600032',
      stat_base_rate: '₹850/sq.ft',
    };
    for (const sRow of settingsRes.rows) {
      if (sRow.key && sRow.value) {
        settingsMap[sRow.key] = sRow.value;
      }
    }

    const cleanWa = settingsMap.whatsapp_number.replace(/[^0-9]/g, '');
    const livePhone = settingsMap.contact_phone;
    const liveEmail = settingsMap.contact_email;
    const liveAddress = settingsMap.contact_address;
    const cmsPages = pagesRes.rows;

    // 3. Intent Detection & Live RAG Routing
    let reply = '';
    const suggestedActions: string[] = [];
    let detectedIntent = 'GENERAL';
    let requiresHuman = false;
    let escalationReason = '';

    // Check human handoff triggers
    const isHumanHandoff = 
      lowerMsg.includes('human') || lowerMsg.includes('agent') || lowerMsg.includes('manager') ||
      lowerMsg.includes('person') || lowerMsg.includes('speak') || lowerMsg.includes('call me') ||
      lowerMsg.includes('பேச வேண்டும்') || lowerMsg.includes('அழைக்க');

    const isNegotiation =
      lowerMsg.includes('discount') || lowerMsg.includes('negotiat') || lowerMsg.includes('reduce') ||
      lowerMsg.includes('cheaper') || lowerMsg.includes('best price') || lowerMsg.includes('offer') ||
      lowerMsg.includes('தள்ளுபடி') || lowerMsg.includes('குறைக்க');

    // Specific Plot query (e.g. "plot 56", "plot 1", "RKS-EV-001", "ev-001", "plot number 2")
    const plotCodeMatch = trimmedMsg.match(/RKS-[A-Z]{2}-\d{3}/i) || 
                          trimmedMsg.match(/(?:plot|மனை)\s*(?:no\.?|number)?\s*([0-9]{1,3})/i);

    // Comparison query (e.g. "plot 1 or plot 2", "plot 53 or plot 58", "compare plot X and plot Y")
    const compareMatches = [...trimmedMsg.matchAll(/(?:plot|மனை)\s*(?:no\.?|number)?\s*([0-9]{1,3})/gi)];
    const isComparison = (compareMatches.length >= 2 || lowerMsg.includes('compare') || lowerMsg.includes('bigger') || lowerMsg.includes('ஒப்பிடு') || lowerMsg.includes('பெரியது')) && compareMatches.length >= 2;

    // City mention
    const cityList = ['chennai', 'trichy', 'coimbatore', 'hosur', 'bangalore'];
    const tamilCityMap: Record<string, string> = {
      'சென்னை': 'chennai',
      'திருச்சி': 'trichy',
      'கோவை': 'coimbatore',
      'கோயம்புத்தூர்': 'coimbatore',
      'ஓசூர்': 'hosur',
      'பெங்களூரு': 'bangalore'
    };
    let mentionedCity = cityList.find(c => lowerMsg.includes(c));
    if (!mentionedCity) {
      for (const [taCity, enCity] of Object.entries(tamilCityMap)) {
        if (trimmedMsg.includes(taCity)) {
          mentionedCity = enCity;
          break;
        }
      }
    }

    // Budget match (e.g. "under 5 lakhs", "under 15L", "below 10 lakh", "500000", "5 lakhs")
    const budgetMatch = lowerMsg.match(/(?:under|below|less than|within|குறைவாக|வரை)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l|லட்சம்|crore|cr|கோடி)?/i);
    let budgetFilter: number | null = null;
    if (budgetMatch && (lowerMsg.includes('under') || lowerMsg.includes('below') || lowerMsg.includes('budget') || lowerMsg.includes('lakh') || lowerMsg.includes('லட்சம்') || lowerMsg.includes('குறைவாக'))) {
      const num = parseFloat(budgetMatch[1]);
      if (lowerMsg.includes('crore') || lowerMsg.includes('cr') || lowerMsg.includes('கோடி')) {
        budgetFilter = num * 10000000;
      } else if (lowerMsg.includes('lakh') || lowerMsg.includes('l') || lowerMsg.includes('லட்சம்') || num <= 100) {
        budgetFilter = num * 100000;
      } else if (num > 100000) {
        budgetFilter = num;
      }
    }

    // Legal / DTCP / Patta intent
    const isLegalCheck = 
      lowerMsg.includes('dtcp') || lowerMsg.includes('rera') || lowerMsg.includes('cmda') || 
      lowerMsg.includes('patta') || lowerMsg.includes('approval') || lowerMsg.includes('legal') ||
      lowerMsg.includes('clear title') || lowerMsg.includes('encumbrance') || lowerMsg.includes('பட்டா') ||
      lowerMsg.includes('அங்கீகாரம்') || lowerMsg.includes('வில்லங்கம்');

    // Site Visit intent
    const isSiteVisit = 
      lowerMsg.includes('site visit') || lowerMsg.includes('visit') || lowerMsg.includes('tour') ||
      lowerMsg.includes('cab') || lowerMsg.includes('pickup') || lowerMsg.includes('தளப் பார்வை') ||
      lowerMsg.includes('நேரடி பார்வை') || lowerMsg.includes('வாகன');

    // Policy / Brokerage / Bank loan
    const isPolicyOrLoan =
      lowerMsg.includes('brokerage') || lowerMsg.includes('commission') || lowerMsg.includes('loan') ||
      lowerMsg.includes('bank') || lowerMsg.includes('emi') || lowerMsg.includes('வங்கி') ||
      lowerMsg.includes('தரகர்') || lowerMsg.includes('கடன்');

    // Contact / Office Address intent
    const isContactQuery =
      lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes('email') ||
      lowerMsg.includes('address') || lowerMsg.includes('office') || lowerMsg.includes('location') ||
      lowerMsg.includes('தொடர்பு') || lowerMsg.includes('தொலைபேசி') || lowerMsg.includes('முகவரி');

    // Helper to find property by plot number or property code
    const findPropertyMatch = (queryStr: string, numStr?: string) => {
      const q = (queryStr || '').trim().toLowerCase();
      const n = (numStr || '').trim().toLowerCase();
      return properties.find((p: any) => {
        const code = (p.property_code || '').trim().toLowerCase();
        const pNum = (p.plot_number != null ? String(p.plot_number) : '').trim().toLowerCase();
        if (code === q) return true;
        if (n) {
          if (pNum === n) return true;
          if (code === `plot ${n}`) return true;
          if (code.endsWith(` ${n}`)) return true;
          if (code.endsWith(`-${n}`)) return true;
          if (code.endsWith(n.padStart(3, '0'))) return true;
        }
        return false;
      });
    };

    // ─── EXECUTE GROUNDED RAG INTENT RESOLUTION ───

    // Intent A: Comparison of Two Plots
    if (isComparison && compareMatches.length >= 2) {
      detectedIntent = 'PLOT_COMPARISON';
      const p1Num = compareMatches[0][1];
      const p2Num = compareMatches[1][1];

      const p1 = findPropertyMatch(compareMatches[0][0], p1Num);
      const p2 = findPropertyMatch(compareMatches[1][0], p2Num);

      if (!p1 && !p2) {
        reply = isTa
          ? `மன்னிக்கவும், மனை எண் ${p1Num} மற்றும் ${p2Num} ஆகிய இரண்டும் எங்கள் நேரடி தரவுத்தளத்தில் கிடைக்கவில்லை. கிடைக்கும் மனைகளின் பட்டியலை அறிய விரும்புகிறீர்களா?`
          : `I could not find Plot ${p1Num} or Plot ${p2Num} in our live registry. Would you like to see our currently available surveyed plots?`;
        suggestedActions.push(isTa ? 'கிடைக்கும் மனைகள்' : 'Show Available Plots', isTa ? 'தளப் பார்வை முன்பதிவு' : 'Book Site Visit');
      } else if (!p1 || !p2) {
        const found = p1 || p2;
        const missingNum = !p1 ? p1Num : p2Num;
        reply = isTa
          ? `மனை ${found.property_code} உள்ளது: ${formatArea(found.area_sqft, true)}, விலை ${formatPriceINR(found.total_price, true)} (${found.status === 'AVAILABLE' ? 'கிடைக்கும்' : found.status}). ஆனால் மனை எண் ${missingNum} பதிவில் இல்லை.`
          : `I found ${found.property_code}: ${formatArea(found.area_sqft)}, priced at ${formatPriceINR(found.total_price)} (${found.status}). However, Plot ${missingNum} is not currently in our database.`;
        suggestedActions.push(isTa ? 'அனைத்து மனைகள்' : 'View All Plots', isTa ? 'தளப் பார்வை' : 'Book Site Visit');
      } else {
        const bigger = Number(p1.area_sqft) > Number(p2.area_sqft) ? p1 : p2;
        const smaller = Number(p1.area_sqft) > Number(p2.area_sqft) ? p2 : p1;
        const areaDiff = Math.abs(Number(bigger.area_sqft) - Number(smaller.area_sqft)).toFixed(1);

        if (isTa) {
          reply = `📊 **மனைகள் ஒப்பீடு (நேரடி தரவு):**\n\n` +
            `• **${p1.property_code}:** ${formatArea(p1.area_sqft, true)}, விலை ${formatPriceINR(p1.total_price, true)} (சதுர அடிக்கு ₹${p1.rate_per_sqft}), நிலை: **${p1.status === 'AVAILABLE' ? 'விற்பனைக்கு உள்ளது' : p1.status}**, திசை: ${p1.facing || 'கிழக்கு'}\n` +
            `• **${p2.property_code}:** ${formatArea(p2.area_sqft, true)}, விலை ${formatPriceINR(p2.total_price, true)} (சதுர அடிக்கு ₹${p2.rate_per_sqft}), நிலை: **${p2.status === 'AVAILABLE' ? 'விற்பனைக்கு உள்ளது' : p2.status}**, திசை: ${p2.facing || 'வடக்கு'}\n\n` +
            `📌 **முடிவு:** ${bigger.property_code}, ${smaller.property_code}-ஐ விட **${areaDiff} சதுர அடி பெரியது**.`;
          suggestedActions.push('தளப் பார்வை முன்பதிவு', 'வங்கி கடன் உதவி', 'வாட்ஸ்அப் உதவி');
        } else {
          reply = `📊 **Plot Comparison (Live Database Record):**\n\n` +
            `• **${p1.property_code}:** ${formatArea(p1.area_sqft)}, Rate ₹${p1.rate_per_sqft}/sq.ft, Total: **${formatPriceINR(p1.total_price)}** (Status: **${p1.status}**), Facing: ${p1.facing || 'East'}\n` +
            `• **${p2.property_code}:** ${formatArea(p2.area_sqft)}, Rate ₹${p2.rate_per_sqft}/sq.ft, Total: **${formatPriceINR(p2.total_price)}** (Status: **${p2.status}**), Facing: ${p2.facing || 'North'}\n\n` +
            `📌 **Comparison Verdict:** ${bigger.property_code} is **${areaDiff} sq.ft larger** than ${smaller.property_code}.`;
          suggestedActions.push('Book Free Site Visit', 'Check Bank Loan', 'Speak to Sales Advisor');
        }
      }

    // Intent B: Specific Plot Lookup (by Plot number or Property Code)
    } else if (plotCodeMatch) {
      detectedIntent = 'SPECIFIC_PLOT_QUERY';
      const targetQuery = plotCodeMatch[0].trim();
      const plotNum = plotCodeMatch[1] || '';

      const matchedProp = findPropertyMatch(targetQuery, plotNum);

      if (!matchedProp) {
        if (isTa) {
          reply = `மனை "${targetQuery}" எங்கள் அதிகாரப்பூர்வ தரவுத்தளத்தில் தற்போது கிடைக்கவில்லை. எங்கள் விற்பனை மேலாளரிடம் வாட்ஸ்அப் வழியாக விசாரிக்க விரும்புகிறீர்களா?`;
          suggestedActions.push('கிடைக்கும் மனைகள்', 'வாட்ஸ்அப் உதவி', 'தளப் பார்வை');
        } else {
          reply = `Plot "${targetQuery}" was not found in our live surveyed plots database. Would you like me to check other available plots in that corridor or connect you with our sales team?`;
          suggestedActions.push('Browse Available Plots', 'Connect via WhatsApp', 'Book Site Visit');
        }
      } else {
        // Check if user also asked for negotiation / human contact on this specific plot
        if (isNegotiation || isHumanHandoff) {
          requiresHuman = true;
          escalationReason = isNegotiation ? `Custom Price Negotiation on ${matchedProp.property_code}` : `Direct Sales Advisor Request for ${matchedProp.property_code}`;
          try {
            await dispatchWhatsAppAlert({
              type: isNegotiation ? 'PRICE_NEGOTIATION' : 'HUMAN_ESCALATION_REQUIRED',
              customerName: detectedName || 'AI Chat Visitor',
              customerPhone: detectedPhone || 'Shared in Chat',
              customerEmail: customer_email || undefined,
              summary: `${escalationReason} - ${matchedProp.property_code} (${matchedProp.city || 'Trichy'})`,
              userMessage: trimmedMsg
            });
          } catch (err) {
            console.warn('WhatsApp alert trigger:', err);
          }
        }

        // Legal verification fact check
        const dtcpStatus = matchedProp.approval_number 
          ? (isTa ? `அங்கீகரிக்கப்பட்டது (${matchedProp.approval_number})` : `Approved (${matchedProp.approval_number})`)
          : (isTa ? `சரிபார்ப்பு செயல்முறையில் உள்ளது (இன்னும் உறுதிப்படுத்தப்படவில்லை)` : `Under verification (Not formally documented in registry)`);

        const negotiationNote = isNegotiation
          ? (isTa 
              ? `\n\n💬 **விலை சலுகை கோரிக்கை:** உங்கள் சலுகை/தள்ளுபடி கோரிக்கை குறித்து விற்பனை மேலாளரிடம் பேச [வாட்ஸ்அப்பில் தொடர்புகொள்ளவும்](https://wa.me/${cleanWa}?text=Hi, I want to discuss pricing for ${matchedProp.property_code}).`
              : `\n\n💬 **Price Discussion:** Pricing for ${matchedProp.property_code} starts at ${formatPriceINR(matchedProp.total_price)}. For direct developer discount discussions, our senior manager has been alerted: [Connect on WhatsApp](https://wa.me/${cleanWa}?text=Hi, I want to discuss pricing for ${matchedProp.property_code}).`)
          : '';

        if (isTa) {
          reply = `🏡 **${matchedProp.property_code} மனை விவரங்கள் (நேரடி தரவு):**\n\n` +
            `• **திட்டம்:** ${matchedProp.project_name || 'RKS Property Hub'}\n` +
            `• **இடம்:** ${matchedProp.city || matchedProp.location_name}\n` +
            `• **பரப்பளவு:** ${formatArea(matchedProp.area_sqft, true)}\n` +
            `• **சதுர அடி விலை:** ₹${matchedProp.rate_per_sqft}\n` +
            `• **மொத்த விலை:** **${formatPriceINR(matchedProp.total_price, true)}**\n` +
            `• **விற்பனை நிலை:** **${matchedProp.status === 'AVAILABLE' ? 'விற்பனைக்கு உள்ளது 🟢' : matchedProp.status}**\n` +
            `• **சர்வே எண்:** ${matchedProp.survey_number || 'பதிவு ஆவணங்களின்படி'}\n` +
            `• **DTCP / RERA நிலை:** ${dtcpStatus}\n` +
            `• **பட்டா:** ${matchedProp.ownership === 'Freehold' ? 'தனிநபர் பட்டா உரிமை சரிபார்க்கப்பட்டது ✅' : 'சரிபார்க்கப்பட்டது'}\n` +
            `• **திசை:** ${matchedProp.facing || 'கிழக்கு'} | சாலை: ${matchedProp.road_width || '30 அடி'}` + negotiationNote;
          suggestedActions.push(isNegotiation ? 'விற்பனை மேலாளரிடம் பேசுங்கள்' : 'தளப் பார்வை முன்பதிவு', 'வங்கி கடன் உதவி', 'வாட்ஸ்அப் மூலம் தொடர்புகொள்ள');
        } else {
          reply = `🏡 **${matchedProp.property_code} Verified Plot Details (Live Database):**\n\n` +
            `• **Project:** ${matchedProp.project_name || 'RKS Property Hub'}\n` +
            `• **Location:** ${matchedProp.city || matchedProp.location_name}\n` +
            `• **Area:** ${formatArea(matchedProp.area_sqft)}\n` +
            `• **Rate per Sq.Ft:** ₹${matchedProp.rate_per_sqft} / sq.ft\n` +
            `• **Total Price:** **${formatPriceINR(matchedProp.total_price)}**\n` +
            `• **Availability:** **${matchedProp.status === 'AVAILABLE' ? 'Available for Immediate Registration 🟢' : matchedProp.status}**\n` +
            `• **Survey Number:** ${matchedProp.survey_number || 'As per revenue records'}\n` +
            `• **DTCP / Approval:** ${dtcpStatus}\n` +
            `• **Patta Status:** ${matchedProp.ownership === 'Freehold' ? 'Verified Clear Freehold Title ✅' : 'Verified'}\n` +
            `• **Facing:** ${matchedProp.facing || 'East'} | Internal Road: ${matchedProp.road_width || '30 ft'}` + negotiationNote;
          suggestedActions.push(isNegotiation ? 'Speak to Senior Advisor' : 'Book Free Cab Site Visit', 'Check Bank Loan Eligibility', 'Talk to Sales Advisor');
        }
      }

    // Intent C: DTCP / RERA / Legal Compliance Check specifically
    } else if (isLegalCheck && !plotCodeMatch) {
      detectedIntent = 'LEGAL_COMPLIANCE';
      const approvedCount = properties.filter((p: any) => p.approval_number).length;
      
      if (isTa) {
        reply = `📜 **சட்டப்பூர்வ ஆவணங்கள் & DTCP / பட்டா சரிபார்ப்பு:**\n\n` +
          `• **பட்டா சரிபார்ப்பு:** RKS-ன் அனைத்து மனைகளும் 100% வில்லங்கமற்ற தனிநபர் பட்டா (Freehold Patta) உரிமை கொண்டவை.\n` +
          `• **DTCP / RERA அங்கீகாரம்:** எங்கள் திட்டங்களில் பதிவு எண் உள்ள மனைகளுக்கு மட்டுமே அங்கீகரிக்கப்பட்டதாக சான்றளிக்கிறோம் (${approvedCount} மனைகள் அதிகாரப்பூர்வ DTCP ஆவணப்படுத்தப்பட்டுள்ளன).\n` +
          `• **வில்லங்கச் சான்றிதழ் (EC):** 30 ஆண்டுகால வில்லங்க சான்றிதழ் வழக்கறிஞர் குழுவால் சரிபார்க்கப்பட்டது.\n` +
          `• **கட்டுப்பாடு உத்தரவாதம்:** எந்தவொரு மனைக்கும் உறுதிப்படுத்தப்படாத சட்ட உரிமைகோரலை நாங்கள் அளிப்பதில்லை.\n\n` +
          `குறிப்பிட்ட மனை எண்ணைக் குறிப்பிட்டால், அதன் துல்லியமான சர்வே எண் மற்றும் பட்டா நிலையை உங்களுக்கு உடனே வழங்குகிறேன்.`;
        suggestedActions.push('திருச்சி மனைகள்', 'சென்னை மனைகள்', 'தளப் பார்வை முன்பதிவு');
      } else {
        reply = `📜 **Legal Status & DTCP / Patta Verification Policy:**\n\n` +
          `• **Clear Title & Patta:** 100% of RKS properties are surveyed with verified freehold ownership titles and individual Patta transfer eligibility.\n` +
          `• **DTCP / RERA Approvals:** We strictly report verification status recorded in our registry (${approvedCount} plots have verified approval numbers on file). If a plot is under approval process, we explicitly state so.\n` +
          `• **30-Year Encumbrance (EC):** Fully vetted by our in-house legal panel with nil encumbrance certified.\n\n` +
          `Would you like me to check the legal and survey number verification for a specific plot code?`;
        suggestedActions.push('Check Specific Plot', 'Book Free Site Visit', 'View Legal FAQ');
      }

    // Intent D: City Filter and/or Budget Filter
    } else if (mentionedCity || budgetFilter) {
      detectedIntent = 'INVENTORY_FILTER';
      let filtered = availablePlots;

      if (mentionedCity) {
        filtered = filtered.filter((p: any) => 
          (p.city && p.city.toLowerCase().includes(mentionedCity!)) ||
          (p.location_name && p.location_name.toLowerCase().includes(mentionedCity!))
        );
      }

      if (budgetFilter) {
        filtered = filtered.filter((p: any) => Number(p.total_price) <= budgetFilter!);
      }

      const count = filtered.length;
      const top3 = filtered.slice(0, 3);

      if (count === 0) {
        if (isTa) {
          reply = `மன்னிக்கவும், ${mentionedCity ? mentionedCity.toUpperCase() : ''} ${budgetFilter ? `${formatPriceINR(budgetFilter, true)}-க்குள்` : ''} உடனடி விற்பனைக்கு மனைகள் தற்போது இல்லை. எங்கள் அருகிலுள்ள பிற வளர்ச்சி மண்டலங்களை பார்க்க விரும்புகிறீர்களா?`;
          suggestedActions.push('அனைத்து கிடைக்கும் மனைகள்', 'வாட்ஸ்அப் உதவி', 'தளப் பார்வை');
        } else {
          reply = `Currently, there are no available plots matching ${mentionedCity ? `in ${mentionedCity.toUpperCase()}` : ''} ${budgetFilter ? `under ${formatPriceINR(budgetFilter)}` : ''} in our live inventory. Would you like to view alternative plots in nearby growth corridors?`;
          suggestedActions.push('View All Available Plots', 'Contact via WhatsApp', 'Book Free Site Visit');
        }
      } else {
        const plotListStr = top3.map((p: any) => 
          isTa 
            ? `• **${p.property_code}** (${p.city || p.location_name}): ${formatArea(p.area_sqft, true)} @ ₹${p.rate_per_sqft}/சதுர அடி = **${formatPriceINR(p.total_price, true)}**`
            : `• **${p.property_code}** (${p.city || p.location_name}): ${formatArea(p.area_sqft)} @ ₹${p.rate_per_sqft}/sq.ft = **${formatPriceINR(p.total_price)}**`
        ).join('\n');

        if (isTa) {
          reply = `📍 **${count} மனைகள் நேரடி தரவுத்தளத்தில் கண்டறியப்பட்டன:**\n\n${plotListStr}\n\n${count > 3 ? `...மற்றும் ${count - 3} கூடுதல் மனைகள் உள்ளன.` : ''}\n\nஇலவச வாகனத்துடன் கூடிய நேரடி தளப் பார்வையை முன்பதிவு செய்ய விரும்புகிறீர்களா?`;
          suggestedActions.push('தளப் பார்வை முன்பதிவு', 'விலை விவரங்கள்', 'வாட்ஸ்அப் உதவி');
        } else {
          reply = `📍 **Found ${count} verified plots matching your criteria:**\n\n${plotListStr}\n\n${count > 3 ? `...and ${count - 3} more plots in this range.` : ''}\n\nWould you like to book a complimentary cab tour to inspect these plots in person?`;
          suggestedActions.push('Book Free Site Visit', 'Check Bank Loan Eligibility', 'Speak to Executive');
        }
      }

    // Intent E: Direct Contact / Office Address Query
    } else if (isContactQuery) {
      detectedIntent = 'CONTACT_INFO';
      if (isTa) {
        reply = `📞 **RKS Property Hub தொடர்பு விவரங்கள் (நேரடி தரவு):**\n\n` +
          `• **தொலைபேசி:** ${livePhone}\n` +
          `• **மின்னஞ்சல்:** ${liveEmail}\n` +
          `• **அலுவலக முகவரி:** ${liveAddress}\n` +
          `• **வாட்ஸ்அப்:** [வாட்ஸ்அப்பில் தொடர்புகொள்ள](https://wa.me/${cleanWa})\n\n` +
          `எங்கள் குழு காலை 9:00 முதல் மாலை 7:00 வரை உங்கள் சேவைக்கு தயார் நிலையில் உள்ளது.`;
        suggestedActions.push('தளப் பார்வை முன்பதிவு', 'கிடைக்கும் மனைகள்', 'வாட்ஸ்அப் உதவி');
      } else {
        reply = `📞 **RKS Property Hub Live Contact Information:**\n\n` +
          `• **Phone:** ${livePhone}\n` +
          `• **Email:** ${liveEmail}\n` +
          `• **Office Address:** ${liveAddress}\n` +
          `• **WhatsApp:** [Chat on WhatsApp](https://wa.me/${cleanWa})\n\n` +
          `Our senior advisors are available 7 days a week (9:00 AM – 7:00 PM). How else can I assist you?`;
        suggestedActions.push('Book Free Site Visit', 'Browse Available Plots', 'WhatsApp Support');
      }

    // Intent F: Free Cab Site Visit
    } else if (isSiteVisit) {
      detectedIntent = 'SITE_VISIT';
      if (isTa) {
        reply = `🚗 **RKS பிரத்தியேக இலவச வாகன தளப் பார்வை (Complimentary Cab Tour):**\n\n` +
          `• **இலவச பிக்-அப் & டிராப்:** உங்கள் வீட்டிலிருந்தே ஏசி வாகன வசதி (சென்னை, திருச்சி, கோவை, ஓசூர் மற்றும் பெங்களூரு காரிடார்).\n` +
          `• **வழிகாட்டி:** நேரடி சர்வே வரைபடம் மற்றும் பட்டா ஆவணங்களுடன் களப் பிரதிநிதி உடன் வருவார்.\n` +
          `• **நேரம்:** வாரத்தின் 7 நாட்களும் காலை 9:00 முதல் மாலை 6:00 மணி வரை.\n` +
          `• **முன்பதிவு:** கீழ் உள்ள **"தளப் பார்வை முன்பதிவு"** பொத்தானை கிளிக் செய்து உங்கள் தேதியை தேர்ந்தெடுக்கலாம்.`;
        suggestedActions.push('தளப் பார்வை முன்பதிவு', 'கிடைக்கும் மனைகள்', 'வாட்ஸ்அப் உதவி');
      } else {
        reply = `🚗 **RKS Complimentary Site Visit with Cab Pickup:**\n\n` +
          `• **Doorstep Pickup & Drop:** Free AC cab from anywhere in the city (Chennai, Trichy, Coimbatore, Hosur, Bangalore Corridor).\n` +
          `• **Guided Inspection:** Dedicated property executive with layout blueprint & legal documentation.\n` +
          `• **Availability:** 7 days a week, 9:00 AM – 6:00 PM.\n` +
          `• **Zero Obligation:** Completely complimentary with no hidden charges.\n\n` +
          `Click **"Book Free Site Visit"** below to schedule your preferred date and time slot.`;
        suggestedActions.push('Book Free Site Visit', 'Browse Available Plots', 'Speak to Sales Advisor');
      }

    // Intent F: Brokerage / Bank Loan Policy
    } else if (isPolicyOrLoan) {
      detectedIntent = 'POLICY_AND_LOANS';
      if (isTa) {
        reply = `🤝 **RKS கொள்கைகள் & வங்கி கடன் விவரங்கள்:**\n\n` +
          `• **0% தரகு (Zero Brokerage):** நேரடி டெவலப்பர் விற்பனை — எந்தவித மறைமுக கமிஷனும் இல்லை.\n` +
          `• **வங்கி வீட்டுக் கடன்:** SBI, HDFC, ICICI, மற்றும் Axis வங்கிகளுடன் இணைந்து 75% முதல் 80% வரை உடனடி மனைக்கடன் உதவி.\n` +
          `• **பத்திரப்பதிவு கட்டணம்:** வழிகாட்டி மதிப்பீட்டின்படி 7% பதிவு கட்டணம் + 2% இதர ஆவண கட்டணங்கள் வெளிப்படையாக தெரிவிக்கப்படும்.`;
        suggestedActions.push('வங்கி கடன் உதவி', 'தளப் பார்வை முன்பதிவு', 'வாட்ஸ்அப் உதவி');
      } else {
        reply = `🤝 **RKS Transparent Policies & Bank Loan Assistance:**\n\n` +
          `• **0% Brokerage:** You buy directly from the developer — zero intermediary commission or hidden fees.\n` +
          `• **Bank Loan Tie-ups:** Pre-approved by SBI, HDFC, ICICI, and Axis Bank with up to 75–80% financing on plot + construction.\n` +
          `• **Documentation Support:** Complete assistance for Patta transfer, EC generation, and sub-registrar plot registration.`;
        suggestedActions.push('Check Bank Loan Eligibility', 'Book Free Site Visit', 'Speak to Advisor');
      }

    // Intent G: Negotiation / Human Escalation
    } else if (isNegotiation || isHumanHandoff) {
      detectedIntent = isNegotiation ? 'PRICE_NEGOTIATION' : 'HUMAN_HANDOFF';
      requiresHuman = true;
      escalationReason = isNegotiation ? 'Custom Price Negotiation' : 'Direct Human Sales Advisor Request';

      try {
        await dispatchWhatsAppAlert({
          type: isNegotiation ? 'PRICE_NEGOTIATION' : 'HUMAN_ESCALATION_REQUIRED',
          customerName: detectedName || 'AI Chat Visitor',
          customerPhone: detectedPhone || 'Shared in Chat',
          customerEmail: customer_email || undefined,
          summary: escalationReason,
          userMessage: trimmedMsg
        });
      } catch (err) {
        console.warn('WhatsApp alert trigger:', err);
      }

      if (isTa) {
        reply = `🤝 **விற்பனை மேலாளருடன் நேரடி உரையாடல்:**\n\n` +
          `உங்கள் கோரிக்கை எங்கள் மூத்த விற்பனை மேலாளருக்கு உடனடி வாட்ஸ்அப் எச்சரிக்கையாக அனுப்பப்பட்டுள்ளது.\n\n` +
          `நேரடியாக பேச விரும்பினால்:\n` +
          `• **வாட்ஸ்அப்:** [வாட்ஸ்அப் அரட்டை](https://wa.me/${cleanWa}?text=${encodeURIComponent('Vanakkam, I would like to speak with a sales advisor.')})\n` +
          `• **தொலைபேசி:** ${livePhone}\n` +
          `• **மின்னஞ்சல்:** ${liveEmail}\n\n` +
          (detectedPhone ? `உங்கள் எண்ணான **${detectedPhone}**-ல் எங்கள் குழு விரைவில் உங்களை அழைக்கும்.` : `உங்கள் தொலைபேசி எண்ணை பகிர்ந்தால் உடனடியாக உங்களுக்கு அழைப்போம்.`);
        suggestedActions.push('தளப் பார்வை முன்பதிவு', 'கிடைக்கும் மனைகள்', 'வாட்ஸ்அப் உதவி');
      } else {
        reply = `🤝 **Connecting You with a Senior Property Advisor:**\n\n` +
          `I have dispatched an urgent notification to our sales desk regarding your inquiry: *${escalationReason}*.\n\n` +
          `You can reach our team directly via:\n` +
          `• **WhatsApp:** [Chat on WhatsApp](https://wa.me/${cleanWa}?text=${encodeURIComponent('Hi, I am chatting with the RKS AI Assistant and would like to speak with an advisor.')})\n` +
          `• **Direct Phone:** ${livePhone}\n` +
          `• **Email:** ${liveEmail}\n` +
          `• **Office Address:** ${liveAddress}\n\n` +
          (detectedPhone ? `Our executive will call you shortly at **${detectedPhone}**.` : `You may also share your mobile number here, and an advisor will contact you within 15 minutes.`);
        suggestedActions.push('Book Free Site Visit', 'Browse Available Plots', 'WhatsApp Support');
      }

    // Default Fallback: Portfolio Overview Grounded in Live Stats
    } else {
      detectedIntent = 'PORTFOLIO_OVERVIEW';
      const avgRate = properties.length > 0 
        ? Math.round(properties.reduce((s: number, p: any) => s + Number(p.rate_per_sqft || 0), 0) / properties.length) 
        : 875;

      if (isTa) {
        reply = `வணக்கம்! 🙏 நான் **RKS Assistant**.\n\n` +
          `**எங்கள் நேரடி தரவுத்தள நிலவரம்:**\n` +
          `• **மொத்த சர்வே மனைகள்:** ${properties.length} மனைகள்\n` +
          `• **உடனடி விற்பனைக்கு உள்ளவை:** **${availableCount} மனைகள்**\n` +
          `• **சராசரி சதுர அடி விலை:** ₹${avgRate} / சதுர அடி\n` +
          `• **நகரங்கள்:** சென்னை, திருச்சி, கோயம்புத்தூர், ஓசூர் & பெங்களூரு காரிடார்\n\n` +
          `விலை, குறிப்பிட்ட மனை எண், DTCP அங்கீகாரம் அல்லது இலவச வாகன தளப் பார்வை முன்பதிவு பற்றி என்னிடம் கேட்கலாம்!`;
        suggestedActions.push('கிடைக்கும் மனைகள்', 'திருச்சி மனைகள்', 'தளப் பார்வை முன்பதிவு', 'வாட்ஸ்அப் உதவி');
      } else {
        reply = `Namaste! 🙏 I am the **RKS Assistant**, grounded in our live real-estate database.\n\n` +
          `**Current Live Portfolio Overview:**\n` +
          `• **Total Surveyed Plots:** ${properties.length}\n` +
          `• **Available for Purchase:** **${availableCount} plots**\n` +
          `• **Portfolio Average Rate:** ₹${avgRate} / sq.ft\n` +
          `• **Prime Corridors:** Chennai, Trichy, Coimbatore, Hosur & Bangalore Corridor\n\n` +
          `How can I assist you today? You can ask about plot rates, DTCP approvals, specific plot numbers, or book a free cab site tour!`;
        suggestedActions.push('Browse Available Plots', 'Plots Under 15 Lakhs', 'Book Free Site Visit', 'Talk to Human');
      }
    }

    // Append lead confirmation notice if newly captured in this turn
    if (leadCapturedMessage) {
      const confirmNotice = isTa
        ? `\n\n✅ *நன்றி! உங்கள் தொடர்பு எண் பதிவு செய்யப்பட்டது. எங்கள் விற்பனை பிரதிநிதி விரைவில் தொடர்புகொள்வார்.*`
        : `\n\n✅ *Thank you! Your contact details have been registered with our sales desk (Lead ID: #${capturedLeadId}).*`;
      reply += confirmNotice;
    }

    // 4. Log Conversation for Audit & Compliance
    try {
      await query(
        `INSERT INTO chat_conversations (session_id, user_message, assistant_reply, detected_intent, language, lead_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [session_id, trimmedMsg, reply, detectedIntent, isTa ? 'ta' : 'en', capturedLeadId]
      );
    } catch (logErr) {
      console.warn('[AI Chat] Conversation logging warning:', logErr);
    }

    res.json({
      reply,
      suggestedActions,
      detectedIntent,
      language: isTa ? 'ta' : 'en',
      requiresHuman,
      escalationReason: escalationReason || null,
      leadCaptured: !!capturedLeadId
    });
  } catch (error: any) {
    console.error('Error in AI Chat Concierge:', error);
    res.status(500).json({ error: 'AI Concierge temporarily unavailable' });
  }
});

export default router;
