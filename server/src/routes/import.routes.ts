import { Router, Request, Response } from 'express';
import * as xlsx from 'xlsx';
import { query } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { calculateTotalPrice } from '../utils/calculations.js';


const router = Router();

// SINGLE ENDPOINT: Parse + Validate in one request (Vercel-safe, no temp file between steps)
router.post('/parse-and-validate', authenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No spreadsheet file uploaded' });
      return;
    }

    let workbook: xlsx.WorkBook;
    try {
      // Memory storage: file is in req.file.buffer, no disk path needed
      workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    } catch (parseErr: any) {
      res.status(400).json({ error: 'Could not read file. Make sure it is a valid .xlsx, .xls, or .csv file.' });
      return;
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    if (rawRows.length === 0) {
      res.status(400).json({ error: 'The uploaded spreadsheet is empty.' });
      return;
    }

    const headers = Object.keys(rawRows[0]);

    // Intelligent auto-mapping heuristics
    const suggestedMapping: Record<string, string> = {};
    const mappingHeuristics: Record<string, RegExp[]> = {
      property_code: [/prop(erty)?[\s_-]?(id|code|no|num)/i, /plot[\s_-]?(no|num|id)/i, /^code$/i, /^id$/i],
      project_name: [/project[\s_-]?(name|title)?/i, /^scheme$/i, /^layout$/i],
      location_name: [/loc(ation)?[\s_-]?(name)?/i, /^city$/i, /^place$/i, /^town$/i],
      property_type: [/(property[\s_-]?)?type/i, /^category$/i, /^kind$/i],
      area_sqft: [/area[\s_-]?(sq[\s_-]?ft|sqft)?/i, /^sqft$/i, /^size$/i, /^extent$/i],
      rate_per_sqft: [/rate[\s_-]?(per[\s_-]?sq[\s_-]?ft|\/sqft|sqft)?/i, /^rate$/i, /^sqft[\s_-]?rate$/i],
      total_price: [/total[\s_-]?(price|cost|val(ue)?|amount)/i, /^price$/i, /^cost$/i, /^amount$/i],
      status: [/status/i, /avail(ability)?/i, /state/i],
      facing: [/facing/i, /direction/i],
      survey_number: [/survey[\s_-]?(no|number|num)/i, /^sf[\s_-]?no$/i, /^survey$/i],
      plot_number: [/plot[\s_-]?(no|number|num)/i, /^door[\s_-]?no$/i],
      road_width: [/road[\s_-]?(width|size)?/i, /^street$/i],
      description: [/desc(ription)?/i, /^notes$/i, /^remarks$/i],
    };

    for (const header of headers) {
      for (const [targetField, regexes] of Object.entries(mappingHeuristics)) {
        if (!suggestedMapping[targetField] && regexes.some((r) => r.test(header.trim()))) {
          suggestedMapping[targetField] = header;
          break;
        }
      }
    }

    // Parse the user-provided mapping (if sent alongside the file as JSON field)
    let userMapping: Record<string, string> = {};
    try {
      if (req.body.mapping) {
        userMapping = typeof req.body.mapping === 'string' ? JSON.parse(req.body.mapping) : req.body.mapping;
      }
    } catch {}

    const activeMapping = Object.keys(userMapping).length > 0 ? userMapping : suggestedMapping;

    // If no mapping is available, return headers and suggested mapping for Step 2 (user maps columns)
    if (Object.keys(activeMapping).length === 0) {
      res.json({
        stage: 'mapping_required',
        originalName: req.file.originalname,
        totalRows: rawRows.length,
        headers,
        suggestedMapping,
        sampleRows: rawRows.slice(0, 5),
        rawRows, // carry all rows for re-validation after user maps
      });
      return;
    }

    // --- RUN VALIDATION INLINE ---
    const existingProps = await query('SELECT property_code FROM properties');
    const existingCodeSet = new Set(existingProps.rows.map((r: any) => String(r.property_code).trim().toUpperCase()));

    const seenCodesInFile = new Set<string>();
    const validatedRows: any[] = [];
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    for (let idx = 0; idx < rawRows.length; idx++) {
      const raw = rawRows[idx];
      const errors: string[] = [];
      const warnings: string[] = [];

      const rawCode = String(raw[activeMapping.property_code] || '').trim();
      const rawProj = String(raw[activeMapping.project_name] || 'General Inventory').trim();
      const rawLoc = String(raw[activeMapping.location_name] || 'Chennai').trim();
      const rawType = String(raw[activeMapping.property_type] || 'Residential Plot').trim();
      const rawArea = parseFloat(String(raw[activeMapping.area_sqft] || '').replace(/,/g, ''));
      const rawRate = parseFloat(String(raw[activeMapping.rate_per_sqft] || '').replace(/,/g, ''));
      const rawPrice = parseFloat(String(raw[activeMapping.total_price] || '').replace(/,/g, ''));
      const rawStatus = String(raw[activeMapping.status] || 'AVAILABLE').trim().toUpperCase();

      if (!rawCode) {
        errors.push('Missing Property ID / Code');
      } else {
        const codeUpper = rawCode.toUpperCase();
        if (existingCodeSet.has(codeUpper)) errors.push(`Duplicate: '${codeUpper}' already in database`);
        if (seenCodesInFile.has(codeUpper)) errors.push(`Duplicate: '${codeUpper}' repeats in spreadsheet`);
        seenCodesInFile.add(codeUpper);
      }

      if (isNaN(rawArea) || rawArea <= 0) errors.push('Invalid Area (must be positive number)');
      if (isNaN(rawRate) || rawRate <= 0) errors.push('Invalid Rate per Sq.Ft (must be positive number)');

      let computedPrice = 0;
      if (!isNaN(rawArea) && !isNaN(rawRate)) computedPrice = calculateTotalPrice(rawArea, rawRate);

      if (!isNaN(rawPrice) && rawPrice > 0 && Math.abs(rawPrice - computedPrice) > 100) {
        warnings.push(`Price mismatch: Provided ₹${rawPrice.toLocaleString('en-IN')} vs calculated ₹${computedPrice.toLocaleString('en-IN')}`);
      }

      const validStatuses = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'HOLD', 'UPCOMING', 'DRAFT'];
      const normalizedStatus = validStatuses.includes(rawStatus) ? rawStatus : 'AVAILABLE';
      if (!validStatuses.includes(rawStatus) && rawStatus) warnings.push(`Status '${rawStatus}' defaulted to AVAILABLE`);

      const isValid = errors.length === 0;
      if (isValid) validCount++; else errorCount++;
      if (warnings.length > 0) warningCount++;

      validatedRows.push({
        rowIndex: idx + 1,
        property_code: rawCode ? rawCode.toUpperCase() : `ROW-${idx + 1}`,
        project_name: rawProj,
        location_name: rawLoc,
        property_type: rawType,
        area_sqft: isNaN(rawArea) ? 0 : rawArea,
        rate_per_sqft: isNaN(rawRate) ? 0 : rawRate,
        total_price: computedPrice || rawPrice || 0,
        status: normalizedStatus,
        plot_number: activeMapping.plot_number ? String(raw[activeMapping.plot_number] || '') : '',
        survey_number: activeMapping.survey_number ? String(raw[activeMapping.survey_number] || '') : '',
        facing: activeMapping.facing ? String(raw[activeMapping.facing] || '') : '',
        road_width: activeMapping.road_width ? String(raw[activeMapping.road_width] || '') : '',
        description: activeMapping.description ? String(raw[activeMapping.description] || '') : '',
        isValid,
        errors,
        warnings,
      });
    }

    res.json({
      stage: 'validated',
      originalName: req.file.originalname,
      headers,
      suggestedMapping: activeMapping,
      summary: {
        totalRows: rawRows.length,
        validRows: validCount,
        errorRows: errorCount,
        warningRows: warningCount,
      },
      previewRows: validatedRows.slice(0, 50),
      allValidatedRows: validatedRows,
      sampleRows: rawRows.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Error in parse-and-validate:', error);
    res.status(500).json({ error: error.message || 'Failed to parse and validate spreadsheet' });
  }
});

