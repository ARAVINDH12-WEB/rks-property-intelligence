import { dispatchWhatsAppAlert } from './services/whatsapp.service.js';

async function testWhatsAppAndAi() {
  console.log('🧪 Testing WhatsApp Alert Dispatch & AI Concierge Logic...\n');

  // Test 1: Site Visit WhatsApp Alert
  const siteVisitAlert = await dispatchWhatsAppAlert({
    type: 'SITE_VISIT_BOOKED',
    customerName: 'Sivasubramanian R',
    customerPhone: '+91 98844 11223',
    customerEmail: 'siva.subramanian@gmail.com',
    propertyCode: 'RKS-00124',
    projectName: 'RKS Prime Layout',
    visitDate: '2026-09-05',
    timeSlot: '10:00 AM - 12:00 PM',
    pickupRequired: true,
    pickupLocation: 'Velachery Bypass Road, Chennai',
    summary: 'Site visit for RKS-00124 booked by Sivasubramanian R',
  });

  if (siteVisitAlert.success && siteVisitAlert.formattedMessage.includes('NEW RKS SITE VISIT APPOINTMENT')) {
    console.log('  ✅ [PASS] Site visit WhatsApp alert formatted and dispatched successfully.');
  } else {
    console.error('  ❌ [FAIL] Site visit WhatsApp alert failed.');
    process.exit(1);
  }

  // Test 2: AI Human Escalation WhatsApp Alert (Negotiation / Custom Request)
  const escalationAlert = await dispatchWhatsAppAlert({
    type: 'PRICE_NEGOTIATION',
    customerName: 'Dr. K. Vignesh',
    customerPhone: '+91 99401 55667',
    summary: 'Price Negotiation / Custom Discount Request',
    userMessage: 'Can you offer a 5% discount if I pay 100% upfront for Plot 2 and Plot 3?',
    propertyCode: 'RKS-00125',
    projectName: 'RKS Prime Layout',
  });

  if (escalationAlert.success && escalationAlert.formattedMessage.includes('HUMAN INTERVENTION REQUIRED')) {
    console.log('  ✅ [PASS] AI Chat human escalation WhatsApp alert formatted and dispatched successfully.');
  } else {
    console.error('  ❌ [FAIL] AI Chat human escalation alert failed.');
    process.exit(1);
  }

  console.log('\n📊 All WhatsApp and AI integration tests passed successfully!\n');
}

testWhatsAppAndAi()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });
