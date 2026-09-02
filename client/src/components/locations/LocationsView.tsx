import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Location } from '../../types/index.js';
import { formatCurrencyINR } from '../../utils/formatters.js';
import {
  MapPin,
  ArrowRight,
} from 'lucide-react';

export const LocationsView: React.FC = () => {
  const { setActiveTab, setFilterParams } = useApp();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getLocations()
      .then((locRes) => {
        setLocations(locRes.locations);
      })
      .catch((err) => console.error('Error fetching locations:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFilterByLocation = (locId: number) => {
    setFilterParams({ location_id: String(locId) });
    setActiveTab('properties');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            Location & Micro-Market Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Geographic distribution, unit density, and pricing benchmarks across South Indian markets.
          </p>
        </div>
      </div>

      {/* Locations Cards Grid */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/60 text-slate-400 dark:text-zinc-400 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-xs font-medium">Loading Locations...</span>
          </div>
        </div>
      ) : locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 bg-white dark:bg-[#0F141E] p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 mb-3">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No locations added yet</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Add property listings or import spreadsheets to populate micro-markets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="group rounded-3xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#12161F]/90 p-6 shadow-sm dark:shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {loc.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      {loc.city}, {loc.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Breakdown */}
              <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10]/60 p-3 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-sans">Total Units</span>
                  <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {loc.total_properties || 0}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-sans">Available</span>
                  <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {loc.available_properties || 0}
                  </div>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-sans">Inventory Value</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrencyINR(loc.total_inventory_value, true)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-sans">Avg Rate</span>
                    <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                      ₹{Number(loc.average_rate || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/sqft
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-2 border-t border-slate-200 dark:border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => handleFilterByLocation(loc.id)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-xs font-bold hover:bg-black dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
                >
                  <span>Explore Plots in {loc.name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
