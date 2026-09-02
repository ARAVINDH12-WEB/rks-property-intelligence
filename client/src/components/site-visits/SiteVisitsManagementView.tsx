import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { SiteVisit, Property } from '../../types/index.js';
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
  Sparkles,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const SiteVisitsManagementView: React.FC = () => {
  const { openSiteVisitModal, showToast, refreshTrigger, activeRole, currentUser } = useApp();
  const isCustomer = activeRole === 'VIEWER';

  // Staff State
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [stats, setStats] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Customer Booking Form State
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<string>('');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [cabRequired, setCabRequired] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  const fetchSiteVisits = () => {
    if (isCustomer) return;
    setIsLoading(true);
    api
      .getSiteVisits({ status: statusFilter !== 'ALL' ? statusFilter : undefined })
      .then((res) => {
        setVisits(res.site_visits || []);
        setStats(res.stats || {});
      })
      .catch((err) => console.error('Error fetching site visits:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isCustomer) {
      setIsLoading(true);
      api
        .getProperties({ status: 'AVAILABLE', limit: 100 })
        .then((res) => setProperties(res.properties || []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      fetchSiteVisits();
    }
  }, [statusFilter, refreshTrigger, isCustomer]);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !visitDate) {
      showToast('Missing Fields', 'Please provide your name, phone number, and preferred date.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.bookSiteVisit({
        property_id: selectedPropId ? parseInt(selectedPropId) : undefined,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        visit_date: visitDate,
        time_slot: timeSlot,
        cab_required: cabRequired,
        pickup_address: cabRequired ? pickupAddress.trim() : undefined,
        special_requests: specialRequests.trim() || undefined,
      });

      setBookingSuccess(res.booking);
      showToast('Site Visit Confirmed!', 'Our property advisor has received your appointment request.', 'success');
    } catch (err: any) {
      showToast('Booking Failed', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER VIEW (Dedicated Booking Experience)
  // ═══════════════════════════════════════════════════════════════
  if (isCustomer) {
    if (bookingSuccess) {
      return (
        <div className="max-w-2xl mx-auto py-8">
          <div className="rounded-3xl border border-emerald-500/30 bg-white dark:bg-[#12161F] p-8 text-center shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5" /> Appointment Reserved
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                Site Visit Request Received!
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                Thank you <strong className="text-slate-800 dark:text-zinc-200">{bookingSuccess.customer_name}</strong>. Our tour manager will contact you at <strong className="text-slate-800 dark:text-zinc-200">{bookingSuccess.customer_phone}</strong> to confirm your cab pickup.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10] p-4 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-2">
                <span className="text-slate-500 font-sans">Visit Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatDate(bookingSuccess.visit_date)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-2">
                <span className="text-slate-500 font-sans">Time Slot:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{bookingSuccess.time_slot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Free Cab Pickup:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {bookingSuccess.cab_required ? 'Yes (Requested)' : 'No (Self Drive)'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setBookingSuccess(null)}
                className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 px-6 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              >
                Book Another Visit
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        {/* Customer Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Car className="h-3.5 w-3.5" />
            100% Free Doorstep Cab Pickup & Guided Tour
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            Schedule a Free Property Site Visit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">
            Experience our prime residential plots in person. We provide complimentary pickup and drop from anywhere in Chennai and neighboring districts.
          </p>
        </div>

        {/* Booking Form Card */}
        <form
          onSubmit={handleCustomerSubmit}
          className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Step 1: Choose Property */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
              Select Property or General Township Tour
            </label>
            <select
              value={selectedPropId}
              onChange={(e) => setSelectedPropId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">General Project / Multi-Plot Tour (Recommended)</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.property_code} — {p.project_name} ({p.city}) — {p.area_sqft} sq.ft @ ₹{p.rate_per_sqft}/sq.ft
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Your Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Anand R."
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Phone Number (for Cab Confirmation) *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98402 11223"
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Date & Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Preferred Visit Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Preferred Time Window
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="09:00 AM - 11:00 AM">Morning (09:00 AM - 11:00 AM)</option>
                  <option value="11:00 AM - 01:00 PM">Noon (11:00 AM - 01:00 PM)</option>
                  <option value="02:00 PM - 04:00 PM">Afternoon (02:00 PM - 04:00 PM)</option>
                  <option value="04:00 PM - 06:00 PM">Evening (04:00 PM - 06:00 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 4: Cab Pickup */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Car className="h-5 w-5 text-emerald-500" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Need Free AC Cab Pickup & Drop?
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Complimentary doorstep service for you and your family
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={cabRequired}
                onChange={(e) => setCabRequired(e.target.checked)}
                className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {cabRequired && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Pickup Location / Residential Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required={cabRequired}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="e.g. 14, 2nd Main Road, Anna Nagar, Chennai"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Confirming Site Tour...' : 'Confirm Free Site Visit Booking'}</span>
          </button>
        </form>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STAFF VIEW (Management Dashboard & Operations)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            Site Visit Operations Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Track, assign, and manage prospective buyer property tours and cab pickups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchSiteVisits()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => openSiteVisitModal()}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record Site Visit</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total Bookings"
          value={stats.total_visits || 0}
          icon={<Calendar className="h-5 w-5 text-cyan-400" />}
          subtitle="All-time customer requests"
        />
        <MetricCard
          title="Pending / Requested"
          value={stats.requested_count || 0}
          icon={<Clock className="h-5 w-5 text-amber-400" />}
          subtitle="Requires staff confirmation"
        />
        <MetricCard
          title="Confirmed Tours"
          value={stats.confirmed_count || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          subtitle="Scheduled & assigned"
        />
        <MetricCard
          title="Cab Pickups"
          value={stats.cab_requested_count || 0}
          icon={<Car className="h-5 w-5 text-blue-400" />}
          subtitle="Doorstep vehicle needed"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-zinc-800 pb-2">
        {['ALL', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === st
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Visits List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/60 text-slate-400 dark:text-zinc-400 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span className="text-xs font-medium">Loading Site Visits...</span>
          </div>
        </div>
      ) : visits.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/60 p-6 text-center text-slate-400 dark:text-zinc-400 shadow-sm">
          <Calendar className="h-10 w-10 text-slate-300 dark:text-zinc-700 mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No site visits found</p>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
            Customer booking requests will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visits.map((v) => (
            <div
              key={v.id}
              className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{v.customer_name}</span>
                      {v.property_code && (
                        <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {v.property_code}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {v.customer_phone}
                      </span>
                      {v.customer_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {v.customer_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(v.status)}
                  <select
                    value={v.status}
                    onChange={(e) => handleUpdateStatus(v.id, e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#0A0C10] rounded-xl p-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Date</span>
                  <div className="font-bold text-slate-900 dark:text-white">{formatDate(v.visit_date)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Time Slot</span>
                  <div className="font-bold text-amber-600 dark:text-amber-400">{v.time_slot}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Cab Pickup</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    {v.cab_required ? 'YES (Requested)' : 'No (Self)'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Project</span>
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {v.project_name || 'General Township'}
                  </div>
                </div>
              </div>

              {v.pickup_address && (
                <div className="text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>
                    <strong>Pickup Address:</strong> {v.pickup_address}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
