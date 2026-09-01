import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { MetricCard } from '../common/MetricCard.js';
import { formatCurrencyINR, formatSqFt } from '../../utils/formatters.js';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  DollarSign,
  Building2,
  Layers,
  MapPin,
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
  Legend,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const [reportsData, setReportsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .getReports()
      .then((data) => setReportsData(data))
      .catch((err) => console.error('Reports load error:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !reportsData) {
    return (
      <div className="flex h-96 items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-xs font-medium">Aggregating PostgreSQL Analytics...</span>
        </div>
      </div>
    );
  }

  const { kpis, byStatus, byProject, byLocation, byType } = reportsData;

  const statusColors: Record<string, string> = {
    AVAILABLE: '#10B981',
    RESERVED: '#F59E0B',
    SOLD: '#EF4444',
    BLOCKED: '#64748B',
    HOLD: '#EAB308',
    UPCOMING: '#06B6D4',
  };

  const typeColors = ['#D4AF37', '#38BDF8', '#818CF8', '#34D399', '#FB7185', '#A78BFA'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white font-sans">
          Inventory Intelligence & Analytics Reports
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Quantitative analytics on land area velocity, capital valuation, and micro-market pricing.
        </p>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total Land Extent"
          value={formatSqFt(kpis.total_area_sqft)}
          subtitle={`≈ ${(Number(kpis.total_area_sqft || 0) / 43560).toFixed(2)} Total Acres`}
          icon={<Layers className="h-5 w-5 text-white" />}
        />
        <MetricCard
          title="Available Area"
          value={formatSqFt(kpis.available_area_sqft)}
          subtitle="Ready for Development / Sale"
          icon={<Building2 className="h-5 w-5 text-white" />}
          gradient="from-violet-500 to-indigo-600"
        />
        <MetricCard
          title="Available Valuation"
          value={formatCurrencyINR(kpis.available_inventory_value, true)}
          subtitle={formatCurrencyINR(kpis.available_inventory_value)}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          gradient="from-emerald-500 to-teal-600"
        />
        <MetricCard
          title="Sold Realization"
          value={formatCurrencyINR(kpis.sold_inventory_value, true)}
          subtitle={formatCurrencyINR(kpis.sold_inventory_value)}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* CHARTS GRID ROW 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Project Valuation Bar Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-base text-white">Inventory Valuation by Project</h3>
            <p className="text-xs text-zinc-400">Total capital value (₹ Crores) per project</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byProject.map((p: any) => ({
                  name: p.project_name.replace('RKS ', ''),
                  value: Number((Number(p.inventory_value) / 10000000).toFixed(2)),
                }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#71717a" fontSize={11} unit=" Cr" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181B24', borderColor: '#3f3f46', borderRadius: '12px' }}
                  formatter={(v: any) => [`₹${v} Cr`, 'Valuation']}
                />
                <Bar dataKey="value" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Property Type Breakdown */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-base text-white">Property Type Distribution</h3>
            <p className="text-xs text-zinc-400">Portfolio composition by asset class</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="count"
                  nameKey="property_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {byType.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={typeColors[index % typeColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#181B24', borderColor: '#3f3f46', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS GRID ROW 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Micro-market Average Rates */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-base text-white">Micro-market Average Rate / Sq.Ft</h3>
            <p className="text-xs text-zinc-400">Pricing benchmarks across regional hubs (₹/sq.ft)</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byLocation.map((loc: any) => ({
                  name: `${loc.city} - ${loc.location_name.split('-')[0].trim()}`,
                  rate: Number(loc.avg_rate),
                }))}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#71717a" fontSize={11} unit=" ₹" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181B24', borderColor: '#3f3f46', borderRadius: '12px' }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}/sqft`, 'Avg Rate']}
                />
                <Bar dataKey="rate" fill="#38BDF8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Unit Density & Availability */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-base text-white">Project Units: Available vs Sold</h3>
            <p className="text-xs text-zinc-400">Unit breakdown by project</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byProject.map((p: any) => ({
                  name: p.project_name.replace('RKS ', ''),
                  Available: Number(p.available_units),
                  Sold: Number(p.sold_units),
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181B24', borderColor: '#3f3f46', borderRadius: '12px' }}
                />
                <Legend />
                <Bar dataKey="Available" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sold" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