// LEGACY: Keep /parse for backward compat — uses memory buffer like parse-and-validate
router.post('/parse', authenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    if (rawRows.length === 0) { res.status(400).json({ error: 'Spreadsheet is empty.' }); return; }
    const headers = Object.keys(rawRows[0]);
    res.json({ fileKey: req.file.originalname, originalName: req.file.originalname, totalRows: rawRows.length, headers, suggestedMapping: {}, sampleRows: rawRows.slice(0, 10) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Parse failed' });
  }
});

// STEP 6: Commit Import to PostgreSQL
router.post('/commit', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows, filename = 'spreadsheet.xlsx' } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'No validated rows provided for commit.' });
      return;
    }

    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      res.status(400).json({ error: 'None of the provided rows are valid to import.' });
      return;
    }

    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'System User';

    // 1. Resolve or Create Locations and Projects Cache
    const locMap = new Map<string, number>();
    const existingLocs = await query('SELECT id, name, city FROM locations');
    for (const l of existingLocs.rows) {
      locMap.set(l.name.toLowerCase(), l.id);
      locMap.set(l.city.toLowerCase(), l.id);
    }

    const projMap = new Map<string, number>();
    const existingProjs = await query('SELECT id, name FROM projects');
    for (const p of existingProjs.rows) {
      projMap.set(p.name.toLowerCase(), p.id);
    }

    let importedCount = 0;

    for (const item of validRows) {
      // Resolve Location
      let locId: number = locMap.get(item.location_name.toLowerCase()) || 0;
      if (!locId) {
        const newLoc = await query(
          `INSERT INTO locations (name, city, state) VALUES ($1, $2, 'Tamil Nadu') RETURNING id`,
          [item.location_name, item.location_name]
        );
        locId = Number(newLoc.rows[0].id);
        locMap.set(item.location_name.toLowerCase(), locId);
      }

      // Resolve Project
      let projId: number = projMap.get(item.project_name.toLowerCase()) || 0;
      if (!projId) {
        const projCode = `PRJ-${item.project_name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
        const newProj = await query(
          `INSERT INTO projects (name, code, location_id, status) VALUES ($1, $2, $3, 'ACTIVE') RETURNING id`,
          [item.project_name, projCode, locId]
        );
        projId = Number(newProj.rows[0].id);
        projMap.set(item.project_name.toLowerCase(), projId);
      }

      const areaSqm = Number((item.area_sqft * 0.092903).toFixed(2));

      // Insert Property
      const propResult = await query(
        `INSERT INTO properties (
          property_code, project_id, location_id, property_type, status,
          plot_number, survey_number, area_sqft, area_sqm, rate_per_sqft,
          total_price, facing, road_width, description, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16
        ) RETURNING id`,
        [
          item.property_code.trim().toUpperCase(),
          projId,
          locId,
          item.property_type || 'Residential Plot',
          item.status || 'AVAILABLE',
          item.plot_number || null,
          item.survey_number || null,
          item.area_sqft,
          areaSqm,
          item.rate_per_sqft,
          item.total_price,
          item.facing || null,
          item.road_width || null,
          item.description || 'Imported via spreadsheet batch',
          userId,
          userId,
        ]
      );

      const propId = propResult.rows[0].id;

      // Add default image
      await query(
        `INSERT INTO property_images (property_id, url, title, is_primary)
         VALUES ($1, $2, $3, true)`,
        [
          propId,
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
          `${item.property_code} Site View`
        ]
      );

      // Add history record
      await query(
        `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by)
         VALUES ($1, 'CREATED', null, $2, 'Imported from spreadsheet', $3)`,
        [propId, item.status, userId]
      );

      importedCount++;
    }

    // Record Batch Summary
    await query(
      `INSERT INTO import_batches (filename, total_rows, valid_rows, error_rows, imported_by, status)
       VALUES ($1, $2, $3, $4, $5, 'COMPLETED')`,
      [filename, rows.length, importedCount, rows.length - importedCount, userId]
    );

    // Record Audit Log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, property_code, action, details)
       VALUES ($1, $2, 'IMPORT', 0, 'BATCH', 'IMPORT', $3)`,
      [userId, userName, `Successfully imported ${importedCount} properties from ${filename}.`]
    );

    res.json({
      message: `Successfully imported ${importedCount} properties into RKS inventory!`,
      importedCount,
    });
  } catch (error: any) {
    console.error('Error committing import:', error);
    res.status(500).json({ error: error.message || 'Import commit failed' });
  }
});

export default router;
