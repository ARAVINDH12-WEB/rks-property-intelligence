import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { 
  Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, 
  X, RefreshCw, Layers, ShieldCheck, ArrowRight, FileCheck 
} from 'lucide-react';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedLead {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status?: string;
  property_code?: string;
  notes?: string;
  _rawPhone: string;
  _isValid: boolean;
  _validationError?: string;
}

const SAMPLE_CSV = `Name,Phone,Email,Source,Stage,PlotCode,Notes
Senthil Kumar,9840112233,senthil.k@gmail.com,PHONE_INQUIRY,NEW,RKS-EV-001,Looking for 1200 sqft in Chennai corridor
Anitha Radhakrishnan,9789223344,anitha.r@yahoo.com,WEBSITE,CONTACTED,RKS-GA-002,Interested in Trichy Golden Acres
Karthik Natarajan,9940334455,karthik.n@outlook.com,WHATSAPP,SITE_VISIT_SCHEDULED,RKS-CB-003,Requested site visit with cab pickup
Praveen Sundar,9444556677,,WALK_IN,NEGOTIATION,RKS-RS-005,Corner plot enquiry
Deepa Chandran,9884667788,deepa.c@gmail.com,REFERRAL,CLOSED_WON,RKS-HS-002,Token payment processed`;

export const LeadImportModal: React.FC<LeadImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedLead[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'merge' | 'import'>('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    failed: number;
    total: number;
    errors: Array<{ row: number; name?: string; phone?: string; error: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rks_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadFailedErrorsCSV = () => {
    if (!importResult?.errors?.length) return;
    let csv = 'Row,Name,Phone,Error\n';
    importResult.errors.forEach(e => {
      csv += `${e.row},"${(e.name || '').replace(/"/g, '""')}","${e.phone || ''}","${(e.error || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rks_lead_import_errors.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileProcess = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (json.length === 0) {
        showToast('Empty File', 'The uploaded file contains no rows.', 'error');
        return;
      }

      const rows: ParsedLead[] = json.map((row: any) => {
        const findKey = (candidates: string[]) => {
          const keys = Object.keys(row);
          for (const cand of candidates) {
            const match = keys.find(k => k.trim().toLowerCase() === cand.toLowerCase());
            if (match && row[match] !== undefined) return row[match];
          }
          return '';
        };

        const name = String(findKey(['name', 'lead name', 'customer', 'customer name', 'client']) || '').trim();
        const rawPhone = String(findKey(['phone', 'mobile', 'contact', 'phone number', 'cell', 'telephone']) || '').trim();
        const email = String(findKey(['email', 'email address', 'mail']) || '').trim();
        const source = String(findKey(['source', 'lead source', 'channel', 'origin']) || 'BULK_IMPORT').trim();
        const stage = String(findKey(['stage', 'status', 'pipeline stage']) || 'NEW').trim();
        const property_code = String(findKey(['plotcode', 'plot_code', 'property_code', 'plot', 'project', 'property']) || '').trim();
        const notes = String(findKey(['notes', 'remarks', 'comment', 'description']) || '').trim();

        const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
        let isValid = true;
        let validationError = '';

        if (!name) {
          isValid = false;
          validationError = 'Missing name';
        } else if (cleanPhone.length !== 10) {
          isValid = false;
          validationError = 'Invalid 10-digit phone';
        }

        return {
          name,
          phone: cleanPhone,
          email: email || undefined,
          source: source || 'BULK_IMPORT',
          status: stage || 'NEW',
          property_code: property_code || undefined,
          notes: notes || undefined,
          _rawPhone: rawPhone,
          _isValid: isValid,
          _validationError: validationError
        };
      });

      setParsedRows(rows);
      setStep(2);
    } catch (err: any) {
      showToast('File Parsing Error', err.message || 'Could not parse file.', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    const validLeads = parsedRows.filter(r => r._isValid);
    if (validLeads.length === 0) {
      showToast('No Valid Leads', 'All rows failed validation. Check errors and try again.', 'error');
      return;
    }

    try {
      setIsImporting(true);
      const res = await api.postLeadsBatch(validLeads, duplicateMode);
      setImportResult(res);
      setStep(3);
      showToast('Import Complete', `Processed ${res.total} rows. ${res.imported} imported.`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast('Import Failed', err.message || 'An error occurred during import.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r._isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0D121B] border border-slate-700/60 w-full max-w-4xl rounded-2xl shadow-luxury-dark overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-teal/20 to-brand-navy border border-brand-teal/40 flex items-center justify-center text-brand-teal-light">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white font-sans">Bulk Leads Ingestion Engine</h3>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal-light border border-brand-teal/30">
                  CSV / Excel Parser
                </span>
              </div>
              <p className="text-xs text-slate-400">Import enquiries, plot interests, and client records seamlessly</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center justify-between px-8 py-3 bg-[#111723] border-b border-slate-800/80 text-xs">
          <div className={`flex items-center gap-2 font-medium ${step >= 1 ? 'text-brand-teal-light' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-brand-teal text-white' : 'bg-slate-800 text-slate-400'}`}>1</span>
            <span>Upload Document</span>
          </div>
          <div className="w-12 h-px bg-slate-800" />
          <div className={`flex items-center gap-2 font-medium ${step >= 2 ? 'text-brand-teal-light' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-brand-teal text-white' : 'bg-slate-800 text-slate-400'}`}>2</span>
            <span>Validation & Duplicate Policy</span>
          </div>
          <div className="w-12 h-px bg-slate-800" />
          <div className={`flex items-center gap-2 font-medium ${step === 3 ? 'text-brand-teal-light' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-brand-teal text-white' : 'bg-slate-800 text-slate-400'}`}>3</span>
            <span>Summary & Audit</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200">
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div 
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-brand-teal/60 rounded-2xl p-10 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 border border-brand-teal/30 group-hover:scale-105 transition-transform flex items-center justify-center text-brand-teal-light">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-semibold text-white text-base">Drop your .csv, .xlsx, or .xls file here</p>
                  <p className="text-xs text-slate-400 mt-1">Supports UTF-8 CSV, Microsoft Excel 97-2004 & modern XLSX</p>
                </div>
                <button 
                  type="button"
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-teal-light border border-slate-700"
                >
                  Browse Files
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={e => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
                  accept=".csv, .xlsx, .xls"
                  className="hidden" 
                />
              </div>

              {/* Template Download Utility */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Need the standard spreadsheet format?</h4>
                    <p className="text-xs text-slate-400">Download our pre-formatted template with all columns and sample leads.</p>
                  </div>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Duplicate Handling */}
          {step === 2 && (
            <div className="space-y-5">
              {/* File Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs text-slate-400">Total Rows Detected</span>
                  <p className="text-xl font-bold text-white font-mono mt-0.5">{parsedRows.length}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid Records
                  </span>
                  <p className="text-xl font-bold text-emerald-300 font-mono mt-0.5">{validCount}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30">
                  <span className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Invalid / Incomplete
                  </span>
                  <p className="text-xl font-bold text-rose-300 font-mono mt-0.5">{invalidCount}</p>
                </div>
              </div>

              {/* Duplicate Handling Policy */}
              <div className="p-4 rounded-xl bg-[#111723] border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-brand-teal" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Phone Duplicate Resolution Strategy
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  If a phone number already exists in the RKS leads registry:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label 
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      duplicateMode === 'skip' 
                        ? 'bg-brand-teal/15 border-brand-teal text-white' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="dup" 
                      checked={duplicateMode === 'skip'} 
                      onChange={() => setDuplicateMode('skip')}
                      className="mt-0.5" 
                    />
                    <div>
                      <span className="font-semibold block">Skip duplicates</span>
                      <span className="text-[11px] opacity-75">Keep original database lead intact without changes.</span>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      duplicateMode === 'merge' 
                        ? 'bg-brand-teal/15 border-brand-teal text-white' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="dup" 
                      checked={duplicateMode === 'merge'} 
                      onChange={() => setDuplicateMode('merge')}
                      className="mt-0.5" 
                    />
                    <div>
                      <span className="font-semibold block">Merge & Update</span>
                      <span className="text-[11px] opacity-75">Update plot interest and append notes to existing record.</span>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      duplicateMode === 'import' 
                        ? 'bg-brand-teal/15 border-brand-teal text-white' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="dup" 
                      checked={duplicateMode === 'import'} 
                      onChange={() => setDuplicateMode('import')}
                      className="mt-0.5" 
                    />
                    <div>
                      <span className="font-semibold block">Import as New</span>
                      <span className="text-[11px] opacity-75">Insert fresh entry even if phone matches prior record.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Row Preview (First 8 Rows)
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Showing {Math.min(8, parsedRows.length)} of {parsedRows.length}
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0B0F17] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2">Stage</th>
                        <th className="px-3 py-2">Plot Code</th>
                        <th className="px-3 py-2">Source</th>
                        <th className="px-3 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {parsedRows.slice(0, 8).map((row, i) => (
                        <tr key={i} className={row._isValid ? 'hover:bg-slate-800/30' : 'bg-rose-950/20 text-rose-200'}>
                          <td className="px-3 py-2">
                            {row._isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/30" title={row._validationError}>
                                <AlertCircle className="w-3 h-3" /> {row._validationError}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium text-white">{row.name || '-'}</td>
                          <td className="px-3 py-2 font-mono text-slate-300">{row.phone || row._rawPhone || '-'}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-amber-400">{row.property_code || '-'}</td>
                          <td className="px-3 py-2 text-slate-400">{row.source}</td>
                          <td className="px-3 py-2 text-slate-400 truncate max-w-[140px]">{row.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Summary & Audit Report */}
          {step === 3 && importResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Bulk Ingestion Successfully Executed</h3>
                <p className="text-xs text-slate-400 mt-1">Audit log record registered under action LEADS_BULK_IMPORTED</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Total Processed</span>
                  <p className="text-xl font-bold text-white font-mono">{importResult.total}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-xs text-emerald-400">Imported / Updated</span>
                  <p className="text-xl font-bold text-emerald-300 font-mono">{importResult.imported}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40">
                  <span className="text-xs text-amber-400">Skipped Duplicates</span>
                  <p className="text-xl font-bold text-amber-300 font-mono">{importResult.skipped}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                  <span className="text-xs text-rose-400">Failed / Rejected</span>
                  <p className="text-xl font-bold text-rose-300 font-mono">{importResult.failed}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="max-w-2xl mx-auto p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-left flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <h5 className="text-xs font-semibold text-rose-300">{importResult.errors.length} rows encountered errors</h5>
                      <p className="text-[11px] text-rose-400/80">Download error report for invalid mobile numbers or missing names.</p>
                    </div>
                  </div>
                  <button
                    onClick={downloadFailedErrorsCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-rose-200 border border-rose-500/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Errors
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#0B0F17]">
          {step === 1 && (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <span className="text-xs text-slate-500">Step 1 of 3: Select File</span>
            </>
          )}

          {step === 2 && (
            <>
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800"
              >
                ← Back to Upload
              </button>
              <button
                disabled={validCount === 0 || isImporting}
                onClick={handleExecuteImport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-teal-600 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-teal-900/30 disabled:opacity-50 transition-all"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting Leads...
                  </>
                ) : (
                  <>
                    Import {validCount} Leads <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs shadow-md transition-colors"
              >
                Done & Return to Pipeline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
