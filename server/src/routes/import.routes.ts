import { Router, Request, Response } from 'express';
import * as xlsx from 'xlsx';
import { query } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { calculateTotalPrice } from '../utils/calculations.js';

const router = Router();

// Helper to safely parse numeric values (handles commas, Indian Lakhs/Crores, Rs. currency, sqft units)
function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return isNaN(val) ? NaN : val;
  let str = String(val).trim();
  if (!str) return NaN;

  // Check Lakhs / Lacs / L: e.g. "45 Lakhs", "45.5 L", "45 Lacs"
  const lakhMatch = str.match(/^([\d,.]+)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
  if (lakhMatch) {
    const num = parseFloat(lakhMatch[1].replace(/,/g, ''));
    return isNaN(num) ? NaN : Math.round(num * 100000);
  }

  // Check Crores / Cr: e.g. "1.5 Cr", "1.5 Crore", "2 Crores"
  const croreMatch = str.match(/^([\d,.]+)\s*(?:crore|crores|cr)\b/i);
  if (croreMatch) {
    const num = parseFloat(croreMatch[1].replace(/,/g, ''));
    return isNaN(num) ? NaN : Math.round(num * 10000000);
  }

  // Check Thousands (k): e.g. "850k", "50 k"
  const kMatch = str.match(/^([\d,.]+)\s*k\b/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(/,/g, ''));
    return isNaN(num) ? NaN : Math.round(num * 1000);
  }

  // Strip currency prefixes and symbols (e.g. 'Rs.', 'INR', '₹', '$')
  str = str.replace(/(?:rs\.?|inr|₹|\$)/gi, '');
  // Strip unit abbreviations (e.g. 'sq.ft.', 'sqft', '/sqft', 'sqm', 'per sqft')
  str = str.replace(/(?:\/?\s*(?:sq\.?\s*ft\.?|sqft|sqm|per\s*sq\.?\s*ft\.?))/gi, '');
  // Remove commas
  str = str.replace(/,/g, '').trim();

  // Extract the first valid floating-point number
  const numMatch = str.match(/[-+]?\d+(?:\.\d+)?/);
  if (!numMatch) return NaN;

  const res = parseFloat(numMatch[0]);
  return isNaN(res) ? NaN : res;
}

