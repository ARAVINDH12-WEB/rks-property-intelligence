import React from 'react';
import { Property } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatCurrencyINR } from '../../utils/formatters.js';
import { Eye, Edit2 } from 'lucide-react';

interface PropertyCompactProps {
  properties: Property[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
}

export const PropertyCompact: React.FC<PropertyCompactProps> = ({
  properties,
  selectedIds,
  onToggleSelect,
}) => {
  const { setSelectedPropertyId, setEditingProperty, activeRole } = useApp();
  const canEdit = activeRole === 'ADMIN' || activeRole === 'MANAGER' || activeRole === 'EMPLOYEE';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/90 shadow-sm dark:shadow-xl backdrop-blur-md overflow-hidden divide-y divide-slate-200 dark:divide-zinc-800/60 font-sans">
      {properties.map((prop) => {
        const isSelected = selectedIds.includes(prop.id);
        return (
          <div
            key={prop.id}
            className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${
              isSelected ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-center gap-4 truncate">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(prop.id)}
                className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-amber-500 focus:ring-amber-500/30 accent-amber-500 cursor-pointer"
              />

              <button
                onClick={() => setSelectedPropertyId(prop.id)}
                className="font-mono font-bold text-slate-900 dark:text-white text-sm hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer"
              >
                {prop.property_code}
              </button>

              <span className="text-xs text-slate-800 dark:text-zinc-300 font-semibold truncate max-w-[150px]">
                {prop.project_name}
              </span>

              <span className="text-xs text-slate-500 dark:text-zinc-500 truncate max-w-[100px]">
                {prop.city}
              </span>

              <span className="hidden md:inline-flex rounded bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-zinc-400">
                {prop.property_type}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right font-mono text-xs text-slate-700 dark:text-zinc-300">
                <span className="font-bold">{Number(prop.area_sqft).toLocaleString('en-IN')}</span> sq.ft
              </div>

              <div className="text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                ₹{Number(prop.rate_per_sqft).toLocaleString('en-IN')}
              </div>

              <div className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 min-w-[90px]">
                {formatCurrencyINR(prop.total_price, true)}
              </div>

              <StatusBadge status={prop.status} size="sm" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedPropertyId(prop.id)}
                  className="rounded p-1 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => setEditingProperty(prop)}
                    className="rounded p-1 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
