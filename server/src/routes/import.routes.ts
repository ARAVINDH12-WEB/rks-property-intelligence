import { Router, Request, Response } from 'express';
import * as xlsx from 'xlsx';
import { query } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { calculateTotalPrice } from '../utils/calculations.js';

const router = Router();

// Helper to safely parse numeric strings with commas or currency symbols
function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^0-9.-]/g, '');
  return parseFloat(clean);
}

// SINGLE ENDPOINT: Parse + Validate in one request (Vercel-safe, memory-storage)
router.post('/parse-and-validate', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No spreadsheet file uploaded.' });
      return;
    }

    let workbook: xlsx.WorkBook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    } catch (parseErr: any) {
      res.status(400).json({ error: 'Could not read file. Please ensure it is a valid .xlsx, .xls, or .csv file.' });
      return;
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      res.status(400).json({ error: 'Spreadsheet has no sheets.' });
      return;
    }

    const worksheet = workbook.Sheets[sheetName];
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

    // Parse user-provided custom mapping if submitted
    let userMapping: Record<string, string> = {};
    try {
      if (req.body.mapping) {
        userMapping = typeof req.body.mapping === 'string' ? JSON.parse(req.body.mapping) : req.body.mapping;
      }
    } catch {}

    const activeMapping = Object.keys(userMapping).length > 0 ? userMapping : suggestedMapping;

    // Check existing property codes in DB
    let existingCodeSet = new Set<string>();
    try {
      const existingProps = await query('SELECT property_code FROM properties');
      existingCodeSet = new Set(existingProps.rows.map((r: any) => String(r.property_code).trim().toUpperCase()));
    } catch (dbErr) {
      console.warn('DB check note during validation:', dbErr);
    }

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
      const rawArea = parseNumeric(raw[activeMapping.area_sqft]);
      const rawRate = parseNumeric(raw[activeMapping.rate_per_sqft]);
      const rawPrice = parseNumeric(raw[activeMapping.total_price]);
      const rawStatus = String(raw[activeMapping.status] || 'AVAILABLE').trim().toUpperCase();

      if (!rawCode) {
        errors.push('Missing Property ID / Code');
      } else {
        const codeUpper = rawCode.toUpperCase();
        if (existingCodeSet.has(codeUpper)) {
          warnings.push(`Existing ID '${codeUpper}' (will update existing plot)`);
        }
        if (seenCodesInFile.has(codeUpper)) {
          warnings.push(`Duplicate ID '${codeUpper}' in file (later row will override)`);
        }
        seenCodesInFile.add(codeUpper);
      }

      if (isNaN(rawArea) || rawArea <= 0) {
        errors.push('Invalid Area (must be positive number)');
      }

      if (isNaN(rawRate) || rawRate <= 0) {
        errors.push('Invalid Rate per Sq.Ft (must be positive number)');
      }

      let computedPrice = 0;
      if (!isNaN(rawArea) && !isNaN(rawRate)) {
        computedPrice = calculateTotalPrice(rawArea, rawRate);
      }

      if (!isNaN(rawPrice) && rawPrice > 0 && computedPrice > 0 && Math.abs(rawPrice - computedPrice) > 100) {
        warnings.push(`Price mismatch: Provided ₹${rawPrice.toLocaleString('en-IN')} vs calculated ₹${computedPrice.toLocaleString('en-IN')}`);
      }

      const validStatuses = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'HOLD', 'UPCOMING', 'DRAFT'];
      const normalizedStatus = validStatuses.includes(rawStatus) ? rawStatus : 'AVAILABLE';
      if (!validStatuses.includes(rawStatus) && rawStatus) {
        warnings.push(`Status '${rawStatus}' mapped to AVAILABLE`);
      }

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

