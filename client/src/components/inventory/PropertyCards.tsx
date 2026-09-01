import React from 'react';
import { Property } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatCurrencyINR, formatSqFt, formatRate } from '../../utils/formatters.js';
import { Eye, Edit2, MapPin, Compass, ShieldCheck, Calendar } from 'lucide-react';

interface PropertyCardsProps {
  properties: Property[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
}

export const PropertyCards: React.FC<PropertyCardsProps> = ({
  properties,
  selectedIds,
  onToggleSelect,
}) => {
  const { setSelectedPropertyId, setEditingProperty, openSiteVisitModal, activeRole } = useApp();
  const canEdit = activeRole === 'ADMIN' || activeRole === 'MANAGER' || activeRole === 'EMPLOYEE';

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((prop) => {
        const isSelected = selectedIds.includes(prop.id);
        const imageUrl =
          prop.primary_image_url ||
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80';

        return (
          <div
            key={prop.id}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white dark:bg-[#12161F]/90 shadow-sm dark:shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-md dark:hover:shadow-2xl ${
              isSelected ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-200 dark:border-zinc-800/80'
            }`}
          >
            {/* Top Media Banner */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-zinc-900">
              <img
                src={imageUrl}
                alt={prop.property_code}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <StatusBadge status={prop.status} size="sm" />
              </div>

              {/* Selection Checkbox */}
              <div className="absolute top-3 right-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(prop.id)}
                  className="h-5 w-5 rounded border-slate-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/80 text-amber-500 focus:ring-amber-500/30 accent-amber-500 cursor-pointer shadow-md"
                />
              </div>

              {/* Property ID pill */}
              <div className="absolute bottom-2.5 left-3">
                <span className="font-mono text-sm font-black text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                  {prop.property_code}
                </span>
              </div>

              {/* Type tag */}
              <div className="absolute bottom-2.5 right-3 text-[11px] font-medium text-zinc-200 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                {prop.property_type}
              </div>
            </div>

            {/* Card Content Body */}
            <div className="flex flex-1 flex-col p-4">
              {/* Project & Location */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                  {prop.project_name || 'RKS Township'}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 truncate">
                  <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>
                    {prop.city || 'Chennai'} • {prop.location_name}
                  </span>
                </div>
              </div>

              {/* Core 4-Grid Metrics */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#0A0C10]/60 p-2.5 font-mono">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase font-sans">
                    Area
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {formatSqFt(prop.area_sqft)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase font-sans">
                    Rate / Sq.Ft
                  </div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    ₹{Number(prop.rate_per_sqft).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-zinc-800/60 flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase font-sans">
                    Total Price
                  </div>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyINR(prop.total_price, true)}
                  </div>
                </div>
              </div>

              {/* Facing & Plot specs */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 border-t border-slate-200 dark:border-zinc-800/60 pt-2">
                <div className="flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                  <span>{prop.facing || 'East'} Facing</span>
                </div>
                {prop.plot_number && (
                  <div className="font-mono text-slate-700 dark:text-zinc-300">{prop.plot_number}</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800/60">
                <button
                  onClick={() => setSelectedPropertyId(prop.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => openSiteVisitModal(prop)}
                  className="flex items-center justify-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                  title="Book Site Visit"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Visit</span>
                </button>

                {canEdit && (
                  <button
                    onClick={() => setEditingProperty(prop)}
                    className="flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-400 hover:bg-amber-500/20 transition-colors"
                    title="Edit Property"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
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