// Comprehensive heuristics for matching Excel / CSV column headers
const mappingHeuristics: Record<string, RegExp[]> = {
  property_code: [
    /prop(erty)?[\s_-]?(id|code|no|num|number)?/i,
    /plot[\s_-]?(id|code)/i,
    /^code$/i,
    /^id$/i,
    /^uid$/i,
  ],
  project_name: [
    /project[\s_-]?(name|title|code)?/i,
    /^scheme$/i,
    /^layout[\s_-]?(name)?$/i,
    /^community$/i,
    /^development$/i,
    /^property[\s_-]?name$/i,
  ],
  location_name: [
    /loc(ation)?[\s_-]?(name)?/i,
    /^city$/i,
    /^place$/i,
    /^town$/i,
    /^area$/i,
    /^address$/i,
    /^zone$/i,
    /^region$/i,
  ],
  property_type: [
    /(property[\s_-]?)?type/i,
    /^category$/i,
    /^kind$/i,
    /^usage$/i,
  ],
  area_sqft: [
    /area/i,
    /sq[\s._-]?ft/i,
    /sqft/i,
    /extent/i,
    /size/i,
    /dimension/i,
  ],
  rate_per_sqft: [
    /rate/i,
    /per[\s_-]?sq/i,
    /sqft[\s_-]?rate/i,
    /price[\s_-]?per/i,
    /base[\s_-]?rate/i,
  ],
  total_price: [
    /total/i,
    /price/i,
    /cost/i,
    /amount/i,
    /value/i,
    /budget/i,
    /consideration/i,
  ],
  status: [
    /status/i,
    /avail/i,
    /state/i,
    /condition/i,
  ],
  facing: [
    /facing/i,
    /direction/i,
    /orientation/i,
  ],
  survey_number: [
    /survey/i,
    /s[\s._-]?no/i,
    /sf[\s._-]?no/i,
    /patta/i,
    /khata/i,
  ],
  plot_number: [
    /plot[\s_-]?(no|number|num|#)?/i,
    /^plot$/i,
    /door[\s_-]?(no|num|number)?/i,
    /unit[\s_-]?(no|num|number)?/i,
    /site[\s_-]?(no|num|number)?/i,
  ],
  road_width: [
    /road/i,
    /street/i,
    /lane/i,
    /width/i,
    /approach/i,
  ],
  description: [
    /desc/i,
    /note/i,
    /remark/i,
    /comment/i,
    /detail/i,
  ],
  latitude: [
    /^lat(itude)?$/i,
    /^lat$/i,
  ],
  longitude: [
    /^lon(gitude)?$|^lng$/i,
    /^long$/i,
  ],
  google_maps_url: [
    /maps/i,
    /gmap/i,
    /location[\s_-]?(url|link)/i,
  ],
};

// SINGLE ENDPOINT: Parse + Validate in one request (Vercel-safe, memory-storage)
router.post('/parse-and-validate', authenticate, requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), upload.single('file'), async (req: Request, res: Response): Promise<void> => {
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

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      res.status(400).json({ error: 'Spreadsheet has no sheets.' });
      return;
    }

    // Pick the sheet with the most rows in case the first sheet is a cover/readme
    let rawRows: any[] = [];
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: '' });
      if (rows.length > rawRows.length) {
        rawRows = rows;
      }
    }

    if (rawRows.length === 0) {
      res.status(400).json({ error: 'The uploaded spreadsheet is empty or contains no tabular data.' });
      return;
    }

    const headers = Object.keys(rawRows[0]);
    const suggestedMapping: Record<string, string> = {};

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

    let displayIndex = 1;
    for (let idx = 0; idx < rawRows.length; idx++) {
      const raw = rawRows[idx];

      // Skip truly empty rows (often present at bottom of Excel exports)
      const isRowEmpty = Object.values(raw).every(v => v === null || v === undefined || String(v).trim() === '');
      if (isRowEmpty) continue;

      const errors: string[] = [];
      const warnings: string[] = [];

      let rawCode = activeMapping.property_code ? String(raw[activeMapping.property_code] || '').trim() : '';
      const rawProj = (activeMapping.project_name && String(raw[activeMapping.project_name] || '').trim()) || 'RKS Property Hub Layout';
      const rawLoc = (activeMapping.location_name && String(raw[activeMapping.location_name] || '').trim()) || 'Chennai';
      const rawType = (activeMapping.property_type && String(raw[activeMapping.property_type] || '').trim()) || 'Residential Plot';
      const rawPlotNum = activeMapping.plot_number ? String(raw[activeMapping.plot_number] || '').trim() : '';
      const rawSurvey = activeMapping.survey_number ? String(raw[activeMapping.survey_number] || '').trim() : '';
      const rawFacing = activeMapping.facing ? String(raw[activeMapping.facing] || '').trim() : '';
      const rawRoadW = activeMapping.road_width ? String(raw[activeMapping.road_width] || '').trim() : '';
      const rawDesc = activeMapping.description ? String(raw[activeMapping.description] || '').trim() : '';

      let rawArea = parseNumeric(raw[activeMapping.area_sqft]);
      let rawRate = parseNumeric(raw[activeMapping.rate_per_sqft]);
      let rawPrice = parseNumeric(raw[activeMapping.total_price]);
      const rawStatus = String(raw[activeMapping.status] || 'AVAILABLE').trim().toUpperCase();

      // Auto-generate code if not explicitly in spreadsheet
      if (!rawCode) {
        const projPrefix = rawProj.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'RKS';
        if (rawPlotNum) {
          rawCode = `${projPrefix}-${rawPlotNum.replace(/[^a-zA-Z0-9]/g, '')}`;
          warnings.push(`Auto-generated Property Code '${rawCode}' from Plot Number`);
        } else {
          rawCode = `${projPrefix}-P${String(displayIndex).padStart(3, '0')}`;
          warnings.push(`Auto-generated Property Code '${rawCode}'`);
        }
      }

      const codeUpper = rawCode.toUpperCase();
      if (existingCodeSet.has(codeUpper)) {
        warnings.push(`Existing Code '${codeUpper}' (will update existing plot)`);
      }
      if (seenCodesInFile.has(codeUpper)) {
        warnings.push(`Duplicate Code '${codeUpper}' in file (later row will override)`);
      }
      seenCodesInFile.add(codeUpper);

      // Location coordinates — explicit columns first, then parse from Google Maps URL
      let rawLat: number | null = null;
      let rawLng: number | null = null;

      if (activeMapping.latitude && raw[activeMapping.latitude]) {
        const parsedLat = parseFloat(String(raw[activeMapping.latitude]));
        if (!isNaN(parsedLat)) rawLat = parsedLat;
      }
      if (activeMapping.longitude && raw[activeMapping.longitude]) {
        const parsedLng = parseFloat(String(raw[activeMapping.longitude]));
        if (!isNaN(parsedLng)) rawLng = parsedLng;
      }

      // Parse Google Maps URL if explicit lat/lng not provided
      if ((rawLat === null || rawLng === null) && activeMapping.google_maps_url) {
        const mapsUrl = String(raw[activeMapping.google_maps_url] || '').trim();
        if (mapsUrl) {
          const atMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          const dataMatch = mapsUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
          const qMatch = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
          const match = atMatch || dataMatch || qMatch;
          if (match) {
            rawLat = parseFloat(match[1]);
            rawLng = parseFloat(match[2]);
          } else if (mapsUrl.length > 5) {
            warnings.push(`Could not extract coordinates from Maps URL`);
          }
        }
      }

      // Validate Area
      if (isNaN(rawArea) || rawArea <= 0) {
        errors.push('Invalid Area (must be positive number, e.g. 1200 or 1,200 sqft)');
      }

      // Auto-derive Rate per sqft if missing but Total Price and Area are available
      if (isNaN(rawRate) || rawRate <= 0) {
        if (!isNaN(rawPrice) && rawPrice > 0 && !isNaN(rawArea) && rawArea > 0) {
          rawRate = Math.round(rawPrice / rawArea);
          warnings.push(`Rate calculated as Rs.${rawRate}/sq.ft from total price`);
        } else {
          errors.push('Invalid Rate per Sq.Ft (could not determine from rate or total price)');
        }
      }

      // Auto-calculate Total Price if missing
      let computedPrice = 0;
      if (!isNaN(rawArea) && !isNaN(rawRate) && rawArea > 0 && rawRate > 0) {
        computedPrice = calculateTotalPrice(rawArea, rawRate);
      }
      if (isNaN(rawPrice) || rawPrice <= 0) {
        rawPrice = computedPrice;
      } else if (computedPrice > 0 && Math.abs(rawPrice - computedPrice) > 100) {
        warnings.push(`Price mismatch: Provided Rs.${rawPrice.toLocaleString('en-IN')} vs calculated Rs.${computedPrice.toLocaleString('en-IN')}`);
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
        rowIndex: displayIndex++,
        property_code: codeUpper,
        project_name: rawProj,
        location_name: rawLoc,
        property_type: rawType,
        area_sqft: isNaN(rawArea) ? 0 : rawArea,
        rate_per_sqft: isNaN(rawRate) ? 0 : rawRate,
        total_price: rawPrice || computedPrice || 0,
        status: normalizedStatus,
        plot_number: rawPlotNum,
        survey_number: rawSurvey,
        facing: rawFacing,
        road_width: rawRoadW,
        description: rawDesc,
        latitude: rawLat,
        longitude: rawLng,
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
router.post('/parse', authenticate, requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), upload.single('file'), async (req: Request, res: Response): Promise<void> => {
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
router.post('/commit', authenticate, requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), async (req: Request, res: Response): Promise<void> => {
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

    let userId: number | null = req.user?.id || null;
    let userName: string = req.user?.name || 'Staff Member';

    // Verify userId actually exists in users table to prevent FK constraint failure
    if (userId) {
      try {
        const uCheck = await query('SELECT id, name FROM users WHERE id = $1', [userId]);
        if (uCheck.rowCount === 0) {
          userId = null;
        } else {
          userName = uCheck.rows[0].name;
        }
      } catch {
        userId = null;
      }
    }

    // Fallback to primary admin user if not present or valid
    if (!userId) {
      try {
        const uRes = await query('SELECT id, name FROM users ORDER BY id ASC LIMIT 1');
        if (uRes.rowCount > 0) {
          userId = uRes.rows[0].id;
          userName = uRes.rows[0].name;
        }
      } catch {
        userId = null;
      }
    }

    // 1. Resolve or Create Locations and Projects Cache
    const locMap = new Map<string, number>();
    try {
      const existingLocs = await query('SELECT id, name, city FROM locations');
      for (const l of existingLocs.rows) {
        locMap.set(String(l.name).toLowerCase().trim(), l.id);
        locMap.set(String(l.city).toLowerCase().trim(), l.id);
      }
    } catch {}

    const projMap = new Map<string, number>();
    try {
      const existingProjs = await query('SELECT id, name FROM projects');
      for (const p of existingProjs.rows) {
        projMap.set(String(p.name).toLowerCase().trim(), p.id);
      }
    } catch {}

    let importedCount = 0;
    const errorsList: string[] = [];

    for (const item of validRows) {
      try {
        const locName = (item.location_name || 'Chennai').trim();
        const projName = (item.project_name || 'RKS Property Hub Layout').trim();

        // Resolve or create Location
        let locId: number = locMap.get(locName.toLowerCase()) || 0;
        if (!locId) {
          const existingLoc = await query(
            `SELECT id FROM locations WHERE LOWER(name) = LOWER($1) OR LOWER(city) = LOWER($1) LIMIT 1`,
            [locName]
          );
          if (existingLoc.rowCount > 0) {
            locId = Number(existingLoc.rows[0].id);
          } else {
            const newLoc = await query(
              `INSERT INTO locations (name, city, state) VALUES ($1, $2, 'Tamil Nadu') RETURNING id`,
              [locName, locName]
            );
            locId = Number(newLoc.rows[0].id);
          }
          locMap.set(locName.toLowerCase(), locId);
        }

        // Resolve or create Project
        let projId: number = projMap.get(projName.toLowerCase()) || 0;
        if (!projId) {
          const existingProj = await query(
            `SELECT id FROM projects WHERE LOWER(name) = LOWER($1) LIMIT 1`,
            [projName]
          );
          if (existingProj.rowCount > 0) {
            projId = Number(existingProj.rows[0].id);
          } else {
            const baseCode = `PRJ-${projName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'RKS'}`;
            const projCode = `${baseCode}-${Math.floor(100 + Math.random() * 900)}`;
            const newProj = await query(
              `INSERT INTO projects (name, code, location_id, status)
               VALUES ($1, $2, $3, 'ACTIVE')
               ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
               RETURNING id`,
              [projName, projCode, locId]
            );
            projId = Number(newProj.rows[0].id);
          }
          projMap.set(projName.toLowerCase(), projId);
        }

        const areaSqft = Number(item.area_sqft) || 0;
        const ratePerSqft = Number(item.rate_per_sqft) || 0;
        const totalPrice = Number(item.total_price) || (areaSqft * ratePerSqft);
        const areaSqm = Number((areaSqft * 0.092903).toFixed(2));
        const propCode = String(item.property_code || '').trim().toUpperCase();

        const latVal = item.latitude !== null && item.latitude !== undefined && !isNaN(Number(item.latitude)) ? Number(item.latitude) : null;
        const lngVal = item.longitude !== null && item.longitude !== undefined && !isNaN(Number(item.longitude)) ? Number(item.longitude) : null;

        // Resilient UPSERT on conflict with existing property code
        const propResult = await query(
          `INSERT INTO properties (
            property_code, project_id, location_id, property_type, status,
            plot_number, survey_number, area_sqft, area_sqm, rate_per_sqft,
            total_price, facing, road_width, description, latitude, longitude,
            created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16,
            $17, $18
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
            latitude = COALESCE(EXCLUDED.latitude, properties.latitude),
            longitude = COALESCE(EXCLUDED.longitude, properties.longitude),
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
            latVal,
            lngVal,
            userId,
            userId,
          ]
        );

        const propId = propResult.rows[0]?.id;

        if (propId) {
          // Add default primary image if none exists
          try {
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
          } catch {}

          // Add history record
          try {
            await query(
              `INSERT INTO property_history (property_id, event_type, old_value, new_value, description, changed_by)
               VALUES ($1, 'IMPORTED', null, $2, 'Imported from spreadsheet batch', $3)`,
              [propId, item.status || 'AVAILABLE', userId]
            );
          } catch {}
        }

        importedCount++;
      } catch (rowErr: any) {
        console.error(`Error importing row ${item.property_code}:`, rowErr);
        errorsList.push(`${item.property_code}: ${rowErr.message || 'Insert error'}`);
      }
    }

    if (importedCount === 0 && errorsList.length > 0) {
      res.status(400).json({
        error: `Import failed for all rows. Reason: ${errorsList[0]}`,
        errors: errorsList,
      });
      return;
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