// LEGACY: Keep /parse for backward compat
router.post('/parse', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
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

// COMMIT IMPORT TO POSTGRESQL (Supports UPSERT & Resilient row handling)
router.post('/commit', async (req: Request, res: Response): Promise<void> => {
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
    const userName = req.user?.name || 'Authorized Staff';

    // 1. Resolve or Create Locations and Projects Cache
    const locMap = new Map<string, number>();
    try {
      const existingLocs = await query('SELECT id, name, city FROM locations');
      for (const l of existingLocs.rows) {
        locMap.set(String(l.name).toLowerCase(), l.id);
        locMap.set(String(l.city).toLowerCase(), l.id);
      }
    } catch {}

    const projMap = new Map<string, number>();
    try {
      const existingProjs = await query('SELECT id, name FROM projects');
      for (const p of existingProjs.rows) {
        projMap.set(String(p.name).toLowerCase(), p.id);
      }
    } catch {}

    let importedCount = 0;
    const errorsList: string[] = [];

    for (const item of validRows) {
      try {
        const locName = (item.location_name || 'Chennai').trim();
        const projName = (item.project_name || 'RKS Prime Layout').trim();

        // Resolve or create Location
        let locId: number = locMap.get(locName.toLowerCase()) || 0;
        if (!locId) {
          const newLoc = await query(
            `INSERT INTO locations (name, city, state) VALUES ($1, $2, 'Tamil Nadu') RETURNING id`,
            [locName, locName]
          );
          locId = Number(newLoc.rows[0].id);
          locMap.set(locName.toLowerCase(), locId);
        }

        // Resolve or create Project
        let projId: number = projMap.get(projName.toLowerCase()) || 0;
        if (!projId) {
          const projCode = `PRJ-${projName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'RKS'}-${Math.floor(100 + Math.random() * 900)}`;
          const newProj = await query(
            `INSERT INTO projects (name, code, location_id, status) VALUES ($1, $2, $3, 'ACTIVE') RETURNING id`,
            [projName, projCode, locId]
          );
          projId = Number(newProj.rows[0].id);
          projMap.set(projName.toLowerCase(), projId);
        }

        const areaSqft = Number(item.area_sqft) || 0;
        const ratePerSqft = Number(item.rate_per_sqft) || 0;
        const totalPrice = Number(item.total_price) || (areaSqft * ratePerSqft);
        const areaSqm = Number((areaSqft * 0.092903).toFixed(2));
        const propCode = String(item.property_code || '').trim().toUpperCase();

        // Resilient UPSERT on conflict with existing property code
        const propResult = await query(
          `INSERT INTO properties (
            property_code, project_id, location_id, property_type, status,
            plot_number, survey_number, area_sqft, area_sqm, rate_per_sqft,
            total_price, facing, road_width, description, created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16
          )
          ON CONFLICT (property_code) DO UPDATE SET
            project_id = EXCLUDED.project_id,
            location_id = EXCLUDED.location_id,
            property_type = EXCLUDED.property_type,
            status = EXCLUDED.status,
            plot_number = EXCLUDED.plot_number,
            survey_number = EXCLUDED.survey_number,
            area_sqft = EXCLUDED.area_sqft,
            area_sqm = EXCLUDED.area_sqm,
            rate_per_sqft = EXCLUDED.rate_per_sqft,
            total_price = EXCLUDED.total_price,
            facing = EXCLUDED.facing,
            road_width = EXCLUDED.road_width,
            description = EXCLUDED.description,
            updated_by = EXCLUDED.updated_by,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id`,
          [
            propCode,
            projId,
            locId,
            item.property_type || 'Residential Plot',
            item.status || 'AVAILABLE',
            item.plot_number || null,
            item.survey_number || null,
            areaSqft,
            areaSqm,
            ratePerSqft,
            totalPrice,
            item.facing || null,
            item.road_width || null,
            item.description || 'Imported via spreadsheet batch',
            userId,
            userId,
          ]
        );

        const propId = propResult.rows[0]?.id;

        if (propId) {
          // Add default primary image if none exists
          await query(
            `INSERT INTO property_images (property_id, url, title, is_primary)
             SELECT $1, $2, $3, true
             WHERE NOT EXISTS (SELECT 1 FROM property_images WHERE property_id = $1)`,
            [
              propId,
              'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
              `${propCode} Layout View`,
            ]
          );

          // Add history record
          await query(
            `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by)
             VALUES ($1, 'IMPORTED', null, $2, 'Imported from spreadsheet batch', $3)`,
            [propId, item.status || 'AVAILABLE', userId]
          );
        }

        importedCount++;
      } catch (rowErr: any) {
        console.error(`Error importing row ${item.property_code}:`, rowErr);
        errorsList.push(`${item.property_code}: ${rowErr.message || 'Insert error'}`);
      }
    }

    // Record Batch Summary
    try {
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
    } catch {}

    res.json({
      message: `Successfully processed ${importedCount} properties into RKS inventory!`,
      importedCount,
      errorsCount: errorsList.length,
      errors: errorsList.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Error committing import:', error);
    res.status(500).json({ error: error.message || 'Import commit failed' });
  }
});

export default router;
