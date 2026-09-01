import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { MetricCard } from '../common/MetricCard.js';
import { StatusBadge } from '../common/StatusBadge.js';
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
} from 'recharts';

export const OverviewView: React.FC = () => {
  const {
    setActiveTab,
    setIsAddModalOpen,
    setIsExportModalOpen,
    setSelectedPropertyId,
    activeRole,
    openSiteVisitModal,
  } = useApp();
  const [reportsData, setReportsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .getReports()
      .then((data) => {
        setReportsData(data);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
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

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400">
            <span>RKS Real Estate Intelligence</span>
            <span>•</span>
            <span>{isStaff ? 'Inventory Command Center' : 'Customer & Buyer Portal'}</span>
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            {isStaff ? 'Executive Inventory Overview' : 'Explore RKS Prime Properties'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {isStaff
              ? 'Real-time multi-project property portfolio metrics connected to PostgreSQL.'
              : 'Browse 58 surveyed plots, transparent sq.ft rates, clear patta titles, and book free cab inspections.'}
          </p>
        </div>

        {isStaff ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>+ Add Property</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => openSiteVisitModal()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>🚗 Book Free Site Visit</span>
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12161F] px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:border-amber-500 transition-all cursor-pointer shadow-sm"
            >
              <Building2 className="h-4 w-4 text-amber-500" />
              <span>Explore 58 Plots</span>
            </button>
          </div>
        )}
      </div>

      {/* 6 MASTER KPI CARDS (Drawn dynamically from DB) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Total Properties"
          value={Number(kpis.total_properties || 0).toLocaleString('en-IN')}
          subtitle="Master Portfolio Units"
          icon={<Building2 className="h-5 w-5 text-white" />}
          gradient="from-violet-500 to-indigo-600"
          onClick={() => setActiveTab('properties')}
        />

        <MetricCard
          title="Available"
          value={Number(kpis.available_count || 0).toLocaleString('en-IN')}
          subtitle="Ready for Allocation"
          icon={<CheckCircle2 className="h-5 w-5 text-white" />}
          gradient="from-emerald-500 to-teal-600"
          onClick={() => setActiveTab('available')}
        />

        <MetricCard
          title="Reserved"
          value={Number(kpis.reserved_count || 0).toLocaleString('en-IN')}
          subtitle="Under Negotiation"
          icon={<Clock className="h-5 w-5 text-white" />}
          gradient="from-amber-500 to-orange-600"
          onClick={() => setActiveTab('reserved')}
        />

        <MetricCard
          title="Sold"
          value={Number(kpis.sold_count || 0).toLocaleString('en-IN')}
          subtitle="Registered & Closed"
          icon={<CheckCheck className="h-5 w-5 text-white" />}
          gradient="from-rose-500 to-red-600"
          onClick={() => setActiveTab('sold')}
        />

        <MetricCard
          title="Total Value"
          value={formatCurrencyINR(kpis.total_inventory_value, true)}
          subtitle={formatCurrencyINR(kpis.total_inventory_value)}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          gradient="from-cyan-500 to-blue-600"
        />

        <MetricCard
          title="Avg Rate"
          value={`₹${Number(kpis.avg_rate_per_sqft || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle="Per Sq.Ft Rate"
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          gradient="from-pink-500 to-fuchsia-600"
        />
      </div>


      {/* MID SECTION: PORTFOLIO BREAKDOWN & CHARTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Project Inventory Valuation Bar Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl backdrop-blur-md lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white">Project Inventory Valuation</h3>
              <p className="text-xs text-zinc-400">Total property worth by project (₹ Crores)</p>
            </div>
            <button
              onClick={() => setActiveTab('projects')}
              className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:underline"
            >
              <span>View All Projects</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byProject.map((p: any) => ({
                  name: p.project_name.replace('RKS ', ''),
                  value: Number((Number(p.inventory_value) / 10000000).toFixed(2)),
                  rate: Number(p.avg_rate),
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#71717a" fontSize={11} unit=" Cr" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181B24', borderColor: '#3f3f46', borderRadius: '12px' }}
                  formatter={(val: any) => [`₹${val} Cr`, 'Inventory Value']}
                />
                <Bar dataKey="value" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Availability Status Donut Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl backdrop-blur-md space-y-4">
          <div>
            <h3 className="font-bold text-base text-white">Status Breakdown</h3>
            <p className="text-xs text-zinc-400">Distribution across inventory states</p>
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
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {byStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#71717a'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#181B24', borderColor: '#3f3f46', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {byStatus.map((st: any) => (
              <div key={st.status} className="flex items-center justify-between rounded-lg bg-[#0A0C10] p-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: statusColors[st.status] || '#71717a' }}
                  />
                  <span className="text-zinc-300 font-semibold truncate text-[11px]">{st.status}</span>
                </div>
                <span className="font-mono font-bold text-white text-xs">{st.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RECENT TIMELINE & QUICK ACTIONS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Property Activity Stream */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl backdrop-blur-md lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <h3 className="font-bold text-base text-white">Live Inventory Activity Stream</h3>
            </div>
            <button
              onClick={() => setActiveTab('audit')}
              className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:underline"
            >
              <span>View Audit Logs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="divide-y divide-zinc-800/60 font-sans">
              {recentActivity.map((item: any, i: number) => (
                <div
                  key={i}
                  onClick={() => setSelectedPropertyId(item.property_id)}
                  className="flex items-center justify-between py-3 hover:bg-zinc-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-amber-400 font-mono text-xs font-bold">
                      {item.property_code.split('-')[1]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">
                          {item.property_code}
                        </span>
                        <span className="text-[11px] text-zinc-400">• {item.project_name}</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                      {item.event_type}
                    </span>
                    <div className="text-[10px] text-zinc-500 font-mono mt-1">
                      {formatDateTime(item.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500">
              No recent activity recorded yet.
            </div>
          )}
        </div>

        {/* Quick Launchpad */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl backdrop-blur-md space-y-4">
          <h3 className="font-bold text-base text-white">Command Shortcuts</h3>
          <p className="text-xs text-zinc-400">Rapid access to high-frequency workflows</p>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => setActiveTab('properties')}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-[#0A0C10] p-3 hover:border-amber-500/40 hover:bg-zinc-800/60 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Browse Property Table</div>
                  <div className="text-[11px] text-zinc-400">Inline editing, filters & bulk tools</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </button>

            <button
              onClick={() => setActiveTab('available')}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-[#0A0C10] p-3 hover:border-emerald-500/40 hover:bg-zinc-800/60 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">View Available Inventory</div>
                  <div className="text-[11px] text-zinc-400">{kpis.available_count || 0} units ready to sell</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-[#0A0C10] p-3 hover:border-cyan-500/40 hover:bg-zinc-800/60 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-white">6-Step Excel Import</div>
                  <div className="text-[11px] text-zinc-400">Upload bulk .xlsx / .csv files</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
