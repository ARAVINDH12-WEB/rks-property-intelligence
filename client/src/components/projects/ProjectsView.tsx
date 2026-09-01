import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Project } from '../../types/index.js';
import { formatCurrencyINR, formatSqFt } from '../../utils/formatters.js';
import {
  FolderKanban,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  CheckCheck,
  TrendingUp,
  ArrowRight,
  Plus,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { setActiveTab, setFilterParams } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .getProjects()
      .then((res) => setProjects(res.projects))
      .catch((err) => console.error('Error fetching projects:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFilterByProject = (projId: number) => {
    setFilterParams({ project_id: String(projId) });
    setActiveTab('properties');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans">
            Project Portfolio Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Overview of RKS township developments, gated communities, and plotted layouts.
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-[#12161F]/60 text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-xs font-medium">Loading Projects...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => {
            const imageUrl =
              proj.image_url ||
              'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80';

            return (
              <div
                key={proj.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#12161F]/90 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40"
              >
                {/* Image Banner */}
                <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={imageUrl}
                    alt={proj.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12161F] via-transparent to-black/60" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider backdrop-blur-md">
                      {proj.status}
                    </span>
                    <span className="rounded-full bg-black/60 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-zinc-300 backdrop-blur-md">
                      {proj.code}
                    </span>
                  </div>

                  {proj.total_area_acres && (
                    <div className="absolute bottom-3 left-3 text-xs font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      {proj.total_area_acres} Acres
                    </div>
                  )}
                </div>

                {/* Project Details */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors">
                    {proj.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400 truncate">
                    <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{proj.city}, {proj.location_name}</span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {proj.description || 'Master planned gated township development.'}
                  </p>

                  {/* 4-KPI Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-zinc-800/80 bg-[#0A0C10]/60 p-2.5 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-sans">Available</div>
                      <div className="mt-0.5 text-sm font-bold text-emerald-400">
                        {proj.available_properties || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-sans">Reserved</div>
                      <div className="mt-0.5 text-sm font-bold text-amber-400">
                        {proj.reserved_properties || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-sans">Sold</div>
                      <div className="mt-0.5 text-sm font-bold text-rose-400">
                        {proj.sold_properties || 0}
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase">Valuation</span>
                      <div className="font-mono font-bold text-white">
                        {formatCurrencyINR(proj.total_inventory_value, true)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase">Avg Rate</span>
                      <div className="font-mono font-bold text-amber-400">
                        ₹{Number(proj.average_rate || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/sqft
                      </div>
                    </div>
                  </div>

                  {/* View Properties in Project Button */}
                  <button
                    onClick={() => handleFilterByProject(proj.id)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800/80 py-2.5 text-xs font-bold text-zinc-200 hover:bg-amber-500 hover:text-black transition-all"
                  >
                    <span>View All {proj.total_properties || 0} Properties</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
