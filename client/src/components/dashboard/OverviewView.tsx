import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { MetricCard } from '../common/MetricCard.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { BlueprintPattern } from '../common/BlueprintPattern.js';
import { formatCurrencyINR, formatSqFt, formatDateTime } from '../../utils/formatters.js';
import {
  Building2,
  CheckCircle2,
  Clock,
  CheckCheck,
  TrendingUp,
  DollarSign,
  Layers,
  ArrowRight,
  Plus,
  FileSpreadsheet,
  Download,
  Activity,
  MapPin,
  Calendar,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';

export const OverviewView: React.FC = () => {
  const {
    setActiveTab,
    setIsAddModalOpen,
    setIsExportModalOpen,
    setSelectedPropertyId,
    activeRole,
    openSiteVisitModal,
    theme,
  } = useApp();

  const [reportsData, setReportsData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('rks_cached_reports');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(!reportsData);

  useEffect(() => {
    let mounted = true;
    api
      .getReports()
      .then((data) => {
        if (mounted && data) {
          setReportsData(data);
          try {
            localStorage.setItem('rks_cached_reports', JSON.stringify(data));
          } catch {}
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = reportsData?.kpis || {};
  const byStatus = reportsData?.byStatus || [];
  const byProject = reportsData?.byProject || [];
  const recentActivity = reportsData?.recentActivity || [];

  const statusColors: Record<string, string> = {
    AVAILABLE: '#10B981',
    RESERVED: '#F59E0B',
    SOLD: '#EF4444',
    BLOCKED: '#64748B',
    HOLD: '#EAB308',
    UPCOMING: '#06B6D4',
  };

  const isStaff = activeRole !== 'VIEWER';
  
  const totalProperties = Number(kpis.total_properties || 0);
  const availableCount = Number(kpis.available_count || 0);
  const reservedCount = Number(kpis.reserved_count || 0);
  const soldCount = Number(kpis.sold_count || 0);
  
  const availablePct = totalProperties > 0 ? (availableCount / totalProperties) * 100 : 0;
  const reservedPct = totalProperties > 0 ? (reservedCount / totalProperties) * 100 : 0;
  const soldPct = totalProperties > 0 ? (soldCount / totalProperties) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold font-heading tracking-tight uppercase tracking-widest text-brand-teal dark:text-brand-teal-light">
            <span>RKS Real Estate Intelligence</span>
            <span>•</span>
            <span>{isStaff ? 'Inventory Command Center' : 'Customer & Buyer Portal'}</span>
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-brand-navy dark:text-brand-charcoal dark:text-white font-sans">
            {isStaff ? 'Executive Inventory Overview' : 'Explore RKS Property Hub'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {isStaff
              ? 'Real-time multi-project property portfolio metrics connected to PostgreSQL.'
              : 'Browse 58 surveyed plots, transparent sq.ft rates, clear patta titles, and book free cab inspections.'}
          </p>
        </div>

        {isStaff ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-brand-teal/10 px-4 py-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white px-5 py-2.5 text-xs font-bold font-heading tracking-tight shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Add Property</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => openSiteVisitModal()}
              className="flex items-center gap-2 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Site Visit</span>
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-rks-cardDark shadow-sm px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-zinc-200 transition-all cursor-pointer"
            >
              <Building2 className="h-4 w-4 text-brand-teal" />
              <span>Explore Plots</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* HERO KPI CARD - Span 2 columns */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1128] to-[#1a2340] border border-slate-800 shadow-lg p-6 flex flex-col justify-between">
          <BlueprintPattern opacity={0.2} color="teal" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-1">Total Inventory Value</h2>
                <div className="text-4xl lg:text-5xl font-serif text-white font-bold">{formatCurrencyINR(kpis.total_inventory_value, true)}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-6 h-6 text-brand-teal-light" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
              <div>
                <p className="text-slate-400 text-xs mb-1">Total Properties</p>
                <p className="text-white text-lg font-bold">{totalProperties.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Avg Rate/Sq.Ft</p>
                <p className="text-white text-lg font-bold">₹{Number(kpis.avg_rate_per_sqft || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SMALLER KPI CARDS */}
        <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => setActiveTab('available')}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <StatusBadge status="AVAILABLE" />
              <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-20" />
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{availableCount.toLocaleString()}</div>
            <p className="text-xs text-slate-500">units ready to allocate</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>{availablePct.toFixed(1)}% of total</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${availablePct}%` }}></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors" onClick={() => setActiveTab('reserved')}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <StatusBadge status="RESERVED" />
              <Clock className="w-5 h-5 text-amber-500 opacity-20" />
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{reservedCount.toLocaleString()}</div>
            <p className="text-xs text-slate-500">units under negotiation</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>{reservedPct.toFixed(1)}% of total</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${reservedPct}%` }}></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between cursor-pointer hover:border-rose-300 transition-colors" onClick={() => setActiveTab('sold')}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <StatusBadge status="SOLD" />
              <CheckCheck className="w-5 h-5 text-rose-500 opacity-20" />
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{soldCount.toLocaleString()}</div>
            <p className="text-xs text-slate-500">registered & closed</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>{soldPct.toFixed(1)}% of total</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${soldPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>


      {/* MID SECTION: PORTFOLIO BREAKDOWN & CHARTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Project Inventory Valuation Bar Chart (Horizontal) */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Project Inventory Valuation</h3>
              <p className="text-xs text-slate-500">Total property worth by project (₹ Crores)</p>
            </div>
            <button
              onClick={() => setActiveTab('projects')}
              className="flex items-center gap-1 text-xs font-semibold text-brand-teal hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={byProject.map((p: any) => ({
                  name: p.project_name.replace('RKS ', ''),
                  value: Number((Number(p.inventory_value) / 10000000).toFixed(2)),
                  rate: Number(p.avg_rate),
                }))}
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <XAxis type="number" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} unit="Cr" />
                <YAxis dataKey="name" type="category" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} width={80} />
                <Tooltip
                  cursor={{fill: 'transparent'}}
                  contentStyle={
                    theme === 'dark'
                      ? { backgroundColor: '#181B24', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff' }
                      : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                  }
                  formatter={(val: any) => [`₹${val} Cr`, 'Value']}
                />
                <Bar dataKey="value" fill="#0F766E" radius={[0, 4, 4, 0]} barSize={24}>
                  <LabelList dataKey="value" position="right" formatter={(v: any) => `₹${v}Cr`} style={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 500 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Availability Status Donut Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">Status Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution across inventory</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {byStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={
                    theme === 'dark'
                      ? { backgroundColor: '#181B24', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff' }
                      : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {byStatus.map((st: any) => (
              <div key={st.status} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-800/50 p-2 border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: statusColors[st.status] || '#94a3b8' }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-semibold truncate text-[10px]">{st.status}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{st.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RECENT TIMELINE & QUICK ACTIONS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Property Activity Stream - Timeline Style */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-teal" />
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Activity Timeline</h3>
            </div>
            <button
              onClick={() => setActiveTab('audit')}
              className="flex items-center gap-1 text-xs font-semibold text-brand-teal hover:underline"
            >
              <span>View Audit Logs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="relative pl-3 border-l-2 border-slate-100 dark:border-zinc-800 space-y-6">
              {recentActivity.map((item: any, i: number) => (
                <div
                  key={i}
                  onClick={() => setSelectedPropertyId(item.property_id)}
                  className="relative group cursor-pointer"
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-[17px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-brand-teal group-hover:bg-brand-teal-light transition-colors"></div>
                  
                  <div className="pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white text-sm">
                          {item.property_code}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                          {item.event_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {formatDateTime(item.created_at)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{item.project_name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              No recent activity recorded yet.
            </div>
          )}
        </div>

        {/* Quick Launchpad */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">Command Shortcuts</h3>
            <p className="text-xs text-slate-500">High-frequency workflows</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setActiveTab('properties')}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-brand-teal dark:hover:border-brand-teal hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-brand-teal/10 transition-colors">
                <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-brand-teal" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-brand-teal">Browse Inventory</div>
                <div className="text-xs text-slate-500">Filter, edit & manage</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('available')}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-emerald-500">Available Units</div>
                <div className="text-xs text-slate-500">{availableCount} ready to sell</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-cyan-500 dark:hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                <FileSpreadsheet className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-cyan-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-cyan-500">Excel Import</div>
                <div className="text-xs text-slate-500">Upload bulk data</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
