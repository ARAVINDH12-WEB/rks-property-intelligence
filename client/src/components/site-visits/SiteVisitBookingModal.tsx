import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Property } from '../../types/index.js';
import { formatCurrencyINR, formatSqFt } from '../../utils/formatters.js';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  Car,
  Users,
  Phone,
  Mail,
  User,
  MapPin,
  CheckCircle2,
  X,
  Building,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface SiteVisitBookingModalProps {
  isOpen: boolean;
  property: Property | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SiteVisitBookingModal: React.FC<SiteVisitBookingModalProps> = ({
  isOpen,
  property,
  onClose,
  onSuccess,
}) => {
  const { showToast, refreshInventory } = useApp();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    visit_date: minDate,
    time_slot: '10:00 AM - 12:00 PM',
    pickup_required: false,
    pickup_location: '',
    attendees_count: 2,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);

  if (!isOpen) return null;

  const timeSlots = [
    '09:00 AM - 11:00 AM (Morning)',
    '11:00 AM - 01:00 PM (Mid-Day)',
    '02:00 PM - 04:00 PM (Afternoon)',
    '04:00 PM - 06:00 PM (Sunset / Evening)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
      showToast('Required Fields Missing', 'Please enter your name and phone number', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.bookSiteVisit({
        property_id: property?.id || null,
        ...formData,
      });

      setBookingConfirmation(res);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast('Site Visit Scheduled!', res.message, 'success');
      refreshInventory();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast('Booking Failed', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBookingConfirmation(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="flex w-full max-w-2xl flex-col rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0D1017] text-slate-900 dark:text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Schedule a Free Site Visit</span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                  Complimentary
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Experience RKS properties in person with an official property advisor.
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="rounded-xl p-1.5 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confirmation Screen */}
        {bookingConfirmation ? (
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Booking Reference: {bookingConfirmation.bookingReference}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Site Visit Confirmed!</h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
                Thank you <strong className="text-slate-900 dark:text-white">{formData.customer_name}</strong>. Our RKS site manager has received your appointment for{' '}
                <strong className="text-amber-600 dark:text-amber-400">{formData.visit_date} ({formData.time_slot})</strong>.
              </p>
            </div>

            {/* Visit Details Ticket Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] p-5 text-left text-xs font-mono space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <span className="text-slate-500 dark:text-zinc-500 font-sans">Property / Plot:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {property ? `${property.property_code} (${property.project_name})` : 'RKS General Layout Tour'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <span className="text-slate-500 dark:text-zinc-500 font-sans">Contact Phone:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formData.customer_phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <span className="text-slate-500 dark:text-zinc-500 font-sans">Visitors Count:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.attendees_count} Person(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-500 font-sans">Cab Pickup:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formData.pickup_required ? `Yes (${formData.pickup_location || 'Address Provided'})` : 'Self Drive'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleReset}
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar space-y-6">
            {/* Selected Property Banner */}
            {property && (
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-50 dark:via-[#12161F] to-slate-50 dark:to-[#12161F] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 font-mono font-bold text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-zinc-700">
                    {property.property_code.split('-')[1]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{property.property_code}</span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">• {property.plot_number || 'Plot Unit'}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      <span>{property.project_name} ({property.city})</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">{formatSqFt(property.area_sqft)}</div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrencyINR(property.total_price, true)}</div>
                </div>
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-slate-200 dark:border-zinc-800 pb-1.5">
                1. Your Contact Details
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    <span>Full Name <span className="text-amber-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sundaram"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    <span>Phone Number <span className="text-amber-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98400 12345"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    <span>Email Address (Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rajesh@gmail.com"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Visit Schedule */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-slate-200 dark:border-zinc-800 pb-1.5">
                2. Preferred Schedule & Time Slot
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    <span>Visit Date <span className="text-amber-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={formData.visit_date}
                    onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    <span>Number of Attendees</span>
                  </label>
                  <select
                    value={formData.attendees_count}
                    onChange={(e) => setFormData({ ...formData, attendees_count: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={1}>1 Person</option>
                    <option value={2}>2 Persons (Couple)</option>
                    <option value={3}>3 Persons</option>
                    <option value={4}>4+ Persons (Family)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    <span>Select Time Slot</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData({ ...formData, time_slot: slot })}
                        className={`rounded-xl border p-2.5 text-left text-xs font-medium transition-all cursor-pointer ${
                          formData.time_slot === slot
                            ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                            : 'border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] text-slate-600 dark:text-zinc-400 hover:border-slate-400 dark:hover:border-zinc-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cab Pickup Add-on */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pickup_required}
                  onChange={(e) => setFormData({ ...formData, pickup_required: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-amber-500 accent-amber-500 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Require Free Cab Pickup & Drop?</span>
                </div>
              </label>

              {formData.pickup_required && (
                <div className="pt-2 animate-in fade-in">
                  <input
                    type="text"
                    required={formData.pickup_required}
                    placeholder="Enter pickup address / landmark (e.g. Anna Nagar, Chennai)..."
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#0A0C10] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                <span>Special Requirements / Questions</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Need patta documents review, looking for immediate registration..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSubmitting ? 'Booking Appointment...' : 'Confirm Site Visit'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
