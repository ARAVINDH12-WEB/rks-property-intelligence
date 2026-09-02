import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import { calculateAreaConversions, calculateTotalPrice } from '../utils/calculations.js';
import {
  CreatePropertySchema,
  UpdatePropertySchema,
  InlineEditSchema,
  StatusUpdateSchema,
  BulkActionSchema,
} from '../utils/validation.js';

const router = Router();

// GET /api/properties - High-Performance Search, Filter, Sort & Paginate
router.get('/', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    const {
      q,
      status,
      property_type,
      project_id,
      location_id,
      min_area,
      max_area,
      min_rate,
      max_rate,
      min_price,
      max_price,
      facing,
      assigned_to,
      include_archived,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    // Archive check
    if (include_archived === 'true') {
      // include all
    } else {
      conditions.push(`p.archived = false`);
    }

    // Global Omnisearch (Property ID, Project, Location, Plot, Survey, Type, Status)
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(`(
        p.property_code ILIKE $${paramIdx} OR
        p.plot_number ILIKE $${paramIdx} OR
        p.survey_number ILIKE $${paramIdx} OR
        p.unit_number ILIKE $${paramIdx} OR
        p.property_type ILIKE $${paramIdx} OR
        p.status ILIKE $${paramIdx} OR
        prj.name ILIKE $${paramIdx} OR
        loc.city ILIKE $${paramIdx} OR
        loc.name ILIKE $${paramIdx}
      )`);
      params.push(searchTerm);
      paramIdx++;
    }

    // Status filter (single or comma-separated)
    if (status && typeof status === 'string' && status !== 'ALL') {
      const statuses = status.split(',').map((s) => s.trim().toUpperCase());
      if (statuses.length === 1) {
        conditions.push(`p.status = $${paramIdx}`);
        params.push(statuses[0]);
        paramIdx++;
      } else {
        const placeholders = statuses.map((_, i) => `$${paramIdx + i}`).join(', ');
        conditions.push(`p.status IN (${placeholders})`);
        params.push(...statuses);
        paramIdx += statuses.length;
      }
    }

    // Property Type
    if (property_type && typeof property_type === 'string' && property_type !== 'ALL') {
      conditions.push(`p.property_type = $${paramIdx}`);
      params.push(property_type);
      paramIdx++;
    }

    // Project
    if (project_id && project_id !== 'ALL') {
      conditions.push(`p.project_id = $${paramIdx}`);
      params.push(parseInt(project_id as string));
      paramIdx++;
    }

    // Location
    if (location_id && location_id !== 'ALL') {
      conditions.push(`p.location_id = $${paramIdx}`);
      params.push(parseInt(location_id as string));
      paramIdx++;
    }

    // Area range
    if (min_area) {
      conditions.push(`p.area_sqft >= $${paramIdx}`);
      params.push(Number(min_area));
      paramIdx++;
    }
    if (max_area) {
      conditions.push(`p.area_sqft <= $${paramIdx}`);
      params.push(Number(max_area));
      paramIdx++;
    }

    // Rate range
    if (min_rate) {
      conditions.push(`p.rate_per_sqft >= $${paramIdx}`);
      params.push(Number(min_rate));
      paramIdx++;
    }
    if (max_rate) {
      conditions.push(`p.rate_per_sqft <= $${paramIdx}`);
      params.push(Number(max_rate));
      paramIdx++;
    }

    // Total Price range
    if (min_price) {
      conditions.push(`p.total_price >= $${paramIdx}`);
      params.push(Number(min_price));
      paramIdx++;
    }
    if (max_price) {
      conditions.push(`p.total_price <= $${paramIdx}`);
      params.push(Number(max_price));
      paramIdx++;
    }

    // Facing
    if (facing && typeof facing === 'string' && facing !== 'ALL') {
      conditions.push(`p.facing = $${paramIdx}`);
      params.push(facing);
      paramIdx++;
    }

    // Assigned Employee
    if (assigned_to && assigned_to !== 'ALL') {
      conditions.push(`p.assigned_to = $${paramIdx}`);
      params.push(parseInt(assigned_to as string));
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    const sortFieldMap: Record<string, string> = {
      property_code: 'p.property_code',
      area_sqft: 'p.area_sqft',
      rate_per_sqft: 'p.rate_per_sqft',
      total_price: 'p.total_price',
      status: 'p.status',
      created_at: 'p.created_at',
      updated_at: 'p.updated_at',
      project_name: 'prj.name',
      location_name: 'loc.name',
    };

    const validatedSortField = sortFieldMap[sort_by as string] || 'p.created_at';
    const validatedSortOrder = String(sort_order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // 1. Total Count Query
    const countSql = `
      SELECT COUNT(*)::int as total
      FROM properties p
      LEFT JOIN projects prj ON p.project_id = prj.id
      LEFT JOIN locations loc ON p.location_id = loc.id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    // 2. Data Fetch Query with Primary Image & User info
    const dataSql = `
      SELECT
        p.*,
        prj.name as project_name,
        prj.code as project_code,
        loc.name as location_name,
        loc.city as city,
        loc.state as state,
        u_assigned.name as assigned_user_name,
        u_updated.name as updated_by_name,
        (
          SELECT url FROM property_images pi
          WHERE pi.property_id = p.id
          ORDER BY pi.is_primary DESC, pi.id ASC
          LIMIT 1
        ) as primary_image_url
      FROM properties p
      LEFT JOIN projects prj ON p.project_id = prj.id
      LEFT JOIN locations loc ON p.location_id = loc.id
      LEFT JOIN users u_assigned ON p.assigned_to = u_assigned.id
      LEFT JOIN users u_updated ON p.updated_by = u_updated.id
      ${whereClause}
      ORDER BY ${validatedSortField} ${validatedSortOrder}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const dataParams = [...params, limit, offset];
    const dataResult = await query(dataSql, dataParams);

    res.json({
      properties: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties inventory' });
  }
});

// GET /api/properties/:id - Comprehensive Property Details
router.get('/:id', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid property ID' });
      return;
    }

    const propResult = await query(
      `SELECT
        p.*,
        prj.name as project_name,
        prj.code as project_code,
        prj.description as project_description,
        loc.name as location_name,
        loc.city as city,
        loc.district as district,
        loc.state as state,
        loc.pincode as pincode,
        u_assigned.name as assigned_user_name,
        u_assigned.email as assigned_user_email,
        u_created.name as created_by_name,
        u_updated.name as updated_by_name
      FROM properties p
      LEFT JOIN projects prj ON p.project_id = prj.id
      LEFT JOIN locations loc ON p.location_id = loc.id
      LEFT JOIN users u_assigned ON p.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON p.created_by = u_created.id
      LEFT JOIN users u_updated ON p.updated_by = u_updated.id
      WHERE p.id = $1`,
      [id]
    );

    if (propResult.rowCount === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const property = propResult.rows[0];

    // Fetch Images
    const imagesResult = await query(
      `SELECT * FROM property_images WHERE property_id = $1 ORDER BY is_primary DESC, sort_order ASC, id ASC`,
      [id]
    );

    // Fetch Documents
    const documentsResult = await query(
      `SELECT * FROM property_documents WHERE property_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    // Fetch Timeline / History
    const historyResult = await query(
      `SELECT ph.*, u.name as changed_by_name
       FROM property_history ph
       LEFT JOIN users u ON ph.changed_by = u.id
       WHERE ph.property_id = $1
       ORDER BY ph.created_at DESC`,
      [id]
    );

    // Fetch Audit Logs
    const auditResult = await query(
      `SELECT * FROM audit_logs WHERE property_code = $1 ORDER BY created_at DESC LIMIT 50`,
      [property.property_code]
    );

    // Fetch Similar / Nearby Properties in same project
    const similarResult = await query(
      `SELECT id, property_code, area_sqft, rate_per_sqft, total_price, status, property_type
       FROM properties
       WHERE project_id = $1 AND id != $2 AND archived = false
       LIMIT 5`,
      [property.project_id, id]
    );

    const conversions = calculateAreaConversions(Number(property.area_sqft));

    res.json({
      property: {
        ...property,
        conversions,
        images: imagesResult.rows,
        documents: documentsResult.rows,
        history: historyResult.rows,
        audit_logs: auditResult.rows,
        similar_properties: similarResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ error: 'Failed to fetch property details' });
  }
});

// POST /api/properties - Create Property
router.post('/', authenticate, requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = CreatePropertySchema.parse(req.body);

    // Auto-calculate values
    const areaSqft = Number(validated.area_sqft);
    const ratePerSqft = Number(validated.rate_per_sqft);
    const totalPrice = validated.total_price || calculateTotalPrice(areaSqft, ratePerSqft);
    const areaSqm = Number((areaSqft * 0.092903).toFixed(2));

    // Check duplicate property code
    const existing = await query('SELECT id FROM properties WHERE LOWER(property_code) = LOWER($1)', [validated.property_code.trim()]);
    if (existing.rowCount > 0) {
      res.status(400).json({ error: `Property ID '${validated.property_code}' already exists.` });
      return;
    }

    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'System User';

    const insertResult = await query(
      `INSERT INTO properties (
        property_code, project_id, location_id, property_type, category, status,
        plot_number, unit_number, block, floor, survey_number, approval_number,
        area_sqft, area_sqm, rate_per_sqft, total_price, negotiable, minimum_price,
        registration_charges, other_charges, facing, road_width, bedrooms, bathrooms,
        ownership, broker, assigned_to, description, internal_notes,
        latitude, longitude, amenities, tags, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34, $35
      ) RETURNING *`,
      [
        validated.property_code.trim().toUpperCase(),
        validated.project_id,
        validated.location_id,
        validated.property_type,
        validated.category || 'Standard',
        validated.status || 'AVAILABLE',
        validated.plot_number || null,
        validated.unit_number || null,
        validated.block || null,
        validated.floor || null,
        validated.survey_number || null,
        validated.approval_number || null,
        areaSqft,
        areaSqm,
        ratePerSqft,
        totalPrice,
        validated.negotiable || false,
        validated.minimum_price || null,
        validated.registration_charges || 0,
        validated.other_charges || 0,
        validated.facing || null,
        validated.road_width || null,
        validated.bedrooms || 0,
        validated.bathrooms || 0,
        validated.ownership || 'Freehold',
        validated.broker || null,
        validated.assigned_to || null,
        validated.description || null,
        validated.internal_notes || null,
        validated.latitude || null,
        validated.longitude || null,
        validated.amenities || [],
        validated.tags || [],
        userId,
        userId,
      ]
    );

    const newProperty = insertResult.rows[0];

    // Add Images if provided
    if (validated.images && validated.images.length > 0) {
      for (const img of validated.images) {
        await query(
          `INSERT INTO property_images (property_id, url, title, is_primary, image_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [newProperty.id, img.url, img.title || 'Image', img.is_primary || false, img.image_type || 'PHOTO']
        );
      }
    } else {
      // Default placeholder image
      await query(
        `INSERT INTO property_images (property_id, url, title, is_primary, image_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          newProperty.id,
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
          'Primary Site Image',
          true,
          'PHOTO'
        ]
      );
    }

    // Add Documents if provided
    if (validated.documents && validated.documents.length > 0) {
      for (const doc of validated.documents) {
        await query(
          `INSERT INTO property_documents (property_id, title, file_url, doc_type, file_size, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newProperty.id, doc.title, doc.file_url, doc.doc_type || 'OTHER', doc.file_size || '1.0 MB', userId]
        );
      }
    }

    // Log History
    await query(
      `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        newProperty.id,
        'CREATED',
        null,
        newProperty.status,
        `Property ${newProperty.property_code} created by ${userName} at ₹${ratePerSqft}/sq.ft.`,
        userId,
      ]
    );

    // Audit Log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, field_name, old_value, new_value, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        userName,
        'PROPERTY',
        newProperty.id,
        newProperty.property_code,
        'CREATE',
        'INVENTORY',
        null,
        newProperty.status,
        `Created property ${newProperty.property_code} with area ${areaSqft} sq.ft and rate ₹${ratePerSqft}/sq.ft.`,
      ]
    );

    res.status(201).json({
      message: 'Property created successfully',
      property: newProperty,
    });
  } catch (error: any) {
    console.error('Error creating property:', error);
    res.status(400).json({ error: error.message || 'Failed to create property' });
  }
});

// PUT /api/properties/:id - Full Update Property
router.put('/:id', authenticate, requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const existingRes = await query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const current = existingRes.rows[0];
    const validated = UpdatePropertySchema.parse(req.body);

    const areaSqft = validated.area_sqft !== undefined ? Number(validated.area_sqft) : Number(current.area_sqft);
    const ratePerSqft = validated.rate_per_sqft !== undefined ? Number(validated.rate_per_sqft) : Number(current.rate_per_sqft);
    const totalPrice = validated.total_price !== undefined ? Number(validated.total_price) : calculateTotalPrice(areaSqft, ratePerSqft);
    const areaSqm = Number((areaSqft * 0.092903).toFixed(2));

    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'System User';

    const updateRes = await query(
      `UPDATE properties SET
        property_code = COALESCE($1, property_code),
        project_id = COALESCE($2, project_id),
        location_id = COALESCE($3, location_id),
        property_type = COALESCE($4, property_type),
        category = COALESCE($5, category),
        status = COALESCE($6, status),
        plot_number = $7,
        unit_number = $8,
        block = $9,
        floor = $10,
        survey_number = $11,
        approval_number = $12,
        area_sqft = $13,
        area_sqm = $14,
        rate_per_sqft = $15,
        total_price = $16,
        negotiable = COALESCE($17, negotiable),
        minimum_price = $18,
        registration_charges = COALESCE($19, registration_charges),
        other_charges = COALESCE($20, other_charges),
        facing = $21,
        road_width = $22,
        bedrooms = COALESCE($23, bedrooms),
        bathrooms = COALESCE($24, bathrooms),
        ownership = COALESCE($25, ownership),
        broker = $26,
        assigned_to = $27,
        description = $28,
        internal_notes = $29,
        latitude = $30,
        longitude = $31,
        amenities = COALESCE($32, amenities),
        tags = COALESCE($33, tags),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $34
      WHERE id = $35 RETURNING *`,
      [
        validated.property_code ? validated.property_code.trim().toUpperCase() : current.property_code,
        validated.project_id !== undefined ? validated.project_id : current.project_id,
        validated.location_id !== undefined ? validated.location_id : current.location_id,
        validated.property_type || current.property_type,
        validated.category || current.category,
        validated.status || current.status,
        validated.plot_number !== undefined ? validated.plot_number : current.plot_number,
        validated.unit_number !== undefined ? validated.unit_number : current.unit_number,
        validated.block !== undefined ? validated.block : current.block,
        validated.floor !== undefined ? validated.floor : current.floor,
        validated.survey_number !== undefined ? validated.survey_number : current.survey_number,
        validated.approval_number !== undefined ? validated.approval_number : current.approval_number,
        areaSqft,
        areaSqm,
        ratePerSqft,
        totalPrice,
        validated.negotiable !== undefined ? validated.negotiable : current.negotiable,
        validated.minimum_price !== undefined ? validated.minimum_price : current.minimum_price,
        validated.registration_charges !== undefined ? validated.registration_charges : current.registration_charges,
        validated.other_charges !== undefined ? validated.other_charges : current.other_charges,
        validated.facing !== undefined ? validated.facing : current.facing,
        validated.road_width !== undefined ? validated.road_width : current.road_width,
        validated.bedrooms !== undefined ? validated.bedrooms : current.bedrooms,
        validated.bathrooms !== undefined ? validated.bathrooms : current.bathrooms,
        validated.ownership || current.ownership,
        validated.broker !== undefined ? validated.broker : current.broker,
        validated.assigned_to !== undefined ? validated.assigned_to : current.assigned_to,
        validated.description !== undefined ? validated.description : current.description,
        validated.internal_notes !== undefined ? validated.internal_notes : current.internal_notes,
        validated.latitude !== undefined ? validated.latitude : current.latitude,
        validated.longitude !== undefined ? validated.longitude : current.longitude,
        validated.amenities || current.amenities,
        validated.tags || current.tags,
        userId,
        id,
      ]
    );

    const updated = updateRes.rows[0];

    // Track changes in audit log
    const trackedFields = ['rate_per_sqft', 'area_sqft', 'total_price', 'status', 'project_id', 'location_id', 'facing'];
    for (const field of trackedFields) {
      if (String(current[field]) !== String(updated[field])) {
        await query(
          `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, field_name, old_value, new_value, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            userId,
            userName,
            'PROPERTY',
            id,
            updated.property_code,
            'UPDATE',
            field,
            String(current[field]),
            String(updated[field]),
            `Updated ${field} on ${updated.property_code} from ${current[field]} to ${updated[field]}`
          ]
        );
      }
    }

    res.json({ message: 'Property updated successfully', property: updated });
  } catch (error: any) {
    console.error('Error updating property:', error);
    res.status(400).json({ error: error.message || 'Failed to update property' });
  }
});

