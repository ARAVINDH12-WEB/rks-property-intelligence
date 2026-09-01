import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatCurrencyINR, formatSqFt } from '../../utils/formatters.js';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  Download,
  Building,
  HelpCircle,
} from 'lucide-react';

export const ImportWizard: React.FC = () => {
  const { showToast, refreshInventory, setActiveTab } = useApp();

  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<any>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [allValidatedRows, setAllValidatedRows] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target schema fields for mapping
  const targetFields = [
    { key: 'property_code', label: 'Property ID / Code', required: true },
    { key: 'project_name', label: 'Project Name', required: true },
    { key: 'location_name', label: 'Location / City', required: true },
    { key: 'property_type', label: 'Property Type', required: true },
    { key: 'area_sqft', label: 'Area in Sq.Ft', required: true },
    { key: 'rate_per_sqft', label: 'Rate per Sq.Ft (₹)', required: true },
    { key: 'total_price', label: 'Total Price (₹)', required: false },
    { key: 'status', label: 'Availability Status', required: false },
    { key: 'plot_number', label: 'Plot / Unit Number', required: false },
    { key: 'survey_number', label: 'Survey Number', required: false },
    { key: 'facing', label: 'Facing Direction', required: false },
    { key: 'road_width', label: 'Road Width', required: false },
    { key: 'description', label: 'Description', required: false },
  ];

  // Step 1: File selection & upload
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsUploading(true);
    try {
      const res = await api.uploadSpreadsheet(selectedFile);
      setFileKey(res.fileKey);
      setHeaders(res.headers);
      setMapping(res.suggestedMapping || {});
      setStep(3); // Go straight to mapping step after auto-parsing
      showToast('Spreadsheet parsed successfully', `Detected ${res.totalRows} rows and ${res.headers.length} columns`, 'success');
    } catch (err: any) {
      showToast('Spreadsheet upload failed', err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Step 4: Validate Mappings
  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await api.validateImport(fileKey, mapping);
      setValidationSummary(res.summary);
      setPreviewRows(res.previewRows);
      setAllValidatedRows(res.allValidatedRows);
      setStep(4);
    } catch (err: any) {
      showToast('Validation failed', err.message, 'error');
    } finally {
      setIsValidating(false);
    }
  };

  // Step 6: Commit Import to DB
  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      const res = await api.commitImport(allValidatedRows, file?.name || 'spreadsheet.xlsx');
      setImportResult(res);
      setStep(6);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      showToast('Import Complete!', res.message, 'success');
      refreshInventory();
    } catch (err: any) {
      showToast('Import Commit Failed', err.message, 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  // Reset Wizard
  const handleReset = () => {
    setStep(1);
    setFile(null);
    setFileKey('');
    setHeaders([]);
    setMapping({});
    setValidationSummary(null);
    setPreviewRows([]);
    setAllValidatedRows([]);
    setImportResult(null);
  };

  // Sample Template CSV download
  const handleDownloadSample = () => {
    const sampleCsv = `Property ID,Project,City,Type,Area SqFt,Rate per SqFt,Status,Plot No,Facing,Survey No
RKS-00901,RKS Green Valley,Chennai,Residential Plot,2400,5200,AVAILABLE,Plot 901,East,144/1
RKS-00902,RKS Grandeur City,Bangalore,Villa,3400,9800,AVAILABLE,Villa G-12,North,86/2
RKS-00903,RKS Silicon Meadows,Hyderabad,Commercial Plot,4800,11000,RESERVED,Tech CP-04,North-East,115/1`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RKS_Property_Import_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [
    { num: 1, label: 'Upload Spreadsheet' },
    { num: 2, label: 'Inspect Columns' },
    { num: 3, label: 'Map Columns' },
    { num: 4, label: 'Validate Data' },
    { num: 5, label: 'Preview' },
    { num: 6, label: 'Commit' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans flex items-center gap-3">
            <span>Import Property Inventory</span>
            <span className="rounded-lg bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-400 border border-amber-500/20">
              6-Step Wizard
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Import Excel (.xlsx, .xls) or CSV spreadsheets directly into the RKS PostgreSQL database with automated validation.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <Download className="h-4 w-4 text-amber-400" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-5 shadow-lg backdrop-blur-md">
        <div className="grid grid-cols-6 gap-2">
          {steps.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold font-mono transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-amber-500 text-black ring-4 ring-amber-500/20 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold truncate max-w-full ${
                    isCurrent ? 'text-amber-400' : isCompleted ? 'text-zinc-200' : 'text-zinc-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: UPLOAD FILE */}
      {step === 1 && (
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-12 text-center shadow-xl">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-[#0A0C10]/60 p-12 cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/5 transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-base font-bold text-white">
              {isUploading ? 'Parsing Spreadsheet...' : 'Drag & Drop your inventory file here'}
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Supports Excel (.xlsx, .xls) and CSV (.csv) formats up to 25MB
            </p>

            <button
              type="button"
              className="mt-5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 group-hover:bg-amber-400"
            >
              Browse Computer
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: COLUMN MAPPING */}
      {step === 3 && (
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Map Spreadsheet Columns</h3>
              <p className="text-xs text-zinc-400">
                Match columns in <span className="text-amber-400 font-semibold">{file?.name}</span> to RKS Property Intelligence fields.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Change File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {targetFields.map((field) => (
              <div key={field.key} className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1">
                    <span>{field.label}</span>
                    {field.required && <span className="text-amber-400 font-bold">*</span>}
                  </label>
                  {mapping[field.key] && (
                    <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                      Mapped
                    </span>
                  )}
                </div>

                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#12161F] px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="">— Not Mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-6">
            <button
              onClick={() => setStep(1)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
            >
              Back
            </button>
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50"
            >
              <span>{isValidating ? 'Validating...' : 'Validate Spreadsheet'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 & 5: VALIDATION SUMMARY & PREVIEW */}
      {(step === 4 || step === 5) && validationSummary && (
        <div className="space-y-6">
          {/* Validation Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Rows</span>
              <div className="mt-1 font-mono text-2xl font-black text-white">{validationSummary.totalRows}</div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Valid Rows</span>
              <div className="mt-1 font-mono text-2xl font-black text-emerald-400">{validationSummary.validRows}</div>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Error Rows</span>
              <div className="mt-1 font-mono text-2xl font-black text-rose-400">{validationSummary.errorRows}</div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Warnings</span>
              <div className="mt-1 font-mono text-2xl font-black text-amber-400">{validationSummary.warningRows}</div>
            </div>
          </div>

          {/* Validation Table Preview */}
          <div className="rounded-2xl border border-zinc-800 bg-[#12161F] shadow-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Import Preview & Diagnostics</h3>
              <span className="text-xs text-zinc-400">Showing first 50 rows</span>
            </div>

            <div className="overflow-x-auto max-h-96 custom-scrollbar">
              <table className="w-full text-left text-xs text-zinc-300 font-sans">
                <thead className="sticky top-0 border-b border-zinc-800 bg-[#0A0C10] font-bold uppercase text-[10px] text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Row</th>
                    <th className="px-4 py-3">Validation Status</th>
                    <th className="px-4 py-3">Property ID</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-right">Area (Sq.Ft)</th>
                    <th className="px-4 py-3 text-right">Rate (/Sq.Ft)</th>
                    <th className="px-4 py-3 text-right">Total Price</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {previewRows.map((row, i) => (
                    <tr key={i} className={`hover:bg-zinc-800/40 ${!row.isValid ? 'bg-rose-950/10' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-zinc-500">{row.rowIndex}</td>
                      <td className="px-4 py-2.5">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            <Check className="h-3 w-3" /> Valid
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {row.errors.map((err: string, errIdx: number) => (
                              <span
                                key={errIdx}
                                className="inline-flex items-center gap-1 rounded bg-rose-950/60 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/30 truncate max-w-xs"
                              >
                                <XCircle className="h-3 w-3 shrink-0" /> {err}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-white">{row.property_code}</td>
                      <td className="px-4 py-2.5 truncate max-w-[120px]">{row.project_name}</td>
                      <td className="px-4 py-2.5 truncate max-w-[100px]">{row.location_name}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatSqFt(row.area_sqft)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-amber-400">₹{row.rate_per_sqft}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">
                        {formatCurrencyINR(row.total_price, true)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={row.status} size="sm" showDot={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#12161F] p-5">
            <button
              onClick={() => setStep(3)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
            >
              Adjust Column Mapping
            </button>

            <button
              onClick={handleCommit}
              disabled={isCommitting || validationSummary.validRows === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50"
            >
              <span>{isCommitting ? 'Importing to PostgreSQL...' : `Commit ${validationSummary.validRows} Valid Properties to Database`}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: COMPLETION SUMMARY */}
      {step === 6 && importResult && (
        <div className="rounded-2xl border border-emerald-500/40 bg-[#12161F] p-12 text-center shadow-2xl space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white">Import Successfully Completed!</h3>
            <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
              {importResult.message} Every record is now persisted to the RKS PostgreSQL database.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setActiveTab('properties')}
              className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400"
            >
              View in Property Inventory
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
