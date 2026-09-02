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
  XCircle,
  ArrowRight,
  RotateCcw,
  Check,
  Download,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Database,
  Zap,
} from 'lucide-react';

export const ImportWizard: React.FC = () => {
  const { showToast, refreshInventory, setActiveTab } = useApp();

  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sampleRows, setSampleRows] = useState<any[]>([]);

  const [validationSummary, setValidationSummary] = useState<any>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [allValidatedRows, setAllValidatedRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetFields = [
    { key: 'property_code', label: 'Property ID / Code', required: true },
    { key: 'project_name', label: 'Project Name', required: true },
    { key: 'location_name', label: 'Location / City', required: true },
    { key: 'property_type', label: 'Property Type', required: false },
    { key: 'area_sqft', label: 'Area in Sq.Ft', required: true },
    { key: 'rate_per_sqft', label: 'Rate per Sq.Ft', required: true },
    { key: 'total_price', label: 'Total Price', required: false },
    { key: 'status', label: 'Availability Status', required: false },
    { key: 'plot_number', label: 'Plot / Unit Number', required: false },
    { key: 'survey_number', label: 'Survey Number', required: false },
    { key: 'facing', label: 'Facing Direction', required: false },
    { key: 'road_width', label: 'Road Width', required: false },
    { key: 'description', label: 'Description', required: false },
    { key: 'google_maps_url', label: 'Google Maps Link / URL', required: false },
    { key: 'latitude', label: 'Latitude', required: false },
    { key: 'longitude', label: 'Longitude', required: false },
  ];

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsUploading(true);
    try {
      const res = await api.parseAndValidateSpreadsheet(selectedFile);
      setHeaders(res.headers || []);
      setMapping(res.suggestedMapping || {});
      setSampleRows(res.sampleRows || []);
      if (res.stage === 'validated') {
        setValidationSummary(res.summary);
        setPreviewRows(res.previewRows || []);
        setAllValidatedRows(res.allValidatedRows || []);
        setStep(3);
        showToast('Parsed & validated!', `${res.summary.totalRows} rows, ${res.summary.validRows} valid`, 'success');
      } else {
        setStep(2);
        showToast('Review column mapping', `${res.totalRows} rows detected`, 'info');
      }
    } catch (err: any) {
      showToast('Upload Failed', err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidateWithMapping = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.parseAndValidateSpreadsheet(file, mapping);
      setValidationSummary(res.summary);
      setPreviewRows(res.previewRows || []);
      setAllValidatedRows(res.allValidatedRows || []);
      setStep(3);
      showToast('Validation complete!', `${res.summary.validRows} valid rows ready`, 'success');
    } catch (err: any) {
      showToast('Validation Failed', err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      const res = await api.commitImport(allValidatedRows, file?.name || 'spreadsheet.xlsx');
      setImportResult(res);
      setStep(4);
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'] });
      showToast('Import Complete!', res.message, 'success');
      refreshInventory();
    } catch (err: any) {
      showToast('Import Failed', err.message, 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReset = () => {
    setStep(1); setFile(null); setHeaders([]); setMapping({});
    setSampleRows([]); setValidationSummary(null);
    setPreviewRows([]); setAllValidatedRows([]); setImportResult(null);
  };

  const handleDownloadSample = () => {
    const csv = `Property ID,Project,City,Type,Area SqFt,Rate per SqFt,Status,Plot No,Facing,Survey No,Google Maps Link
RKS-00901,RKS Green Valley,Chennai,Residential Plot,2400,5200,AVAILABLE,Plot 901,East,144/1,https://www.google.com/maps/@12.9010,80.2279,15z
RKS-00902,RKS Grandeur City,Bangalore,Villa,3400,9800,AVAILABLE,Villa G-12,North,86/2,https://www.google.com/maps/@12.9698,77.7500,15z`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'RKS_Import_Template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [
    { num: 1, label: 'Upload File', icon: UploadCloud },
    { num: 2, label: 'Map Columns', icon: FileSpreadsheet },
    { num: 3, label: 'Review', icon: Zap },
    { num: 4, label: 'Done!', icon: CheckCircle2 },
  ];

  const requiredMapped = targetFields.filter(f => f.required).every(f => mapping[f.key]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
              <Database className="h-5 w-5" />
            </span>
            Import Property Inventory
            <span className="rounded-xl bg-violet-500/10 border border-violet-400/30 px-3 py-0.5 text-xs font-bold text-violet-600 dark:text-violet-400">Smart Wizard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Import Excel or CSV — auto-mapped, validated, and committed in seconds.</p>
        </div>
        <button onClick={handleDownloadSample} className="flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-700/60 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
          <Download className="h-4 w-4" /> Download Sample CSV
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/90 p-5 shadow-sm">
        <div className="flex items-center">
          {steps.map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                    isCompleted ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg'
                    : isCurrent ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white ring-4 ring-violet-400/25 shadow-lg'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5 stroke-[2.5]" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] font-bold text-center ${
                    isCurrent ? 'text-violet-600 dark:text-violet-400'
                    : isCompleted ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-zinc-500'
                  }`}>{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full ${step > s.num ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-200 dark:bg-zinc-700'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`cursor-pointer rounded-3xl border-2 border-dashed p-16 text-center transition-all ${
            isDragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10'
            : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12161F] hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/5'
          }`}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
          <div className="flex flex-col items-center gap-4">
            <div className={`flex h-20 w-20 items-center justify-center rounded-3xl ${isUploading
              ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-500'
              : 'bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 text-violet-600 dark:text-violet-400'}`}>
              {isUploading ? <Sparkles className="h-9 w-9 animate-spin" /> : <UploadCloud className="h-9 w-9" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {isUploading ? 'Analysing spreadsheet...' : 'Drop your inventory file here'}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
                {isUploading ? 'Auto-detecting columns and validating rows...' : 'Excel (.xlsx, .xls) or CSV (.csv) up to 25 MB'}
              </p>
            </div>
            {!isUploading && (
              <button type="button" className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 transition-all">
                Browse Computer
              </button>
            )}
            {!isUploading && (
              <div className="flex items-center gap-6 flex-wrap justify-center">
                {['Auto column mapping', 'Duplicate detection', 'Price cross-check', 'Instant DB commit'].map(f => (
                  <span key={f} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500">
                    <Check className="h-3.5 w-3.5 text-emerald-500" /> {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-violet-500" /> Map Spreadsheet Columns
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Match columns from <span className="font-bold text-violet-600 dark:text-violet-400">{file?.name}</span> to RKS property fields.
              </p>
            </div>
            <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-500 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" /> Change File
            </button>
          </div>

          {sampleRows.length > 0 && (
            <div className="rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-4 overflow-x-auto">
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2">Sample Data Preview</p>
              <table className="text-xs">
                <thead><tr>{headers.map(h => <th key={h} className="px-2 py-1 text-left text-slate-600 dark:text-zinc-400 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>{sampleRows.slice(0, 3).map((row, i) => (<tr key={i}>{headers.map(h => <td key={h} className="px-2 py-1 text-slate-700 dark:text-zinc-300 whitespace-nowrap">{String(row[h] ?? '')}</td>)}</tr>))}</tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {targetFields.map((field) => (
              <div key={field.key} className={`rounded-2xl border p-4 transition-all ${
                mapping[field.key] ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-900/10'
                : field.required ? 'border-amber-200 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/5'
                : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  {mapping[field.key] && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-2.5 w-2.5" /></span>}
                </div>
                <select value={mapping[field.key] || ''} onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-500 transition-all">
                  <option value="">— Not Mapped —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button onClick={handleReset} className="rounded-xl border border-slate-300 dark:border-zinc-700 px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Back</button>
            <button onClick={handleValidateWithMapping} disabled={!requiredMapped || isUploading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-40 transition-all hover:from-violet-500 hover:to-indigo-500">
              {isUploading ? 'Validating...' : 'Validate Data'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && validationSummary && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Rows', value: validationSummary.totalRows, grad: 'from-slate-600 to-slate-700', border: 'border-slate-200 dark:border-zinc-700', bg: 'bg-slate-50 dark:bg-zinc-900/50' },
              { label: 'Valid Rows', value: validationSummary.validRows, grad: 'from-emerald-500 to-teal-600', border: 'border-emerald-200 dark:border-emerald-700/50', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
              { label: 'Error Rows', value: validationSummary.errorRows, grad: 'from-rose-500 to-red-600', border: 'border-rose-200 dark:border-rose-700/50', bg: 'bg-rose-50 dark:bg-rose-900/10' },
              { label: 'Warnings', value: validationSummary.warningRows, grad: 'from-amber-500 to-orange-500', border: 'border-amber-200 dark:border-amber-700/50', bg: 'bg-amber-50 dark:bg-amber-900/10' },
            ].map(({ label, value, grad, border, bg }) => (
              <div key={label} className={`rounded-2xl border ${border} ${bg} p-5 text-center shadow-sm`}>
                <div className={`text-3xl font-black bg-gradient-to-br ${grad} bg-clip-text text-transparent`}>{value}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-violet-50/80 to-indigo-50/80 dark:from-violet-900/10 dark:to-indigo-900/10">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Zap className="h-4 w-4 text-violet-500" /> Import Preview & Diagnostics</h3>
              <span className="text-xs text-slate-500 dark:text-zinc-400">First 50 rows</span>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                  <tr>{['Row', 'Status', 'Property ID', 'Project', 'Location', 'Area', 'Rate', 'Total Price', 'Avail.'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {previewRows.map((row, i) => (
                    <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors ${!row.isValid ? 'bg-rose-50/40 dark:bg-rose-900/5' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-slate-400 dark:text-zinc-500 text-[11px]">{row.rowIndex}</td>
                      <td className="px-4 py-2.5">
                        {row.isValid
                          ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"><Check className="h-3 w-3" /> Valid</span>
                          : <div className="space-y-0.5">{row.errors.map((err: string, ei: number) => (
                              <span key={ei} className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400"><XCircle className="h-3 w-3 shrink-0" /> {err}</span>
                            ))}</div>
                        }
                        {row.warnings?.length > 0 && row.warnings.map((w: string, wi: number) => (
                          <span key={wi} className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-0.5"><AlertTriangle className="h-3 w-3 shrink-0" /> {w}</span>
                        ))}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white text-[11px]">{row.property_code}</td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-zinc-300 max-w-[110px] truncate">{row.project_name}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-zinc-400 max-w-[90px] truncate">{row.location_name}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-700 dark:text-zinc-300">{formatSqFt(row.area_sqft)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">Rs.{row.rate_per_sqft?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyINR(row.total_price, true)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={row.status} size="sm" showDot={false} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="rounded-xl border border-slate-300 dark:border-zinc-700 px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Adjust Mapping</button>
              {validationSummary.errorRows > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> {validationSummary.errorRows} error rows will be skipped
                </span>
              )}
            </div>
            <button onClick={handleCommit} disabled={isCommitting || validationSummary.validRows === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 transition-all">
              <Database className="h-4 w-4" />
              {isCommitting ? 'Importing...' : `Commit ${validationSummary.validRows} Properties`}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 4 && importResult && (
        <div className="rounded-3xl border border-emerald-200 dark:border-emerald-700/40 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/10 dark:to-[#12161F] p-16 text-center shadow-xl space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl shadow-emerald-500/40">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">Import Complete!</h3>
            <p className="mt-2 text-base text-slate-600 dark:text-zinc-400 max-w-md mx-auto">{importResult.message}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">All records are now persisted to the RKS PostgreSQL database.</p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setActiveTab('properties')}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 transition-all">
              View Imported Properties
            </button>
            <button onClick={handleReset}
              className="rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
