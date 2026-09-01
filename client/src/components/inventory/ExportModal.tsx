import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { FileSpreadsheet, FileText, Download, X, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  selectedIds: number[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  selectedIds,
  onClose,
}) => {
  const { filterParams, showToast } = useApp();
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [scope, setScope] = useState<'selected' | 'filtered' | 'all'>(
    selectedIds.length > 0 ? 'selected' : 'filtered'
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      const exportIds = scope === 'selected' ? selectedIds : undefined;
      const exportFilters = scope === 'filtered' ? filterParams : undefined;

      const url = api.getExportUrl(format, exportIds, exportFilters);
      window.open(url, '_blank');
      showToast('Export Initiated', `Downloading ${format.toUpperCase()} file...`, 'success');
      onClose();
    } catch (err: any) {
      showToast('Export Failed', err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#12161F] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Inventory Data</h3>
              <p className="text-xs text-zinc-400">Download formatted property records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm">
          {/* Format Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Export Format
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-semibold transition-all ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-800 bg-[#0A0C10] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-semibold transition-all ${
                  format === 'csv'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-800 bg-[#0A0C10] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Export Scope
            </label>
            <div className="mt-2 space-y-2">
              {selectedIds.length > 0 && (
                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-[#0A0C10] p-3 cursor-pointer hover:border-zinc-700">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'selected'}
                    onChange={() => setScope('selected')}
                    className="h-4 w-4 accent-amber-500"
                  />
                  <div>
                    <span className="font-semibold text-white">Selected Properties Only</span>
                    <p className="text-xs text-zinc-400 font-mono">{selectedIds.length} properties selected</p>
                  </div>
                </label>
              )}

              <label className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-[#0A0C10] p-3 cursor-pointer hover:border-zinc-700">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'filtered'}
                  onChange={() => setScope('filtered')}
                  className="h-4 w-4 accent-amber-500"
                />
                <div>
                  <span className="font-semibold text-white">Current Filtered Results</span>
                  <p className="text-xs text-zinc-400">Export inventory matching your active filters</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-[#0A0C10] p-3 cursor-pointer hover:border-zinc-700">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="h-4 w-4 accent-amber-500"
                />
                <div>
                  <span className="font-semibold text-white">Complete Inventory</span>
                  <p className="text-xs text-zinc-400">Export all active properties in database</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Download Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
