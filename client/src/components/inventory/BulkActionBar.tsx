import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { PropertyStatus } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import {
  CheckSquare,
  X,
  FileDown,
  Archive,
  Trash2,
  FolderKanban,
  CheckCircle,
} from 'lucide-react';

interface BulkActionBarProps {
  selectedIds: number[];
  onClearSelection: () => void;
  onRefresh: () => void;
  onOpenExport: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedIds,
  onClearSelection,
  onRefresh,
  onOpenExport,
}) => {
  const { activeRole, showToast } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  if (selectedIds.length === 0) return null;

  const statuses: PropertyStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'HOLD', 'UPCOMING'];
  const canBulkEdit = activeRole === 'ADMIN' || activeRole === 'MANAGER';

  const handleBulkStatusChange = async (status: PropertyStatus) => {
    setIsProcessing(true);
    try {
      await api.bulkAction(selectedIds, 'STATUS_CHANGE', status);
      showToast(`Updated ${selectedIds.length} properties to ${status}`, 'Bulk status change completed', 'success');
      setStatusMenuOpen(false);
      onClearSelection();
      onRefresh();
    } catch (err: any) {
      showToast('Bulk status update failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${selectedIds.length} selected properties?`)) return;
    setIsProcessing(true);
    try {
      await api.bulkAction(selectedIds, 'ARCHIVE', true);
      showToast(`Archived ${selectedIds.length} properties`, 'Inventory updated', 'success');
      onClearSelection();
      onRefresh();
    } catch (err: any) {
      showToast('Bulk archive failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (activeRole !== 'ADMIN') {
      showToast('Permission Denied', 'Only ADMIN can permanently delete properties', 'error');
      return;
    }
    if (!confirm(`CAUTION: Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} properties? This cannot be undone.`)) return;
    setIsProcessing(true);
    try {
      await api.bulkAction(selectedIds, 'DELETE', true);
      showToast(`Permanently deleted ${selectedIds.length} properties`, 'Database updated', 'success');
      onClearSelection();
      onRefresh();
    } catch (err: any) {
      showToast('Bulk delete failed', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-[#12161F]/95 px-5 py-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2 pr-3 border-r border-zinc-700">
        <CheckSquare className="h-4 w-4 text-amber-400" />
        <span className="font-mono font-bold text-sm text-white">
          {selectedIds.length}
        </span>
        <span className="text-xs text-zinc-400">selected</span>
      </div>

      {/* Bulk Status Menu */}
      {canBulkEdit && (
        <div className="relative">
          <button
            onClick={() => setStatusMenuOpen((prev) => !prev)}
            disabled={isProcessing}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Set Status</span>
          </button>

          {statusMenuOpen && (
            <div className="absolute bottom-12 left-0 z-50 w-44 rounded-xl border border-zinc-700 bg-[#12161F] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                Bulk Set Availability
              </div>
              <div className="mt-1 space-y-1">
                {statuses.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleBulkStatusChange(st)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left hover:bg-zinc-800"
                  >
                    <StatusBadge status={st} size="sm" showDot={false} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Selected */}
      <button
        onClick={onOpenExport}
        disabled={isProcessing}
        className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white"
      >
        <FileDown className="h-3.5 w-3.5 text-cyan-400" />
        <span>Export</span>
      </button>

      {/* Archive */}
      {canBulkEdit && (
        <button
          onClick={handleBulkArchive}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
        >
          <Archive className="h-3.5 w-3.5 text-amber-400" />
          <span>Archive</span>
        </button>
      )}

      {/* Delete (Admin only) */}
      {activeRole === 'ADMIN' && (
        <button
          onClick={handleBulkDelete}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      )}

      {/* Clear selection */}
      <button
        onClick={onClearSelection}
        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        title="Clear Selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