// PATCH /api/properties/:id/inline - Quick Inline Editing
router.patch('/:id/inline', authenticate, requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { field, value } = InlineEditSchema.parse(req.body);

    const existingRes = await query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const current = existingRes.rows[0];
    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'System User';

    let updateSql = '';
    let updateParams: any[] = [];
    let historyEventType = 'UPDATED';
    let historyDesc = '';

    if (field === 'rate_per_sqft') {
      const newRate = Number(value);
      const newTotalPrice = calculateTotalPrice(Number(current.area_sqft), newRate);
      updateSql = `UPDATE properties SET rate_per_sqft = $1, total_price = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3 WHERE id = $4 RETURNING *`;
      updateParams = [newRate, newTotalPrice, userId, id];
      historyEventType = 'RATE_CHANGE';
      historyDesc = `Rate changed from ₹${current.rate_per_sqft}/sq.ft to ₹${newRate}/sq.ft (Total Price: ₹${newTotalPrice})`;
    } else if (field === 'area_sqft') {
      const newArea = Number(value);
      const newTotalPrice = calculateTotalPrice(newArea, Number(current.rate_per_sqft));
      const newSqm = Number((newArea * 0.092903).toFixed(2));
      updateSql = `UPDATE properties SET area_sqft = $1, area_sqm = $2, total_price = $3, updated_at = CURRENT_TIMESTAMP, updated_by = $4 WHERE id = $5 RETURNING *`;
      updateParams = [newArea, newSqm, newTotalPrice, userId, id];
      historyEventType = 'AREA_CHANGE';
      historyDesc = `Area changed from ${current.area_sqft} sq.ft to ${newArea} sq.ft (Total Price: ₹${newTotalPrice})`;
    } else if (field === 'total_price') {
      const newPrice = Number(value);
      const newRate = Number((newPrice / Number(current.area_sqft)).toFixed(2));
      updateSql = `UPDATE properties SET total_price = $1, rate_per_sqft = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3 WHERE id = $4 RETURNING *`;
      updateParams = [newPrice, newRate, userId, id];
      historyEventType = 'RATE_CHANGE';
      historyDesc = `Total Price updated to ₹${newPrice} (Rate adjusted to ₹${newRate}/sq.ft)`;
    } else if (field === 'status') {
      const newStatus = String(value).toUpperCase();
      let statusExtra = '';
      if (newStatus === 'RESERVED') statusExtra = ', reservation_date = CURRENT_TIMESTAMP';
      if (newStatus === 'SOLD') statusExtra = ', sold_date = CURRENT_TIMESTAMP';

      updateSql = `UPDATE properties SET status = $1 ${statusExtra}, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3 RETURNING *`;
      updateParams = [newStatus, userId, id];
      historyEventType = 'STATUS_CHANGE';
      historyDesc = `Status changed from ${current.status} to ${newStatus}`;
    } else {
      updateSql = `UPDATE properties SET ${field} = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3 RETURNING *`;
      updateParams = [value, userId, id];
      historyDesc = `Updated ${field} to ${value}`;
    }

    const updateRes = await query(updateSql, updateParams);
    const updated = updateRes.rows[0];

    // Log History
    await query(
      `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, historyEventType, String(current[field]), String(updated[field]), historyDesc, userId]
    );

    // Audit Log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, field_name, old_value, new_value, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        userName,
        'PROPERTY',
        id,
        current.property_code,
        'INLINE_EDIT',
        field,
        String(current[field]),
        String(updated[field]),
        historyDesc
      ]
    );

    res.json({
      message: `${field.replace('_', ' ').toUpperCase()} updated successfully`,
      property: updated,
    });
  } catch (error: any) {
    console.error('Error during inline edit:', error);
    res.status(400).json({ error: error.message || 'Inline update failed' });
  }
});

// PATCH /api/properties/:id/status - Quick Status Transition
router.patch('/:id/status', authenticate, requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes, reservation_date, sold_date } = StatusUpdateSchema.parse(req.body);

    const existingRes = await query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const current = existingRes.rows[0];
    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'System User';

    const updateRes = await query(
      `UPDATE properties SET
        status = $1,
        reservation_date = COALESCE($2, reservation_date),
        sold_date = COALESCE($3, sold_date),
        internal_notes = CASE WHEN $4::text IS NOT NULL AND $4::text != '' THEN COALESCE(internal_notes || E'\n', '') || $4 ELSE internal_notes END,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $5
      WHERE id = $6 RETURNING *`,
      [status, reservation_date || null, sold_date || null, notes || null, userId, id]
    );

    const updated = updateRes.rows[0];

    // Log History
    await query(
      `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'STATUS_CHANGE',
        current.status,
        status,
        `Status changed from ${current.status} to ${status}. ${notes ? `Note: ${notes}` : ''}`,
        userId
      ]
    );

    // Audit Log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, field_name, old_value, new_value, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        userName,
        'PROPERTY',
        id,
        current.property_code,
        'STATUS_CHANGE',
        'status',
        current.status,
        status,
        `Status changed from ${current.status} to ${status}. ${notes ? `Note: ${notes}` : ''}`
      ]
    );

    res.json({
      message: `Status updated to ${status}`,
      property: updated,
    });
  } catch (error: any) {
    console.error('Error updating status:', error);
    res.status(400).json({ error: error.message || 'Status update failed' });
  }
});

