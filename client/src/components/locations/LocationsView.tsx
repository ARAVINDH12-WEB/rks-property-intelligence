import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Location } from '../../types/index.js';
import { formatCurrencyINR } from '../../utils/formatters.js';
import { MapPin, Building, ArrowRight, TrendingUp } from 'lucide-react';

export const LocationsView: React.FC = () => {
  const { setActiveTab, setFilterParams } = useApp();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .getLocations()
      .then((res) => setLocations(res.locations))
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
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
          Location & Micro-Market Intelligence
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Geographic distribution, unit density, and pricing benchmarks across South Indian markets.
        </p>
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/60 text-slate-400 dark:text-zinc-400 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-xs font-medium">Loading Locations...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => handleFilterByLocation(loc.id)}
              className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#12161F]/90 p-6 shadow-sm dark:shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors uppercase tracking-wide">
                      {loc.city}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{loc.name}</div>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                  {loc.state}
                </span>
              </div>

              {/* Stats Breakdown */}
              <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10]/60 p-3 font-mono">
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

              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 pt-2 border-t border-slate-200 dark:border-zinc-800/60">
                <span>View properties in this market</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
