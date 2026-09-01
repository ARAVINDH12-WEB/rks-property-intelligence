import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AuditLogItem } from '../../types/index.js';
import { formatDateTime } from '../../utils/formatters.js';
import {
  History,
  Search,
  Filter,
  User,
  Building,
  RefreshCw,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [propertyCodeQuery, setPropertyCodeQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = (page: number = 1) => {
    setIsLoading(true);
    api
      .getAuditLogs({
        page,
        limit: 30,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        property_code: propertyCodeQuery.trim() || undefined,
      })
      .then((res) => {
        setLogs(res.audit_logs);
        setPagination(res.pagination);
      })
      .catch((err) => console.error('Error loading audit logs:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const actionBadgeColors: Record<string, string> = {
    CREATE: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30',
    UPDATE: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30',
    INLINE_EDIT: 'bg-amber-950/60 text-amber-400 border-amber-500/30',
    STATUS_CHANGE: 'bg-purple-950/60 text-purple-400 border-purple-500/30',
    IMPORT: 'bg-blue-950/60 text-blue-400 border-blue-500/30',
    BULK_UPDATE: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    DELETE: 'bg-rose-950/60 text-rose-400 border-rose-500/30',
    ARCHIVE: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans flex items-center gap-2.5">
            <History className="h-6 w-6 text-amber-400" />
            <span>Master Audit Trail & Revisions</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete immutable log of all inventory modifications, price changes, and status shifts.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-4 sm:flex-row sm:items-center sm:justify-between shadow-lg">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={propertyCodeQuery}
            onChange={(e) => setPropertyCodeQuery(e.target.value)}
            placeholder="Search by Property Code (e.g. RKS-00124)..."
            className="w-full rounded-xl border border-zinc-800 bg-[#0A0C10] pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500 font-mono"
          />
        </form>

        {/* Action Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            'ALL',
            'CREATE',
            'UPDATE',
            'INLINE_EDIT',
            'STATUS_CHANGE',
            'IMPORT',
            'BULK_UPDATE',
          ].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                actionFilter === act
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-[#12161F]/60 text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-xs font-medium">Fetching Audit Trail...</span>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#12161F]/40 p-8 text-center text-zinc-500">
          <History className="h-10 w-10 text-zinc-600 mb-2" />
          <span className="text-sm font-semibold text-zinc-400">No audit records found</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#12161F] shadow-xl">
          <table className="w-full text-left text-xs text-zinc-300 font-sans">
            <thead className="border-b border-zinc-800 bg-[#0A0C10] font-bold uppercase text-[10px] text-zinc-400">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Property</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Field</th>
                <th className="px-4 py-3.5">Old Value</th>
                <th className="px-4 py-3.5">New Value</th>
                <th className="px-4 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                    {log.user_name || 'System'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                    {log.property_code || 'SYSTEM'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                        actionBadgeColors[log.action] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400">
                    {log.field_name || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-500 max-w-[120px] truncate">
                    {log.old_value || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-400 max-w-[120px] truncate">
                    {log.new_value || '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && logs.length > 0 && (
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4 text-xs text-zinc-400">
          <span>
            Showing page <strong className="text-white font-mono">{pagination.page}</strong> of{' '}
            <strong className="text-white font-mono">{pagination.totalPages}</strong> ({pagination.total} total logs)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
