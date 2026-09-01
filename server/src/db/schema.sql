-- RKS PROPERTY INTELLIGENCE - PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE', -- 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'
  avatar_url TEXT,
  phone VARCHAR(30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'UPCOMING', 'COMPLETED', 'ON_HOLD'
  image_url TEXT,
  total_area_acres NUMERIC(10, 2),
  developer VARCHAR(100) DEFAULT 'RKS Group',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  property_code VARCHAR(50) UNIQUE NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  property_type VARCHAR(50) NOT NULL, -- 'Residential Plot', 'Commercial Plot', 'Villa', 'Apartment', 'Agricultural Land', 'Industrial'
  category VARCHAR(50) DEFAULT 'Standard',
  status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'HOLD', 'UPCOMING', 'DRAFT'
  plot_number VARCHAR(50),
  unit_number VARCHAR(50),
  block VARCHAR(50),
  floor VARCHAR(50),
  survey_number VARCHAR(100),
  approval_number VARCHAR(100),
  area_sqft NUMERIC(14, 2) NOT NULL,
  area_sqm NUMERIC(14, 2),
  rate_per_sqft NUMERIC(14, 2) NOT NULL,
  total_price NUMERIC(16, 2) NOT NULL,
  negotiable BOOLEAN DEFAULT false,
  minimum_price NUMERIC(16, 2),
  registration_charges NUMERIC(14, 2) DEFAULT 0,
  other_charges NUMERIC(14, 2) DEFAULT 0,
  facing VARCHAR(50), -- 'North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'
  road_width VARCHAR(50),
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  ownership VARCHAR(50) DEFAULT 'Freehold',
  broker VARCHAR(100),
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  internal_notes TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  reservation_date TIMESTAMP WITH TIME ZONE,
  sold_date TIMESTAMP WITH TIME ZONE,
  expected_availability VARCHAR(50),
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(150),
  is_primary BOOLEAN DEFAULT false,
  image_type VARCHAR(50) DEFAULT 'PHOTO', -- 'PHOTO', 'FLOOR_PLAN', 'SITE_PLAN', 'LAYOUT', 'LOCATION'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_documents (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  file_url TEXT NOT NULL,
  doc_type VARCHAR(50) DEFAULT 'LEGAL', -- 'LEGAL', 'APPROVAL', 'SALE', 'LAYOUT', 'BROCHURE', 'OTHER'
  file_size VARCHAR(50),
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_history (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'STATUS_CHANGE', 'RATE_CHANGE', 'AREA_CHANGE', 'CREATED', 'UPDATED', 'RESERVED', 'SOLD'
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(100),
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  property_code VARCHAR(50),
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'INLINE_EDIT', 'IMPORT', 'BULK_UPDATE'
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_batches (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  total_rows INTEGER NOT NULL,
  valid_rows INTEGER NOT NULL,
  error_rows INTEGER NOT NULL,
  imported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_visits (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  property_code VARCHAR(50),
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  customer_email VARCHAR(150),
  visit_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL, -- e.g. '10:00 AM - 12:00 PM'
  pickup_required BOOLEAN DEFAULT false,
  pickup_location TEXT,
  attendees_count INTEGER DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED', -- 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'
  notes TEXT,
  assigned_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_agent_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_visitors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  visit_count INTEGER DEFAULT 1,
  last_visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ultra-fast search and filtering
CREATE INDEX IF NOT EXISTS idx_properties_property_code ON properties(property_code);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_location_id ON properties(location_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(total_price);
CREATE INDEX IF NOT EXISTS idx_properties_area ON properties(area_sqft);
CREATE INDEX IF NOT EXISTS idx_properties_rate ON properties(rate_per_sqft);
CREATE INDEX IF NOT EXISTS idx_audit_logs_property_code ON audit_logs(property_code);
CREATE INDEX IF NOT EXISTS idx_property_history_property_id ON property_history(property_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);
CREATE INDEX IF NOT EXISTS idx_customer_visitors_phone ON customer_visitors(phone);
