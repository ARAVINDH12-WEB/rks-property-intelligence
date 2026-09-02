export type PropertyStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'BLOCKED'
  | 'HOLD'
  | 'UPCOMING'
  | 'DRAFT';

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
}

export interface AreaConversions {
  sqft: number;
  sqm: number;
  acres: number;
  cents: number;
  grounds: number;
  guntas: number;
}

export interface PropertyImage {
  id?: number;
  property_id?: number;
  url: string;
  title?: string;
  is_primary?: boolean;
  image_type?: 'PHOTO' | 'FLOOR_PLAN' | 'SITE_PLAN' | 'LAYOUT' | 'LOCATION';
}

export interface PropertyDocument {
  id?: number;
  property_id?: number;
  title: string;
  file_url: string;
  doc_type?: 'LEGAL' | 'APPROVAL' | 'SALE' | 'LAYOUT' | 'BROCHURE' | 'OTHER';
  file_size?: string;
  created_at?: string;
}

export interface PropertyHistoryItem {
  id: number;
  property_id: number;
  event_type: string;
  old_value?: string;
  new_value?: string;
  description: string;
  changed_by?: number;
  changed_by_name?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_name?: string;
  entity_type: string;
  entity_id?: number;
  property_code?: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  details?: string;
  created_at: string;
}

export interface SiteVisit {
  id: number;
  property_id?: number;
  property_code?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  visit_date: string;
  time_slot: string;
  pickup_required?: boolean;
  pickup_location?: string;
  cab_required?: boolean;
  pickup_address?: string;
  special_requests?: string;
  attendees_count: number;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
  assigned_agent_id?: number;
  assigned_agent_name?: string;
  project_name?: string;
  city?: string;
  location_name?: string;
  plot_number?: string;
  area_sqft?: number;
  rate_per_sqft?: number;
  total_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: number;
  property_code: string;
  project_id: number;
  project_name?: string;
  project_code?: string;
  location_id: number;
  location_name?: string;
  city?: string;
  state?: string;
  property_type: string;
  category: string;
  status: PropertyStatus;
  plot_number?: string;
  unit_number?: string;
  block?: string;
  floor?: string;
  survey_number?: string;
  approval_number?: string;
  area_sqft: number;
  area_sqm?: number;
  rate_per_sqft: number;
  total_price: number;
  negotiable?: boolean;
  minimum_price?: number;
  registration_charges?: number;
  other_charges?: number;
  facing?: string;
  road_width?: string;
  bedrooms?: number;
  bathrooms?: number;
  ownership?: string;
  broker?: string;
  assigned_to?: number;
  assigned_user_name?: string;
  assigned_user_email?: string;
  description?: string;
  internal_notes?: string;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  tags?: string[];
  reservation_date?: string;
  sold_date?: string;
  expected_availability?: string;
  archived?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  created_by_name?: string;
  updated_by?: number;
  updated_by_name?: string;
  primary_image_url?: string;
  conversions?: AreaConversions;
  images?: PropertyImage[];
  documents?: PropertyDocument[];
  history?: PropertyHistoryItem[];
  audit_logs?: AuditLogItem[];
  similar_properties?: Partial<Property>[];
}

export interface Project {
  id: number;
  name: string;
  code: string;
  description?: string;
  location_id?: number;
  location_name?: string;
  city?: string;
  state?: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ON_HOLD';
  image_url?: string;
  total_area_acres?: number;
  developer?: string;
  total_properties?: number;
  available_properties?: number;
  reserved_properties?: number;
  sold_properties?: number;
  upcoming_properties?: number;
  total_inventory_value?: number;
  average_rate?: number;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  city: string;
  district?: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  total_properties?: number;
  available_properties?: number;
  reserved_properties?: number;
  sold_properties?: number;
  total_inventory_value?: number;
  average_rate?: number;
  created_at: string;
}

export interface PropertyFilterParams {
  q?: string;
  status?: string;
  property_type?: string;
  project_id?: string;
  location_id?: string;
  min_area?: number;
  max_area?: number;
  min_rate?: number;
  max_rate?: number;
  min_price?: number;
  max_price?: number;
  facing?: string;
  assigned_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_archived?: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Offer {
  id: number;
  title: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'SPECIAL_RATE' | 'PACKAGE';
  discount_value: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  applicable_properties?: string;
  banner_image_url?: string;
  terms_conditions?: string;
  created_by?: number;
  created_by_name?: string;
  calculated_status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SCHEDULED';
  created_at: string;
  updated_at: string;
}

