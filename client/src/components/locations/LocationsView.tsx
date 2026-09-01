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
        <h1 className="text-2xl font-black tracking-tight text-white font-sans">
          Location & Micro-Market Intelligence
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Geographic distribution, unit density, and pricing benchmarks across South Indian markets.
        </p>
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-[#12161F]/60 text-zinc-400">
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
              className="group cursor-pointer rounded-2xl border border-zinc-800/80 bg-[#12161F]/90 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors uppercase tracking-wide">
                      {loc.city}
                    </h3>
                    <div className="text-xs text-zinc-400 font-medium">{loc.name}</div>
                  </div>
                </div>

                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-zinc-300">
                  {loc.state}
                </span>
              </div>

              {/* Stats Breakdown */}
              <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-[#0A0C10]/60 p-3 font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-sans">Total Units</span>
                  <div className="mt-1 text-base font-bold text-white">
                    {loc.total_properties || 0}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-sans">Available</span>
                  <div className="mt-1 text-base font-bold text-emerald-400">
                    {loc.available_properties || 0}
                  </div>
                </div>

                <div className="col-span-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-sans">Inventory Value</span>
                    <div className="font-bold text-white text-sm">
                      {formatCurrencyINR(loc.total_inventory_value, true)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase font-sans">Avg Rate</span>
                    <div className="font-bold text-amber-400 text-sm">
                      ₹{Number(loc.average_rate || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/sqft
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-400 group-hover:text-amber-400 pt-2 border-t border-zinc-800/60">
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