// POST /api/properties/bulk - Bulk Operations
router.post('/bulk', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, action, value } = BulkActionSchema.parse(req.body);
    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'System User';

    let affected = 0;

    if (action === 'STATUS_CHANGE') {
      const status = String(value).toUpperCase();
      const result = await query(
        `UPDATE properties SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = ANY($3::int[])`,
        [status, userId, ids]
      );
      affected = result.rowCount;

      // History & Audit log
      for (const propId of ids) {
        await query(
          `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [propId, 'STATUS_CHANGE', 'BULK_UPDATE', status, `Bulk status updated to ${status} by ${userName}`, userId]
        );
      }
    } else if (action === 'ASSIGN_EMPLOYEE') {
      const empId = Number(value);
      const result = await query(
        `UPDATE properties SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = ANY($3::int[])`,
        [empId, userId, ids]
      );
      affected = result.rowCount;
    } else if (action === 'CHANGE_PROJECT') {
      const projectId = Number(value);
      const result = await query(
        `UPDATE properties SET project_id = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = ANY($3::int[])`,
        [projectId, userId, ids]
      );
      affected = result.rowCount;
    } else if (action === 'ARCHIVE') {
      const result = await query(
        `UPDATE properties SET archived = true, updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE id = ANY($2::int[])`,
        [userId, ids]
      );
      affected = result.rowCount;
    } else if (action === 'DELETE') {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Only ADMIN users can permanently delete properties.' });
        return;
      }
      const result = await query(
        `DELETE FROM properties WHERE id = ANY($1::int[])`,
        [ids]
      );
      affected = result.rowCount;
    }

    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, field_name, old_value, new_value, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        userName,
        'PROPERTY',
        0,
        'BULK',
        'BULK_UPDATE',
        action,
        null,
        String(value),
        `Bulk operation ${action} executed on ${ids.length} properties.`
      ]
    );

    res.json({
      message: `Bulk operation '${action}' completed successfully on ${affected || ids.length} properties.`,
      affectedCount: affected || ids.length,
    });
  } catch (error: any) {
    console.error('Error during bulk action:', error);
    res.status(400).json({ error: error.message || 'Bulk operation failed' });
  }
});

// POST /api/properties/:id/duplicate - Duplicate Property
router.post('/:id/duplicate', authenticate, requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const existingRes = await query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const orig = existingRes.rows[0];
    const newCode = `${orig.property_code}-COPY-${Math.floor(100 + Math.random() * 900)}`;
    const userId = req.user?.id || 1;

    const insertResult = await query(
      `INSERT INTO properties (
        property_code, project_id, location_id, property_type, category, status,
        plot_number, unit_number, block, floor, survey_number, approval_number,
        area_sqft, area_sqm, rate_per_sqft, total_price, negotiable, minimum_price,
        registration_charges, other_charges, facing, road_width, bedrooms, bathrooms,
        ownership, broker, assigned_to, description, internal_notes,
        latitude, longitude, amenities, tags, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, 'DRAFT',
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34
      ) RETURNING *`,
      [
        newCode, orig.project_id, orig.location_id, orig.property_type, orig.category,
        orig.plot_number ? `${orig.plot_number} (Copy)` : null,
        orig.unit_number, orig.block, orig.floor, orig.survey_number, orig.approval_number,
        orig.area_sqft, orig.area_sqm, orig.rate_per_sqft, orig.total_price, orig.negotiable, orig.minimum_price,
        orig.registration_charges, orig.other_charges, orig.facing, orig.road_width, orig.bedrooms, orig.bathrooms,
        orig.ownership, orig.broker, orig.assigned_to, orig.description, orig.internal_notes,
        orig.latitude, orig.longitude, orig.amenities, orig.tags, userId, userId
      ]
    );

    const dup = insertResult.rows[0];

    // Clone images
    const imgRes = await query('SELECT * FROM property_images WHERE property_id = $1', [id]);
    for (const img of imgRes.rows) {
      await query(
        `INSERT INTO property_images (property_id, url, title, is_primary, image_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [dup.id, img.url, img.title, img.is_primary, img.image_type]
      );
    }

    res.status(201).json({ message: `Duplicated as ${newCode}`, property: dup });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Duplication failed' });
  }
});

// DELETE /api/properties/:id - Archive or Permanent Delete
router.delete('/:id', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const permanent = req.query.permanent === 'true';

    const existingRes = await query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const prop = existingRes.rows[0];
    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'System User';

    if (permanent) {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Permanent deletion requires ADMIN permissions' });
        return;
      }
      await query('DELETE FROM properties WHERE id = $1', [id]);
      await query(
        `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, userName, 'PROPERTY', id, prop.property_code, 'DELETE', `Permanently deleted property ${prop.property_code}`]
      );
      res.json({ message: `Property ${prop.property_code} permanently deleted.` });
    } else {
      await query('UPDATE properties SET archived = true, updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE id = $2', [userId, id]);
      await query(
        `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, userName, 'PROPERTY', id, prop.property_code, 'ARCHIVE', `Archived property ${prop.property_code}`]
      );
      res.json({ message: `Property ${prop.property_code} archived successfully.` });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Deletion failed' });
  }
});

export default router;
