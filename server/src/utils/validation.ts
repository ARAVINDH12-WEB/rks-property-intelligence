import { z } from 'zod';

export const PropertyStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'SOLD',
  'BLOCKED',
  'HOLD',
  'UPCOMING',
  'DRAFT',
]);

export const PropertyTypeEnum = z.enum([
  'Residential Plot',
  'Commercial Plot',
  'Villa',
  'Apartment',
  'Agricultural Land',
  'Industrial',
  'Independent House',
  'Duplex',
]);

export const CreatePropertySchema = z.object({
  property_code: z.string().min(2, 'Property ID is required').max(50),
  project_id: z.number().int().positive('Valid Project is required'),
  location_id: z.number().int().positive('Valid Location is required'),
  property_type: z.string().min(1, 'Property type is required'),
  category: z.string().optional().default('Standard'),
  status: PropertyStatusEnum.default('AVAILABLE'),
  plot_number: z.string().optional().nullable(),
  unit_number: z.string().optional().nullable(),
  block: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  survey_number: z.string().optional().nullable(),
  approval_number: z.string().optional().nullable(),
  area_sqft: z.number().positive('Area in sq.ft must be greater than 0'),
  rate_per_sqft: z.number().positive('Rate per sq.ft must be greater than 0'),
  total_price: z.number().optional(), // Auto-calculated if omitted
  negotiable: z.boolean().optional().default(false),
  minimum_price: z.number().optional().nullable(),
  registration_charges: z.number().optional().default(0),
  other_charges: z.number().optional().default(0),
  facing: z.string().optional().nullable(),
  road_width: z.string().optional().nullable(),
  bedrooms: z.number().int().min(0).optional().default(0),
  bathrooms: z.number().int().min(0).optional().default(0),
  ownership: z.string().optional().default('Freehold'),
  broker: z.string().optional().nullable(),
  assigned_to: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  images: z.array(z.object({
    url: z.string().url(),
    title: z.string().optional(),
    is_primary: z.boolean().optional(),
    image_type: z.string().optional()
  })).optional(),
  documents: z.array(z.object({
    title: z.string(),
    file_url: z.string(),
    doc_type: z.string().optional(),
    file_size: z.string().optional()
  })).optional()
});

export const UpdatePropertySchema = CreatePropertySchema.partial().extend({
  id: z.number().int().optional(),
});

export const InlineEditSchema = z.object({
  field: z.enum([
    'area_sqft',
    'rate_per_sqft',
    'total_price',
    'status',
    'project_id',
    'location_id',
    'property_type',
    'facing',
    'plot_number',
    'survey_number',
    'negotiable'
  ]),
  value: z.any()
});

export const StatusUpdateSchema = z.object({
  status: PropertyStatusEnum,
  notes: z.string().optional(),
  reservation_date: z.string().optional().nullable(),
  sold_date: z.string().optional().nullable()
});

export const BulkActionSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'Select at least one property'),
  action: z.enum(['STATUS_CHANGE', 'ASSIGN_EMPLOYEE', 'CHANGE_PROJECT', 'ARCHIVE', 'DELETE']),
  value: z.any()
});
