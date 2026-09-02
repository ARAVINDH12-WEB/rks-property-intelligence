import bcrypt from 'bcryptjs';
import { getDb, query } from './index.js';

export async function seedDatabase(force: boolean = false) {
  await getDb();

  // Check if initial seeding already completed to prevent overwriting user deletes/edits
  if (!force) {
    try {
      const metaCheck = await query("SELECT value FROM system_meta WHERE key = 'seed_completed'");
      if (metaCheck.rowCount > 0 && metaCheck.rows[0]?.value === 'true') {
        console.log('ℹ️ Database already seeded. Skipping re-seed to preserve user edits & deletions.');
        return;
      }
    } catch {
      // Table might not exist yet, proceed with seed
    }
  }

  console.log('🌱 Starting database seeding for RKS Property Intelligence...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const managerHash = await bcrypt.hash('manager123', 10);
  const employeeHash = await bcrypt.hash('employee123', 10);
  const viewerHash = await bcrypt.hash('viewer123', 10);

  await query('DELETE FROM audit_logs');
  await query('DELETE FROM property_history');
  await query('DELETE FROM property_documents');
  await query('DELETE FROM property_images');
  await query('DELETE FROM properties');
  await query('DELETE FROM projects');
  await query('DELETE FROM locations');
  await query('DELETE FROM users');
  await query('DELETE FROM site_visits');
  await query('DELETE FROM offers');

  const userAdmin = await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['Rajesh Kumar S (Director)', 'admin@rks.com', passwordHash, 'ADMIN', '+91 98400 11223']
  );
  const adminId = userAdmin.rows[0].id;

  const userManager = await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['Priya Sundaram (Portfolio Manager)', 'manager@rks.com', managerHash, 'MANAGER', '+91 98401 22334']
  );
  const managerId = userManager.rows[0].id;

  const userEmp = await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['Karthik Venkat (Sales Officer)', 'employee@rks.com', employeeHash, 'EMPLOYEE', '+91 98402 33445']
  );
  const empId = userEmp.rows[0].id;

  await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5)`,
    ['Ananya Iyer (Auditor)', 'viewer@rks.com', viewerHash, 'VIEWER', '+91 98403 44556']
  );

  // 2. Create Locations
  const locChennai = await query(
    `INSERT INTO locations (name, city, district, state, pincode, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['OMR - IT Corridor', 'Chennai', 'Chengalpattu', 'Tamil Nadu', '603103', 12.8231, 80.2245]
  );
  const locChennaiId = locChennai.rows[0].id;

  const locGuduvanchery = await query(
    `INSERT INTO locations (name, city, district, state, pincode, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['GST Road - Guduvanchery', 'Chennai', 'Chengalpattu', 'Tamil Nadu', '603202', 12.8439, 80.0631]
  );
  const locGuduvancheryId = locGuduvanchery.rows[0].id;

  const locBangalore = await query(
    `INSERT INTO locations (name, city, district, state, pincode, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Sarjapur Road', 'Bangalore', 'Bengaluru Urban', 'Karnataka', '560035', 12.9121, 77.6845]
  );
  const locBangaloreId = locBangalore.rows[0].id;

  const locDevanahalli = await query(
    `INSERT INTO locations (name, city, district, state, pincode, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Aerospace Park - Devanahalli', 'Bangalore', 'Bengaluru Rural', 'Karnataka', '562110', 13.2425, 77.7126]
  );
  const locDevanahalliId = locDevanahalli.rows[0].id;

  const locHyderabad = await query(
    `INSERT INTO locations (name, city, district, state, pincode, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Financial District - Gachibowli', 'Hyderabad', 'Rangareddy', 'Telangana', '500032', 17.4156, 78.3498]
  );
  const locHyderabadId = locHyderabad.rows[0].id;

  const locCoimbatore = await query(
    `INSERT INTO locations (name, city, district, state, pincode, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Avinashi Road Express Hub', 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '641014', 11.0289, 77.0123]
  );
  const locCoimbatoreId = locCoimbatore.rows[0].id;

  // 3. Create Projects
  const projGreenValley = await query(
    `INSERT INTO projects (name, code, description, location_id, status, image_url, total_area_acres, developer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      'RKS Green Valley',
      'PRJ-GV-01',
      'Premium DTCP & RERA approved gated township with landscaped gardens, 40ft blacktop roads, underground cabling and clubhouse.',
      locGuduvancheryId,
      'ACTIVE',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      45.5,
      'RKS Infra Group'
    ]
  );
  const projGreenValleyId = projGreenValley.rows[0].id;

  const projImperial = await query(
    `INSERT INTO projects (name, code, description, location_id, status, image_url, total_area_acres, developer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      'RKS Imperial Heights',
      'PRJ-IH-02',
      'Ultra luxury residential plots and designer villas facing serene backwaters along OMR with world-class sports arena.',
      locChennaiId,
      'ACTIVE',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
      28.0,
      'RKS Luxury Estates'
    ]
  );
  const projImperialId = projImperial.rows[0].id;

  const projGrandeur = await query(
    `INSERT INTO projects (name, code, description, location_id, status, image_url, total_area_acres, developer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      'RKS Grandeur City',
      'PRJ-GC-03',
      'Tech-corridor integrated lifestyle enclave offering residential villa plots with 100% vaastu compliance in Sarjapur.',
      locBangaloreId,
      'ACTIVE',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
      35.2,
      'RKS Bangalore Properties'
    ]
  );
  const projGrandeurId = projGrandeur.rows[0].id;

  const projSilicon = await query(
    `INSERT INTO projects (name, code, description, location_id, status, image_url, total_area_acres, developer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      'RKS Silicon Meadows',
      'PRJ-SM-04',
      'Exclusive commercial and residential plotted development minutes away from Cyber Towers and Outer Ring Road.',
      locHyderabadId,
      'ACTIVE',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      50.0,
      'RKS Hyderabad Holdings'
    ]
  );
  const projSiliconId = projSilicon.rows[0].id;

  const projEmerald = await query(
    `INSERT INTO projects (name, code, description, location_id, status, image_url, total_area_acres, developer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      'RKS Emerald Palms',
      'PRJ-EP-05',
      'Serene eco-luxury gated community situated along the booming growth corridor of Avinashi Road.',
      locCoimbatoreId,
      'UPCOMING',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
      22.4,
      'RKS Coimbatore Developments'
    ]
  );
  const projEmeraldId = projEmerald.rows[0].id;

  const projSovereign = await query(
    `INSERT INTO projects (name, code, description, location_id, status, image_url, total_area_acres, developer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      'RKS Sovereign Enclave',
      'PRJ-SE-06',
      'High-yield investment plots strategically positioned near Kempegowda International Airport and Aerospace SEZ.',
      locDevanahalliId,
      'ACTIVE',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80',
      60.0,
      'RKS Bangalore Properties'
    ]
  );
  const projSovereignId = projSovereign.rows[0].id;

  // 4. Create 25+ Comprehensive Properties
  const rawProperties = [
    {
      code: 'RKS-00124',
      proj: projGreenValleyId,
      loc: locGuduvancheryId,
      type: 'Residential Plot',
      cat: 'Premium Corner',
      status: 'AVAILABLE',
      plot: 'Plot 124',
      unit: 'U-124',
      block: 'Phase 1 - Blossom',
      floor: 'Ground',
      survey: '142/3B',
      approval: 'DTCP/L/0423/2024',
      area_sqft: 2400,
      rate: 5200,
      facing: 'North-East',
      road_width: '40 ft',
      ownership: 'Freehold',
      desc: 'Prime north-east corner residential plot directly opposite the main central park. 100% Vaastu compliant.',
      lat: 12.8442,
      lng: 80.0635,
      amenities: ['Central Park View', '40ft Road', 'Underground Drainage', '24x7 Water', 'Gated Security'],
      tags: ['Corner Plot', 'Vaastu', 'Park Facing', 'Fast Moving'],
    },
    {
      code: 'RKS-00125',
      proj: projGreenValleyId,
      loc: locGuduvancheryId,
      type: 'Residential Plot',
      cat: 'Standard',
      status: 'AVAILABLE',
      plot: 'Plot 125',
      unit: 'U-125',
      block: 'Phase 1 - Blossom',
      floor: 'Ground',
      survey: '142/3C',
      approval: 'DTCP/L/0423/2024',
      area_sqft: 1800,
      rate: 5100,
      facing: 'East',
      road_width: '30 ft',
      ownership: 'Freehold',
      desc: 'East-facing standard plot on peaceful avenue road with excellent groundwater.',
      lat: 12.8445,
      lng: 80.0638,
      amenities: ['Street Lights', 'Compound Wall', 'Underground Sewage'],
      tags: ['East Facing', 'Immediate Registration'],
    },
    {
      code: 'RKS-00126',
      proj: projGreenValleyId,
      loc: locGuduvancheryId,
      type: 'Residential Plot',
      cat: 'Standard',
      status: 'RESERVED',
      plot: 'Plot 126',
      unit: 'U-126',
      block: 'Phase 1 - Blossom',
      floor: 'Ground',
      survey: '142/4A',
      approval: 'DTCP/L/0423/2024',
      area_sqft: 2000,
      rate: 5150,
      facing: 'North',
      road_width: '30 ft',
      ownership: 'Freehold',
      desc: 'Reserved for Mr. Chandrasekar. Advance token received. Legal scrutiny under progress.',
      lat: 12.8448,
      lng: 80.0641,
      amenities: ['Street Lights', '24x7 Water'],
      tags: ['Reserved', 'Advance Paid'],
    },
    {
      code: 'RKS-00127',
      proj: projGreenValleyId,
      loc: locGuduvancheryId,
      type: 'Residential Plot',
      cat: 'Luxury',
      status: 'SOLD',
      plot: 'Plot 127',
      unit: 'U-127',
      block: 'Phase 1 - Blossom',
      floor: 'Ground',
      survey: '142/4B',
      approval: 'DTCP/L/0423/2024',
      area_sqft: 3600,
      rate: 5300,
      facing: 'East',
      road_width: '40 ft',
      ownership: 'Freehold',
      desc: 'Sold and registered to Dr. Senthil Nathan. Patta transfer completed.',
      lat: 12.8451,
      lng: 80.0645,
      amenities: ['Avenue Trees', 'CCTV Surveillance'],
      tags: ['Sold', 'Registered'],
    },
    {
      code: 'RKS-00128',
      proj: projGreenValleyId,
      loc: locGuduvancheryId,
      type: 'Commercial Plot',
      cat: 'Ultra Luxury Commercial',
      status: 'AVAILABLE',
      plot: 'Comm-01',
      unit: 'CP-01',
      block: 'Commercial Plaza',
      floor: 'Ground',
      survey: '141/1',
      approval: 'DTCP/C/0112/2024',
      area_sqft: 4800,
      rate: 8500,
      facing: 'North',
      road_width: '60 ft Main Road',
      ownership: 'Freehold',
      desc: 'High-visibility commercial frontage plot suitable for departmental store, bank, or diagnostic clinic.',
      lat: 12.8436,
      lng: 80.0628,
      amenities: ['60ft Main Road', 'Commercial Power Line', 'Direct Highway Access'],
      tags: ['Commercial', 'Main Road Frontage', 'High ROI'],
    },
    {
      code: 'RKS-00201',
      proj: projImperialId,
      loc: locChennaiId,
      type: 'Villa',
      cat: 'Ultra Luxury Villa',
      status: 'AVAILABLE',
      plot: 'Villa 01',
      unit: 'V-01',
      block: 'Bayfront Enclave',
      floor: 'G+2',
      survey: '289/1A',
      approval: 'CMDA/REG/098/2023',
      area_sqft: 4200,
      rate: 11500,
      facing: 'East',
      road_width: '50 ft Boulevard',
      bedrooms: 4,
      bathrooms: 5,
      ownership: 'Freehold',
      desc: 'Signature 4BHK triplex villa with private swimming pool, home theater, Italian marble flooring, and smart automation.',
      lat: 12.8235,
      lng: 80.2248,
      amenities: ['Private Pool', 'Home Theater', 'Solar Power', 'Italian Marble', 'Home Elevator'],
      tags: ['Signature Villa', 'Lake View', 'Smart Home'],
    },
    {
      code: 'RKS-00202',
      proj: projImperialId,
      loc: locChennaiId,
      type: 'Villa',
      cat: 'Ultra Luxury Villa',
      status: 'RESERVED',
      plot: 'Villa 02',
      unit: 'V-02',
      block: 'Bayfront Enclave',
      floor: 'G+2',
      survey: '289/1B',
      approval: 'CMDA/REG/098/2023',
      area_sqft: 3800,
      rate: 11200,
      facing: 'North',
      road_width: '40 ft',
      bedrooms: 4,
      bathrooms: 4,
      ownership: 'Freehold',
      desc: 'Exclusive 4BHK architectural masterpiece with landscaped terrace garden.',
      lat: 12.8239,
      lng: 80.2252,
      amenities: ['Terrace Garden', 'EV Charging', 'Smart Lock'],
      tags: ['Reserved', 'OMR Luxury'],
    },
    {
      code: 'RKS-00203',
      proj: projImperialId,
      loc: locChennaiId,
      type: 'Residential Plot',
      cat: 'Premium Waterfront',
      status: 'AVAILABLE',
      plot: 'Plot W-03',
      unit: 'PW-03',
      block: 'Waterfront Boulevard',
      floor: 'Ground',
      survey: '290/2',
      approval: 'CMDA/REG/098/2023',
      area_sqft: 3200,
      rate: 7800,
      facing: 'South-East',
      road_width: '40 ft',
      ownership: 'Freehold',
      desc: 'Waterfront residential plot with unobstructed scenic vistas and pure breeze.',
      lat: 12.8242,
      lng: 80.2258,
      amenities: ['Waterfront Promenade', 'Jogging Track', 'Clubhouse Membership'],
      tags: ['Waterfront', 'Premium Plot'],
    },
    {
      code: 'RKS-00204',
      proj: projImperialId,
      loc: locChennaiId,
      type: 'Apartment',
      cat: 'Luxury Penthouse',
      status: 'AVAILABLE',
      plot: 'Tower Alpha',
      unit: 'PH-1401',
      block: 'Tower A',
      floor: '14th Floor',
      survey: '291/3',
      approval: 'CMDA/REG/098/2023',
      area_sqft: 2850,
      rate: 8900,
      facing: 'North-East',
      road_width: '60 ft',
      bedrooms: 3,
      bathrooms: 4,
      ownership: 'Freehold',
      desc: 'Sky Penthouse with 270-degree panorama of coastline and city skyline. Double-height living room.',
      lat: 12.8245,
      lng: 80.2262,
      amenities: ['Sky Lounge', 'Infinity Pool', '2 Reserved Basements', 'High-Speed Elevators'],
      tags: ['Penthouse', 'Skyline View', 'Sea Breeze'],
    },
    {
      code: 'RKS-00301',
      proj: projGrandeurId,
      loc: locBangaloreId,
      type: 'Residential Plot',
      cat: 'Villa Plot',
      status: 'AVAILABLE',
      plot: 'Plot S-12',
      unit: 'GP-12',
      block: 'Silver Oak Phase',
      floor: 'Ground',
      survey: '84/1',
      approval: 'BMRDA/APA/77/2024',
      area_sqft: 2400,
      rate: 6800,
      facing: 'East',
      road_width: '40 ft',
      ownership: 'Freehold',
      desc: 'Bangalore Sarjapur villa plot close to RGA Tech Park and international schools.',
      lat: 12.9125,
      lng: 77.6849,
      amenities: ['Clubhouse', 'Swimming Pool', 'Underground Utilities', 'Tennis Court'],
      tags: ['Sarjapur', 'BMRDA Approved', 'IT Corridor'],
    },
    {
      code: 'RKS-00302',
      proj: projGrandeurId,
      loc: locBangaloreId,
      type: 'Residential Plot',
      cat: 'Villa Plot',
      status: 'AVAILABLE',
      plot: 'Plot S-14',
      unit: 'GP-14',
      block: 'Silver Oak Phase',
      floor: 'Ground',
      survey: '84/2',
      approval: 'BMRDA/APA/77/2024',
      area_sqft: 1500,
      rate: 6750,
      facing: 'North',
      road_width: '30 ft',
      ownership: 'Freehold',
      desc: 'Compact luxury villa plot, highly optimal for young tech professionals building custom villas.',
      lat: 12.9129,
      lng: 77.6853,
      amenities: ['Children Play Area', 'Piped Gas Line', '24x7 Security'],
      tags: ['Affordable Luxury', 'High Rental Demand'],
    },
    {
      code: 'RKS-00303',
      proj: projGrandeurId,
      loc: locBangaloreId,
      type: 'Residential Plot',
      cat: 'Park Facing Corner',
      status: 'BLOCKED',
      plot: 'Plot S-15',
      unit: 'GP-15',
      block: 'Silver Oak Phase',
      floor: 'Ground',
      survey: '84/3',
      approval: 'BMRDA/APA/77/2024',
      area_sqft: 3000,
      rate: 7200,
      facing: 'North-East',
      road_width: '50 ft Corner',
      ownership: 'Freehold',
      desc: 'Blocked temporarily by corporate management for upcoming partner allocation.',
      lat: 12.9133,
      lng: 77.6857,
      amenities: ['Park View', 'Dual Access Road'],
      tags: ['Management Block', 'Corner'],
    },
    {
      code: 'RKS-00304',
      proj: projGrandeurId,
      loc: locBangaloreId,
      type: 'Villa',
      cat: 'Custom Built Villa',
      status: 'SOLD',
      plot: 'Villa Grand-08',
      unit: 'GV-08',
      block: 'Emerald Row',
      floor: 'G+1',
      survey: '85/1',
      approval: 'BMRDA/APA/77/2024',
      area_sqft: 3400,
      rate: 9800,
      facing: 'East',
      road_width: '40 ft',
      bedrooms: 4,
      bathrooms: 4,
      ownership: 'Freehold',
      desc: 'Contemporary 4BHK villa handed over to senior VP at Infosys.',
      lat: 12.9137,
      lng: 77.6861,
      amenities: ['Private Garden', 'Modular Kitchen', 'Solar Water'],
      tags: ['Sold', 'Occupied'],
    },
    {
      code: 'RKS-00401',
      proj: projSiliconId,
      loc: locHyderabadId,
      type: 'Commercial Plot',
      cat: 'Corporate Grade',
      status: 'AVAILABLE',
      plot: 'Tech Plot 01',
      unit: 'TP-01',
      block: 'IT Zone A',
      floor: 'Ground',
      survey: '112/A',
      approval: 'HMDA/PL/554/2023',
      area_sqft: 10890, // 0.25 Acre / 10 Guntas
      rate: 12500,
      facing: 'North',
      road_width: '100 ft Main Arterial',
      ownership: 'Freehold',
      desc: 'High-density commercial IT plot with FAR 4.0 approval. Right next to Financial District ORR junction.',
      lat: 17.4162,
      lng: 78.3502,
      amenities: ['100ft Road', 'High-Tension Power', 'Fiber Grid', 'Helipad Access'],
      tags: ['Commercial', 'High FAR', 'Corporate HQ'],
    },
    {
      code: 'RKS-00402',
      proj: projSiliconId,
      loc: locHyderabadId,
      type: 'Residential Plot',
      cat: 'Gated Township',
      status: 'AVAILABLE',
      plot: 'Plot H-45',
      unit: 'SM-45',
      block: 'Boulevard North',
      floor: 'Ground',
      survey: '114/2',
      approval: 'HMDA/PL/554/2023',
      area_sqft: 2700,
      rate: 7400,
      facing: 'East',
      road_width: '40 ft',
      ownership: 'Freehold',
      desc: 'Prime 300 Sq.Yards villa plot in premium gated layout with grand clubhouse.',
      lat: 17.4168,
      lng: 78.3510,
      amenities: ['Grand Clubhouse', 'Tennis Court', 'Underground Cabling'],
      tags: ['HMDA Approved', 'East Facing'],
    },
    {
      code: 'RKS-00403',
      proj: projSiliconId,
      loc: locHyderabadId,
      type: 'Residential Plot',
      cat: 'Standard',
      status: 'HOLD',
      plot: 'Plot H-46',
      unit: 'SM-46',
      block: 'Boulevard North',
      floor: 'Ground',
      survey: '114/3',
      approval: 'HMDA/PL/554/2023',
      area_sqft: 2250,
      rate: 7300,
      facing: 'West',
      road_width: '30 ft',
      ownership: 'Freehold',
      desc: 'Placed on 7-day administrative hold for banking verification.',
      lat: 17.4172,
      lng: 78.3515,
      amenities: ['Street Lights', '24x7 Water'],
      tags: ['Bank Hold', 'Under Verification'],
    },
    {
      code: 'RKS-00501',
      proj: projEmeraldId,
      loc: locCoimbatoreId,
      type: 'Residential Plot',
      cat: 'Eco Luxury',
      status: 'UPCOMING',
      plot: 'Plot EP-01',
      unit: 'EP-01',
      block: 'Pre-launch Enclave',
      floor: 'Ground',
      survey: '302/1',
      approval: 'LPA/CBE/2024/09',
      area_sqft: 2400,
      rate: 4200,
      facing: 'North-East',
      road_width: '40 ft',
      ownership: 'Freehold',
      desc: 'Upcoming pre-launch pricing on Avinashi road corridor. Expressions of interest invited.',
      lat: 11.0294,
      lng: 77.0128,
      amenities: ['Organic Farm', 'Solar Lighting', 'Recreational Park'],
      tags: ['Pre-Launch', 'Early Bird Offer', 'Coimbatore'],
    },
    {
      code: 'RKS-00502',
      proj: projEmeraldId,
      loc: locCoimbatoreId,
      type: 'Residential Plot',
      cat: 'Eco Luxury',
      status: 'UPCOMING',
      plot: 'Plot EP-02',
      unit: 'EP-02',
      block: 'Pre-launch Enclave',
      floor: 'Ground',
      survey: '302/2',
      approval: 'LPA/CBE/2024/09',
      area_sqft: 3600,
      rate: 4150,
      facing: 'North',
      road_width: '40 ft',
      ownership: 'Freehold',
      desc: 'Spacious 3,600 sq.ft estate plot with organic tree plantation.',
      lat: 11.0298,
      lng: 77.0134,
      amenities: ['Rainwater Harvesting', 'Walking Trail'],
      tags: ['Pre-Launch', 'Large Plot'],
    },
    {
      code: 'RKS-00601',
      proj: projSovereignId,
      loc: locDevanahalliId,
      type: 'Industrial',
      cat: 'Aerospace Logistics',
      status: 'AVAILABLE',
      plot: 'Logistics Bay 01',
      unit: 'LB-01',
      block: 'Aero Cargo Zone',
      floor: 'Ground',
      survey: '65/2A',
      approval: 'KIADB/IND/992/2024',
      area_sqft: 21780, // 0.5 Acre
      rate: 3800,
      facing: 'North',
      road_width: '80 ft Heavy Vehicle Road',
      ownership: 'Freehold',
      desc: 'Industrial / Warehousing plot positioned adjacent to Bangalore Airport Cargo Gate.',
      lat: 13.2431,
      lng: 77.7132,
      amenities: ['80ft Container Road', 'Heavy Power Substation', 'Water Supply Line'],
      tags: ['Industrial', 'Airport Cargo', 'High Logistics Value'],
    },
    {
      code: 'RKS-00602',
      proj: projSovereignId,
      loc: locDevanahalliId,
      type: 'Residential Plot',
      cat: 'Airport City Enclave',
      status: 'AVAILABLE',
      plot: 'Plot AC-22',
      unit: 'AC-22',
      block: 'Phase 2 - Skyview',
      floor: 'Ground',
      survey: '67/1',
      approval: 'BIAAPA/TP/112/2024',
      area_sqft: 1500,
      rate: 4600,
      facing: 'East',
      road_width: '30 ft',
      ownership: 'Freehold',
      desc: 'High-growth investment plot near proposed Devanahalli Metro terminus.',
      lat: 13.2436,
      lng: 77.7139,
      amenities: ['Metro Proximity', 'Children Park', '24x7 Security'],
      tags: ['High Growth', 'Metro Route', 'Devanahalli'],
    },
    {
      code: 'RKS-00603',
      proj: projSovereignId,
      loc: locDevanahalliId,
      type: 'Residential Plot',
      cat: 'Airport City Enclave',
      status: 'RESERVED',
      plot: 'Plot AC-23',
      unit: 'AC-23',
      block: 'Phase 2 - Skyview',
      floor: 'Ground',
      survey: '67/2',
      approval: 'BIAAPA/TP/112/2024',
      area_sqft: 1800,
      rate: 4600,
      facing: 'East',
      road_width: '30 ft',
      ownership: 'Freehold',
      desc: 'Booked by NRI investor from Singapore. Registration scheduled for next month.',
      lat: 13.2440,
      lng: 77.7145,
      amenities: ['Street Lighting', 'Water Connection'],
      tags: ['NRI Booking', 'Reserved'],
    },
    {
      code: 'RKS-00129',
      proj: projGreenValleyId,
      loc: locGuduvancheryId,
      type: 'Residential Plot',
      cat: 'Standard',
      status: 'AVAILABLE',
      plot: 'Plot 129',
      unit: 'U-129',
      block: 'Phase 1 - Blossom',
      floor: 'Ground',
      survey: '143/1',
      approval: 'DTCP/L/0423/2024',
      area_sqft: 1200,
      rate: 5100,
      facing: 'South',
      road_width: '30 ft',
      ownership: 'Freehold',
      desc: 'Budget-friendly 1,200 sq.ft plot with instant approval for bank loans (SBI, HDFC).',
      lat: 12.8455,
      lng: 80.0650,
      amenities: ['Bank Approved', 'Blacktop Road'],
      tags: ['Budget Friendly', 'SBI Approved'],
    },
    {
      code: 'RKS-00130',
      proj: projGreenValleyId,
      loc: locGuduvancheryId,
      type: 'Residential Plot',
      cat: 'Premium',
      status: 'AVAILABLE',
      plot: 'Plot 130',
      unit: 'U-130',
      block: 'Phase 2 - Meadows',
      floor: 'Ground',
      survey: '143/2',
      approval: 'DTCP/L/0423/2024',
      area_sqft: 2400,
      rate: 5250,
      facing: 'North',
      road_width: '40 ft',
      ownership: 'Freehold',
      desc: 'Facing landscaped meditation pavilion. Quiet neighborhood environment.',
      lat: 12.8459,
      lng: 80.0654,
      amenities: ['Meditation Pavilion', 'Avenue Plantations'],
      tags: ['Peaceful Living', 'North Facing'],
    },
    {
      code: 'RKS-00205',
      proj: projImperialId,
      loc: locChennaiId,
      type: 'Apartment',
      cat: 'Luxury Residence',
      status: 'AVAILABLE',
      plot: 'Tower Beta',
      unit: 'B-0402',
      block: 'Tower B',
      floor: '4th Floor',
      survey: '291/4',
      approval: 'CMDA/REG/098/2023',
      area_sqft: 1950,
      rate: 8200,
      facing: 'East',
      road_width: '50 ft',
      bedrooms: 3,
      bathrooms: 3,
      ownership: 'Freehold',
      desc: 'Spacious 3BHK premium apartment with modular kitchen and 2 car parkings.',
      lat: 12.8250,
      lng: 80.2268,
      amenities: ['Gymnasium', 'Covered Parking', 'Power Backup'],
      tags: ['3BHK', 'Ready to Move', 'OMR'],
    }
  ];

  for (const item of rawProperties) {
    const areaSqm = Number((item.area_sqft * 0.092903).toFixed(2));
    const totalPrice = item.area_sqft * item.rate;

    const propResult = await query(
      `INSERT INTO properties (
        property_code, project_id, location_id, property_type, category, status,
        plot_number, unit_number, block, floor, survey_number, approval_number,
        area_sqft, area_sqm, rate_per_sqft, total_price, negotiable, minimum_price,
        registration_charges, other_charges, facing, road_width, bedrooms, bathrooms,
        ownership, description, latitude, longitude, amenities, tags,
        assigned_to, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30,
        $31, $32, $33
      ) RETURNING id`,
      [
        item.code, item.proj, item.loc, item.type, item.cat, item.status,
        item.plot, item.unit, item.block, item.floor, item.survey, item.approval,
        item.area_sqft, areaSqm, item.rate, totalPrice, true, totalPrice * 0.95,
        totalPrice * 0.07, 50000, item.facing, item.road_width, item.bedrooms || 0, item.bathrooms || 0,
        item.ownership, item.desc, item.lat, item.lng, item.amenities, item.tags,
        empId, adminId, adminId
      ]
    );

    const propId = propResult.rows[0].id;

    // Add Primary image
    await query(
      `INSERT INTO property_images (property_id, url, title, is_primary, image_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        propId,
        item.type === 'Villa'
          ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80'
          : item.type === 'Apartment'
          ? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'
          : item.type === 'Commercial Plot'
          ? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
        `${item.code} Site View`,
        true,
        'PHOTO'
      ]
    );

    // Add layout image
    await query(
      `INSERT INTO property_images (property_id, url, title, is_primary, image_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        propId,
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
        `${item.code} Master Layout`,
        false,
        'LAYOUT'
      ]
    );

    // Add initial document
    await query(
      `INSERT INTO property_documents (property_id, title, file_url, doc_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        propId,
        `${item.code} Approval & Title Deed`,
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'APPROVAL',
        '2.4 MB',
        adminId
      ]
    );

    // Add creation history
    await query(
      `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        propId,
        'CREATED',
        null,
        item.status,
        `Property ${item.code} registered into RKS inventory at ₹${item.rate}/sq.ft.`,
        adminId
      ]
    );

    // Add creation audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, field_name, old_value, new_value, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        adminId,
        'Rajesh Kumar S (Director)',
        'PROPERTY',
        propId,
        item.code,
        'CREATE',
        'INVENTORY',
        null,
        item.status,
        `Added property ${item.code} to project with area ${item.area_sqft} sq.ft.`
      ]
    );
  }

  // 5. Seed Sample Site Visits
  await query('DELETE FROM site_visits');
  const samplePropRes = await query('SELECT id, property_code FROM properties LIMIT 4');
  const p1 = samplePropRes.rows[0];
  const p2 = samplePropRes.rows[1];
  const p3 = samplePropRes.rows[2];

  await query(
    `INSERT INTO site_visits (
      property_id, property_code, customer_name, customer_phone, customer_email,
      visit_date, time_slot, pickup_required, pickup_location, attendees_count,
      status, notes, assigned_agent_id, assigned_agent_name
    ) VALUES
    ($1, $2, 'Dr. Anand Ramanathan', '+91 98410 44556', 'anand.raman@gmail.com', CURRENT_DATE, '10:00 AM - 12:00 PM', true, 'Adyar Gandhi Nagar, Chennai', 3, 'CONFIRMED', 'Interested in corner villa plot for immediate construction', $3, 'Karthik Venkat (Sales Officer)'),
    ($4, $5, 'Meera Krishnan', '+91 98840 77889', 'meera.k@outlook.com', CURRENT_DATE + INTERVAL '1 day', '02:00 PM - 04:00 PM', false, null, 2, 'REQUESTED', 'Looking for East-facing layout with clear patta', $3, 'Karthik Venkat (Sales Officer)'),
    ($6, $7, 'Suresh Babu', '+91 99400 33221', 'suresh.babu@tcs.com', CURRENT_DATE + INTERVAL '2 days', '04:00 PM - 06:00 PM', true, 'OMR Sholinganallur Junction', 4, 'REQUESTED', 'Family visit. Require site layout blueprint.', null, null)`,
    [p1?.id, p1?.property_code, empId, p2?.id, p2?.property_code, p3?.id, p3?.property_code]
  );

  // 6. Seed Sample Promotional Offers
  await query(
    `INSERT INTO offers (
      title, description, discount_type, discount_value, start_date, end_date,
      is_active, applicable_properties, banner_image_url, terms_conditions, created_by
    ) VALUES
    (
      'Festival Monsoon Bonanza 2026',
      'Exclusive 10% instant price waiver on all premium villa & residential plots in OMR and ECR corridors. Includes complimentary legal documentation.',
      'PERCENTAGE',
      '10% OFF',
      CURRENT_DATE - INTERVAL '5 days',
      CURRENT_DATE + INTERVAL '25 days',
      true,
      'OMR-IT Corridor, ECR-Kovalam',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
      'Valid for bookings confirmed before the expiry date with minimum 20% advance token.',
      $1
    ),
    (
      'Early Bird Township Launch Special',
      'Zero Registration Charges & Free Patta Transfer on new layout phase releases in Guduvanchery & Tambaram West.',
      'FIXED_AMOUNT',
      'Free Registration (Save ₹1,50,000)',
      CURRENT_DATE - INTERVAL '2 days',
      CURRENT_DATE + INTERVAL '15 days',
      true,
      'Guduvanchery Township, Tambaram West',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
      'Applicable on first 10 unit bookings per project layout.',
      $1
    ),
    (
      'New Year Grand Preview Discount',
      'Flat cash discount on East-facing corner plots across all Chennai locations.',
      'FIXED_AMOUNT',
      '₹1,00,000 Flat Rebate',
      CURRENT_DATE - INTERVAL '40 days',
      CURRENT_DATE - INTERVAL '10 days',
      true,
      'ALL',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
      'Campaign concluded successfully. Kept for internal performance review.',
      $1
    )`,
    [adminId]
  );

  // 7. Mark seed as completed in system_meta
  await query(
    `INSERT INTO system_meta (key, value)
     VALUES ('seed_completed', 'true')
     ON CONFLICT (key) DO UPDATE SET value = 'true'`
  );

  console.log(`✅ Successfully seeded ${rawProperties.length} realistic properties, 6 projects, 6 locations, 4 role accounts, 3 promotional offers, and sample site visits into PostgreSQL!`);
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
