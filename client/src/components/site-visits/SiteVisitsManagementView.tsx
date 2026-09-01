import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { SiteVisit } from '../../types/index.js';
import { MetricCard } from '../common/MetricCard.js';
import { formatDate, formatDateTime, formatSqFt } from '../../utils/formatters.js';
import {
  Calendar,
  Clock,
  Car,
  Phone,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Clock3,
  Building,
  MapPin,
  RefreshCw,
  Plus,
  MessageCircle,
} from 'lucide-react';

export const SiteVisitsManagementView: React.FC = () => {
  const { openSiteVisitModal, showToast, refreshTrigger, activeRole } = useApp();
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [stats, setStats] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSiteVisits = () => {
    setIsLoading(true);
    api
      .getSiteVisits({ status: statusFilter !== 'ALL' ? statusFilter : undefined })
      .then((res) => {
        setVisits(res.site_visits);
        setStats(res.stats);
      })
      .catch((err) => console.error('Error fetching site visits:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSiteVisits();
  }, [statusFilter, refreshTrigger]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.updateSiteVisitStatus(id, { status: newStatus });
      showToast(`Status updated to ${newStatus}`, 'Site visit appointment modified', 'success');
      fetchSiteVisits();
    } catch (err: any) {
      showToast('Status update failed', err.message, 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> Confirmed
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      case 'REQUESTED':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock3 className="h-3 w-3" /> New Request
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <span>Customer Site Visits</span>
            <span>•</span>
            <span>Appointment Dispatch Center</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white font-sans flex items-center gap-3">
            <span>Site Visit Management</span>
            <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-bold text-amber-400 border border-amber-500/20">
              {visits.length} Scheduled
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Dispatch property tours, confirm customer schedules, and coordinate free cab pickups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSiteVisits}
            className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => openSiteVisitModal()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ Book New Site Visit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total Inquiries"
          value={stats.total_bookings || 0}
          subtitle="All-time Site Visits"
          icon={<Calendar className="h-5 w-5 text-white" />}
        />
        <MetricCard
          title="Scheduled Today"
          value={stats.today_count || 0}
          subtitle="Visits happening today"
          icon={<Clock className="h-5 w-5 text-white" />}
          gradient="from-rose-500 to-red-600"
        />
        <MetricCard
          title="Pending Requests"
          value={stats.requested_count || 0}
          subtitle="Requires Confirmation"
          icon={<Clock3 className="h-5 w-5 text-white" />}
          gradient="from-cyan-500 to-blue-600"
        />
        <MetricCard
          title="Confirmed Tours"
          value={stats.confirmed_count || 0}
          subtitle="Ready for tour guide"
          icon={<CheckCircle2 className="h-5 w-5 text-white" />}
          gradient="from-pink-500 to-fuchsia-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-y border-zinc-800 py-3">
        {['ALL', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === st
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Bookings List Table */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-[#12161F]/60 text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-xs font-medium">Loading Site Visit Schedules...</span>
          </div>
        </div>
      ) : visits.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#12161F]/40 p-8 text-center text-zinc-500">
          <Calendar className="h-10 w-10 text-zinc-600 mb-2" />
          <span className="text-sm font-semibold text-zinc-400">No site visits found</span>
          <p className="text-xs text-zinc-500 mt-1">Bookings made by customers will appear here in real-time.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#12161F] shadow-xl">
          <table className="w-full text-left text-xs text-zinc-300 font-sans">
            <thead className="border-b border-zinc-800 bg-[#0A0C10] font-bold uppercase text-[10px] text-zinc-400">
              <tr>
                <th className="px-4 py-3.5">Ref ID</th>
                <th className="px-4 py-3.5">Visit Schedule</th>
                <th className="px-4 py-3.5">Customer Details</th>
                <th className="px-4 py-3.5">Property / Project</th>
                <th className="px-4 py-3.5">Cab Pickup</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {visits.map((v) => {
                const cleanPhone = v.customer_phone.replace(/[^0-9]/g, '');
                return (
                  <tr key={v.id} className="hover:bg-zinc-800/40 transition-colors">
                    {/* Booking Reference */}
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                      SV-{String(v.id).padStart(5, '0')}
                    </td>

                    {/* Schedule */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs">{formatDate(v.visit_date)}</div>
                      <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span>{v.time_slot}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white text-xs">{v.customer_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-zinc-400 text-[11px]">{v.customer_phone}</span>
                        {/* WhatsApp Direct Link */}
                        <a
                          href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(v.customer_name)},%20confirming%20your%20RKS%20Property%20site%20visit%20on%20${encodeURIComponent(v.visit_date)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-emerald-950/80 p-1 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </a>
                      </div>
                    </td>

                    {/* Property */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-white">
                        {v.property_code || 'General Tour'}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                        {v.project_name || 'RKS Township'} ({v.city || 'Chennai'})
                      </div>
                    </td>

                    {/* Pickup */}
                    <td className="px-4 py-3.5">
                      {v.pickup_required ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                            <Car className="h-3 w-3" /> Cab Required
                          </span>
                          {v.pickup_location && (
                            <div className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[130px]" title={v.pickup_location}>
                              {v.pickup_location}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Self Drive</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {getStatusBadge(v.status)}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status === 'REQUESTED' && (
                          <button
                            onClick={() => handleUpdateStatus(v.id, 'CONFIRMED')}
                            className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500 hover:text-black transition-all"
                          >
                            Confirm Visit
                          </button>
                        )}

                        {v.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(v.id, 'COMPLETED')}
                            className="rounded-lg bg-blue-500/20 border border-blue-500/40 px-2.5 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-500 hover:text-black transition-all"
                          >
                            Mark Done
                          </button>
                        )}

                        {v.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleUpdateStatus(v.id, 'CANCELLED')}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                            title="Cancel Booking"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
