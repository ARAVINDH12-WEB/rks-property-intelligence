import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { Project, Location, PropertyFilterParams } from '../../types/index.js';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  locations: Location[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  locations,
}) => {
  const { filterParams, setFilterParams, resetFilters } = useApp();

  if (!isOpen) return null;

  const statuses = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'HOLD', 'UPCOMING', 'DRAFT'];
  const propertyTypes = [
    'Residential Plot',
    'Commercial Plot',
    'Villa',
    'Apartment',
    'Agricultural Land',
    'Industrial',
  ];
  const facings = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];

  const handleChange = (key: keyof PropertyFilterParams, val: any) => {
    setFilterParams((prev) => ({
      ...prev,
      [key]: val === '' ? undefined : val,
      page: 1, // reset to page 1 on filter change
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-[#0D1017] shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <SlidersHorizontal className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-base">Filter Inventory</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-400 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters Scroll Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Availability Status
            </label>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                onClick={() => handleChange('status', undefined)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  !filterParams.status
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                ALL
              </button>
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => handleChange('status', filterParams.status === st ? undefined : st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filterParams.status === st
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Project
            </label>
            <select
              value={filterParams.project_id || ''}
              onChange={(e) => handleChange('project_id', e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Location / City
            </label>
            <select
              value={filterParams.location_id || ''}
              onChange={(e) => handleChange('location_id', e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.city} - {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Property Type
            </label>
            <select
              value={filterParams.property_type || ''}
              onChange={(e) => handleChange('property_type', e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            >
              <option value="">All Types</option>
              {propertyTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Area Range */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Area Range (Sq.Ft)
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min Sq.Ft"
                value={filterParams.min_area || ''}
                onChange={(e) => handleChange('min_area', e.target.value)}
                className="rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500 font-mono"
              />
              <input
                type="number"
                placeholder="Max Sq.Ft"
                value={filterParams.max_area || ''}
                onChange={(e) => handleChange('max_area', e.target.value)}
                className="rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Rate Range */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Rate Range (₹ / Sq.Ft)
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min ₹/sqft"
                value={filterParams.min_rate || ''}
                onChange={(e) => handleChange('min_rate', e.target.value)}
                className="rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500 font-mono"
              />
              <input
                type="number"
                placeholder="Max ₹/sqft"
                value={filterParams.max_rate || ''}
                onChange={(e) => handleChange('max_rate', e.target.value)}
                className="rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Facing */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Facing Direction
            </label>
            <select
              value={filterParams.facing || ''}
              onChange={(e) => handleChange('facing', e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            >
              <option value="">Any Direction</option>
              {facings.map((f) => (
                <option key={f} value={f}>
                  {f} Facing
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-4 bg-[#0A0C10]">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-amber-500 py-2.5 font-bold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
