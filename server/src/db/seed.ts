import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, query } from './index.js';

export async function seedDatabase(force: boolean = false) {
  if (process.env.NODE_ENV === 'production' && !force) {
    console.log('Production environment. Skipping seed.');
    return;
  }

  await getDb();

  if (!force) {
    try {
      const metaCheck = await query("SELECT value FROM system_meta WHERE key = 'seed_completed'");
      if (metaCheck.rowCount > 0 && metaCheck.rows[0]?.value === 'true') {
        console.log('Database already seeded. Skipping.');
        return;
      }
    } catch {
      // Table might not exist yet
    }
  }

  console.log('Starting RKS Property Intelligence database initialization...');

  // 1. Clear all data
  await query('DELETE FROM leads').catch(() => {});
  await query('DELETE FROM audit_logs');
  await query('DELETE FROM property_history');
  await query('DELETE FROM property_documents');
  await query('DELETE FROM property_images');
  await query('DELETE FROM site_visits');
  await query('DELETE FROM offers').catch(() => {});
  await query('DELETE FROM properties');
  await query('DELETE FROM projects');
  await query('DELETE FROM locations');
  await query('DELETE FROM users');

  // 2. Create Admin
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@rksprime.com';
  let adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
  let generatedPassword = false;
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const adminRes = await query(
    `INSERT INTO users (name, email, password_hash, role, phone, avatar_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Rajesh Kumar S', adminEmail, adminHash, 'ADMIN', '+91 98400 12345', 'https://api.dicebear.com/7.x/initials/svg?seed=Rajesh Kumar S']
  );
  const adminId = adminRes.rows[0].id;

  // 3. Seed staff
  const staffHash = await bcrypt.hash('rks_staff_2026', 10);
  const mgr = await query(
    `INSERT INTO users (name, email, password_hash, role, phone, avatar_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    ['Priya Venkatesh', 'priya@rksprime.com', staffHash, 'MANAGER', '+91 98400 22222', 'https://api.dicebear.com/7.x/initials/svg?seed=Priya Venkatesh']
  );
  const mgrId = mgr.rows[0].id;
  const emp1 = await query(
    `INSERT INTO users (name, email, password_hash, role, phone, avatar_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    ['Karthik Rajan', 'karthik@rksprime.com', staffHash, 'EMPLOYEE', '+91 98400 33333', 'https://api.dicebear.com/7.x/initials/svg?seed=Karthik Rajan']
  );
  const emp1Id = emp1.rows[0].id;
  const emp2 = await query(
    `INSERT INTO users (name, email, password_hash, role, phone, avatar_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    ['Meena Devi', 'meena@rksprime.com', staffHash, 'EMPLOYEE', '+91 98400 44444', 'https://api.dicebear.com/7.x/initials/svg?seed=Meena Devi']
  );
  const emp2Id = emp2.rows[0].id;
  await query(
    `INSERT INTO users (name, email, password_hash, role, phone, avatar_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    ['Suresh Babu', 'suresh@rksprime.com', staffHash, 'VIEWER', '+91 98400 55555', 'https://api.dicebear.com/7.x/initials/svg?seed=Suresh Babu']
  );

  // 4. Seed Locations
  const loc1 = await query(`INSERT INTO locations (name, city, district, state, pincode, latitude, longitude) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Perungalathur', 'Chennai', 'Kancheepuram', 'Tamil Nadu', '600063', 12.8770, 80.0661]);
  const loc2 = await query(`INSERT INTO locations (name, city, district, state, pincode, latitude, longitude) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Maraimalai Nagar', 'Chennai', 'Chengalpattu', 'Tamil Nadu', '603209', 12.7887, 80.0179]);
  const loc3 = await query(`INSERT INTO locations (name, city, district, state, pincode, latitude, longitude) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Thiruverumbur', 'Trichy', 'Tiruchirappalli', 'Tamil Nadu', '620013', 10.8748, 78.7382]);
  const loc4 = await query(`INSERT INTO locations (name, city, district, state, pincode, latitude, longitude) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Kalapatti', 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '641048', 11.0698, 77.0037]);
  const loc5 = await query(`INSERT INTO locations (name, city, district, state, pincode, latitude, longitude) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Hosur Road Corridor', 'Hosur', 'Krishnagiri', 'Tamil Nadu', '635109', 12.7409, 77.8253]);

  const locIds = [loc1.rows[0].id, loc2.rows[0].id, loc3.rows[0].id, loc4.rows[0].id, loc5.rows[0].id];

  // 5. Seed Projects
  const proj1 = await query(`INSERT INTO projects (name, code, description, location_id, status, total_area_acres, developer) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Emerald Valley Phase 2', 'EV-P2', 'Premium plotted development along Chennai-Bangalore NH-48 corridor with DTCP approved layout.', locIds[1], 'ACTIVE', 12.5, 'RKS Group']);
  const proj2 = await query(`INSERT INTO projects (name, code, description, location_id, status, total_area_acres, developer) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Golden Acres Reserve', 'GA-RES', 'Serene gated community plots near Trichy ring road. Clear patta titles with paved internal roads.', locIds[2], 'ACTIVE', 8.2, 'RKS Group']);
  const proj3 = await query(`INSERT INTO projects (name, code, description, location_id, status, total_area_acres, developer) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Riverside Enclave', 'RS-ENC', 'Prime plots along Cauvery riverfront in Trichy. Walking distance to schools, hospitals.', locIds[2], 'ACTIVE', 6.0, 'RKS Group']);
  const proj4 = await query(`INSERT INTO projects (name, code, description, location_id, status, total_area_acres, developer) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Coimbatore Heights', 'CB-HGT', 'Elevated plots in Kalapatti near IT Park with panoramic views.', locIds[3], 'ACTIVE', 9.8, 'RKS Group']);
  const proj5 = await query(`INSERT INTO projects (name, code, description, location_id, status, total_area_acres, developer) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Hosur Tech Corridor', 'HS-TCR', 'Strategically located near Hosur Electronic City. Ideal for professionals.', locIds[4], 'UPCOMING', 14.3, 'RKS Group']);
  const proj6 = await query(`INSERT INTO projects (name, code, description, location_id, status, total_area_acres, developer) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['South Chennai Township', 'SC-TWN', 'Large-scale township project in Perungalathur with club house amenities.', locIds[0], 'ACTIVE', 22.1, 'RKS Group']);

  const projData = [
    { id: proj1.rows[0].id, locId: locIds[1], city: 'Chennai', prefix: 'EV', rate: 1150 },
    { id: proj2.rows[0].id, locId: locIds[2], city: 'Trichy', prefix: 'GA', rate: 875 },
    { id: proj3.rows[0].id, locId: locIds[2], city: 'Trichy', prefix: 'RS', rate: 920 },
    { id: proj4.rows[0].id, locId: locIds[3], city: 'Coimbatore', prefix: 'CB', rate: 1050 },
    { id: proj5.rows[0].id, locId: locIds[4], city: 'Hosur', prefix: 'HS', rate: 850 },
    { id: proj6.rows[0].id, locId: locIds[0], city: 'Chennai', prefix: 'SC', rate: 1250 },
  ];

  // 6. Seed 58 Properties with realistic variety
  const areas = [600, 720, 800, 900, 1000, 1100, 1200, 1350, 1500, 1650, 1800, 2000, 2200, 2400];
  const facings = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
  const roadWidths = ['20 ft', '30 ft', '40 ft', '24 ft', '60 ft'];
  const amenitiesList = [
    ['Paved Roads', 'Street Lights', 'Underground Drainage'],
    ['Paved Roads', 'Street Lights', 'Underground Drainage', 'Water Supply'],
    ['Paved Roads', 'Street Lights', 'Underground Drainage', 'Water Supply', 'Park'],
    ['Paved Roads', 'Street Lights', 'Compound Wall', 'Water Supply', 'Security'],
    ['Paved Roads', 'Street Lights', 'Club House', 'Water Supply', 'Park', 'Security'],
  ];

  const propertyStatuses = [
    ...Array(40).fill('AVAILABLE'),
    ...Array(12).fill('RESERVED'),
    ...Array(6).fill('SOLD'),
  ];

  let propCount = 0;
  const allPropertyIds: number[] = [];

  for (let pi = 0; pi < projData.length; pi++) {
    const proj = projData[pi];
    const plotsInProject = pi === 0 ? 12 : pi === 5 ? 13 : 8 + Math.floor(pi/2)*2;
    
    for (let i = 0; i < plotsInProject && propCount < 58; i++) {
      const plotNum = `${i + 1}`;
      const area = areas[(propCount + i * 3) % areas.length];
      const rateVariance = (Math.random() * 200 - 100);
      const rate = Math.round((proj.rate + rateVariance) / 50) * 50;
      const totalPrice = area * rate;
      const facing = facings[propCount % facings.length];
      const roadWidth = roadWidths[i % roadWidths.length];
      const amenities = amenitiesList[i % amenitiesList.length];
      const status = propertyStatuses[propCount];
      const surveyNum = `Survey No. ${100 + propCount}/${plotNum}`;
      const propCode = `RKS-${proj.prefix}-${String(plotNum).padStart(3, '0')}`;
      
      const now = new Date();
      let reservationDate = null;
      let soldDate = null;
      if (status === 'RESERVED') {
        reservationDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      } else if (status === 'SOLD') {
        soldDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      }

      const tamilCity = proj.city === 'Chennai' ? 'சென்னை' : proj.city === 'Trichy' ? 'திருச்சி' : proj.city === 'Coimbatore' ? 'கோயம்புத்தூர்' : proj.city === 'Hosur' ? 'ஓசூர்' : 'பெங்களூரு வழித்தடம்';
      const descTa = `${tamilCity} பகுதியில் அமைந்துள்ள ${area} சதுர அடி பிரீமியம் குடியிருப்பு மனை. தெளிவான பட்டா மற்றும் வில்லங்கச் சான்றிதழ் உடன் உடனடியாக வீடு கட்ட ஏற்ற இடம்.`;

      const propRes = await query(
        `INSERT INTO properties (
          property_code, project_id, location_id, property_type, category, status,
          plot_number, survey_number, area_sqft, area_sqm, rate_per_sqft, total_price,
          negotiable, registration_charges, other_charges, facing, road_width,
          ownership, amenities, reservation_date, sold_date,
          description, description_ta, created_by, assigned_to
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING id`,
        [
          propCode, proj.id, proj.locId, 'Residential Plot', 'Standard', status,
          plotNum, surveyNum, area, (area * 0.0929).toFixed(2), rate, totalPrice,
          Math.random() > 0.7, // 30% negotiable
          Math.round(totalPrice * 0.07), // 7% registration charges
          Math.round(totalPrice * 0.02), // 2% other charges
          facing, roadWidth,
          'Freehold', amenities,
          reservationDate, soldDate,
          `Well-located ${area} sq.ft residential plot in ${proj.city}. Clear survey title, Patta available. Ideal for immediate construction.`,
          descTa,
          adminId, emp1Id
        ]
      );
      allPropertyIds.push(propRes.rows[0].id);

      // Add property history entry
      await query(
        `INSERT INTO property_history (property_id, event_type, new_value, description, changed_by) VALUES ($1, $2, $3, $4, $5)`,
        [propRes.rows[0].id, 'CREATED', status, `Property ${propCode} created with status ${status}`, adminId]
      );

      if (status === 'RESERVED') {
        await query(
          `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by) VALUES ($1,'STATUS_CHANGE','AVAILABLE','RESERVED','Marked as Reserved after token amount received', $2)`,
          [propRes.rows[0].id, mgrId]
        );
      } else if (status === 'SOLD') {
        await query(
          `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by) VALUES ($1,'STATUS_CHANGE','AVAILABLE','RESERVED','Marked Reserved', $2)`,
          [propRes.rows[0].id, mgrId]
        );
        await query(
          `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by) VALUES ($1,'STATUS_CHANGE','RESERVED','SOLD','Sale completed, registration done', $2)`,
          [propRes.rows[0].id, adminId]
        );
      }

      propCount++;
    }
  }

  // 7. Seed Site Visits (10 realistic ones)
  const visitNames = [
    { name: 'Arun Sharma', phone: '9841234567', email: 'arun@gmail.com' },
    { name: 'Lakshmi Priya', phone: '9791234567', email: 'lakshmi.p@gmail.com' },
    { name: 'Vignesh Kumar', phone: '8801234567', email: null },
    { name: 'Nandini Raj', phone: '7701234567', email: 'nandini.raj@yahoo.com' },
    { name: 'Dinesh Anand', phone: '9901234567', email: null },
    { name: 'Suba Krishnan', phone: '9661234567', email: 'suba.k@gmail.com' },
    { name: 'Ravi Chandran', phone: '8861234567', email: null },
    { name: 'Padma Subramaniam', phone: '9551234567', email: 'padma.s@gmail.com' },
    { name: 'Bala Murugan', phone: '9771234567', email: null },
    { name: 'Kavitha Nathan', phone: '8891234567', email: 'kavitha.n@gmail.com' },
  ];
  const visitStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'CONFIRMED', 'CONFIRMED', 'REQUESTED', 'REQUESTED', 'REQUESTED', 'CANCELLED', 'COMPLETED'];
  const timeSlots = [
    '09:00 AM - 11:00 AM (Morning)',
    '11:00 AM - 01:00 PM (Mid-Day)',
    '02:00 PM - 04:00 PM (Afternoon)',
    '04:00 PM - 06:00 PM (Sunset / Evening)',
  ];

  for (let i = 0; i < 10; i++) {
    const v = visitNames[i];
    const daysOffset = i < 5 ? -(10 - i * 2) : (i - 4) * 2;
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() + daysOffset);
    const visitDateStr = visitDate.toISOString().split('T')[0];
    const propId = allPropertyIds[i % allPropertyIds.length];
    
    await query(
      `INSERT INTO site_visits (property_id, property_code, customer_name, customer_phone, customer_email, visit_date, time_slot, pickup_required, attendees_count, status, assigned_agent_id, assigned_agent_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        propId, `PROP-${String(i+1).padStart(3,'0')}`,
        v.name, v.phone, v.email,
        visitDateStr, timeSlots[i % 4],
        i % 3 === 0, // every 3rd has cab pickup
        i % 3 === 2 ? 3 : 2, // attendees count
        visitStatuses[i],
        i < 7 ? emp1Id : emp2Id,
        i < 7 ? 'Karthik Rajan' : 'Meena Devi'
      ]
    );
  }

  // 8. Seed Offers
  await query(
    `INSERT INTO offers (title, description, discount_percentage, valid_from, valid_until, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)`.replace(
      'INSERT INTO offers',
      'INSERT INTO offers'
    ),
    ['Monsoon Special', '5% off on all Trichy plots above 1200 sq.ft', 5, '2026-08-01', '2026-10-31', 'ACTIVE', adminId]
  ).catch(() => console.log('Offers table may not have all columns, skipping offers seed'));

  // 9. Seed CMS Pages
  await query('DELETE FROM pages').catch(() => {});
  const cmsPages = [
    { title: 'Home | RKS Property Hub', slug: '/', meta_title: 'DTCP & RERA Approved Residential Plots in Tamil Nadu | RKS Property Hub', meta_description: 'Explore DTCP & RERA approved residential & commercial plots across Chennai, Trichy, Coimbatore & Hosur with clear Patta titles and free cab site visits.' },
    { title: 'Property Listings | RKS Property Hub', slug: '/properties', meta_title: 'Verified Land & Residential Plot Inventory | RKS Property Hub', meta_description: 'Browse transparent DTCP approved plots, villas, commercial & agricultural land listings with live pricing and interactive search.' },
    { title: 'Plots in Chennai | RKS Property Hub', slug: '/plots/chennai', meta_title: 'DTCP Approved Plots in Chennai & Perungalathur | RKS Property Hub', meta_description: 'Discover prime residential plots and commercial land for sale in Chennai and Perungalathur growth corridors with 100% clear titles.' },
    { title: 'Plots in Trichy | RKS Property Hub', slug: '/plots/trichy', meta_title: 'Plots for Sale in Trichy & Thiruverumbur | RKS Property Hub', meta_description: 'Buy premium plots in Trichy near ring roads and riverfront locations. Clear Patta titles and immediate construction readiness.' },
    { title: 'Plots in Coimbatore | RKS Property Hub', slug: '/plots/coimbatore', meta_title: 'Residential Plots in Coimbatore & Kalapatti | RKS Property Hub', meta_description: 'Invest in elevated plots near Kalapatti IT Corridor in Coimbatore. Gated community amenities and panoramic hill views.' },
    { title: 'Plots in Hosur | RKS Property Hub', slug: '/plots/hosur', meta_title: 'Plots in Hosur Electronic City Corridor | RKS Property Hub', meta_description: 'Strategic plotted land investment along Hosur Road industrial and tech hub. High appreciation potential.' },
    { title: 'Plots in Bangalore Corridor | RKS Property Hub', slug: '/plots/bangalore-corridor', meta_title: 'Plots along Chennai-Bangalore Industrial Highway | RKS Property Hub', meta_description: 'High-yield plotted developments along NH-48 Chennai-Bangalore industrial corridor.' },
    { title: 'About Us | RKS Property Hub', slug: '/about', meta_title: 'About RKS Property Hub | Trusted Real Estate Developers', meta_description: 'Over 15 years of excellence delivering DTCP & RERA verified plots and land across Tamil Nadu with 100% legal transparency.' },
    { title: 'Contact Us | RKS Property Hub', slug: '/contact', meta_title: 'Contact RKS Property Hub | Site Visit & Enquiry Desk', meta_description: 'Get in touch with RKS Property Hub advisors or book a free cab pickup for your property site inspection.' },
    { title: 'Legal & Compliance | RKS Property Hub', slug: '/legal', meta_title: 'Legal Terms & Title Verification | RKS Property Hub', meta_description: 'Our commitment to clear titles, DTCP & RERA layout approvals, Patta documentation, and transparent buyer protections.' }
  ];

  for (const page of cmsPages) {
    await query(
      `INSERT INTO pages (title, slug, meta_title, meta_description, is_published) 
       VALUES ($1, $2, $3, $4, true) 
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description`,
      [page.title, page.slug, page.meta_title, page.meta_description]
    );
  }

  // 10. Mark seed complete
  await query(
    `INSERT INTO system_meta (key, value) VALUES ('seed_completed', 'true') ON CONFLICT (key) DO UPDATE SET value = 'true'`
  );

  console.log('\n====================================');
  console.log('Database initialized successfully!');
  console.log(`Admin: ${adminEmail}`);
  if (generatedPassword) {
    console.log(`Password: ${adminPassword}`);
    console.log('IMPORTANT: Save this password now!');
  }
  console.log('Staff password: rks_staff_2026');
  console.log(`Properties seeded: ${propCount}`);
  console.log('====================================\n');
}
