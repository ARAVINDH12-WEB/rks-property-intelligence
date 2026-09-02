import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Offer } from '../../types/index.js';
import {
  Sparkles,
  Tag,
  Plus,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ExternalLink,
  Percent,
  Gift,
  Zap,
  Building,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const OffersView: React.FC = () => {
  const { activeRole, showToast, refreshTrigger, openSiteVisitModal } = useApp();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'SPECIAL_RATE' | 'PACKAGE',
    discount_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
    applicable_properties: 'ALL',
    banner_image_url: '',
    terms_conditions: '',
  });

  const fetchOffers = () => {
    setIsLoading(true);
    api
      .getOffers()
      .then((res) => {
        setOffers(res.offers || []);
      })
      .catch((err) => {
        showToast('Error Loading Offers', err.message, 'error');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, [refreshTrigger, activeRole]);

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setFormData({
      title: '',
      description: '',
      discount_type: 'PERCENTAGE',
      discount_value: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      applicable_properties: 'ALL',
      banner_image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
      terms_conditions: 'Valid for prospective buyers registering interest this month.',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      discount_type: offer.discount_type || 'PERCENTAGE',
      discount_value: offer.discount_value,
      start_date: offer.start_date.split('T')[0],
      end_date: offer.end_date.split('T')[0],
      is_active: offer.is_active,
      applicable_properties: offer.applicable_properties || 'ALL',
      banner_image_url: offer.banner_image_url || '',
      terms_conditions: offer.terms_conditions || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.discount_value.trim()) {
      showToast('Validation Error', 'Title, description, and discount value are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingOffer) {
        await api.updateOffer(editingOffer.id, formData);
        showToast('Offer Updated', `Promotional offer '${formData.title}' updated successfully.`, 'success');
      } else {
        await api.createOffer(formData);
        showToast('Offer Created', `Promotional offer '${formData.title}' published successfully.`, 'success');
      }
      setIsModalOpen(false);
      fetchOffers();
    } catch (err: any) {
      showToast('Save Failed', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffer = async () => {
    if (!offerToDelete) return;
    try {
      await api.deleteOffer(offerToDelete.id);
      showToast('Offer Deleted', `'${offerToDelete.title}' has been removed.`, 'success');
      setOfferToDelete(null);
      fetchOffers();
    } catch (err: any) {
      showToast('Delete Failed', err.message, 'error');
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      await api.updateOffer(offer.id, { is_active: !offer.is_active });
      showToast(
        offer.is_active ? 'Offer Deactivated' : 'Offer Activated',
        `'${offer.title}' status updated.`,
        'info'
      );
      fetchOffers();
    } catch (err: any) {
      showToast('Status Update Failed', err.message, 'error');
    }
  };

  const isAdmin = activeRole === 'ADMIN';
  const isManager = activeRole === 'MANAGER';
  const isCustomer = activeRole === 'VIEWER';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-0.5 text-xs font-bold border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-300 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isCustomer ? 'Exclusive Buyer Privileges' : 'Promotions & Incentive Management'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            {isCustomer ? 'Exclusive Festival & Plot Offers' : 'Promotional Offers & Campaigns'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {isCustomer
              ? 'Lock in limited-time price concessions, waiver of registration fees, and free site tour perks.'
              : isAdmin
              ? 'Create, manage, and schedule promotional discount campaigns across projects.'
              : 'Internal promotional campaign tracking and validity audit.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOffers}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:border-slate-300 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Refresh
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" /> Create Offer
            </button>
          )}
        </div>
      </div>

      {/* Offers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/40 animate-pulse"
            />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 dark:bg-pink-900/30 text-pink-500">
            <Tag className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">No Offers Currently Available</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
            {isCustomer
              ? 'New festival concessions and township specials are announced regularly. Check back soon or request a custom price quote with our sales team.'
              : 'Click "Create Offer" to publish your first promotional campaign.'}
          </p>
          {isCustomer && (
            <button
              onClick={() => openSiteVisitModal()}
              className="mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md"
            >
              Inquire About Custom Pricing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const isExpired = offer.calculated_status === 'EXPIRED';
            const isInactive = !offer.is_active || offer.calculated_status === 'INACTIVE';
            const isScheduled = offer.calculated_status === 'SCHEDULED';

            return (
              <div
                key={offer.id}
                className={`group relative rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl ${
                  isExpired || isInactive
                    ? 'border-slate-200 dark:border-zinc-800/80 bg-white/70 dark:bg-[#10141D]/70 opacity-80'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] hover:border-pink-500/40'
                }`}
              >
                {/* Banner Image / Header */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={
                      offer.banner_image_url ||
                      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={offer.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 px-3 py-1.5 text-xs font-black text-white shadow-lg">
                      <Zap className="h-3.5 w-3.5 fill-white" />
                      {offer.discount_value}
                    </span>
                  </div>

                  {/* Internal Status Badge for Managers & Admins */}
                  {!isCustomer && (
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border backdrop-blur-md ${
                          offer.calculated_status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : isExpired
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                            : isScheduled
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                            : 'bg-zinc-900/80 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {offer.calculated_status === 'ACTIVE' && <CheckCircle2 className="h-3 w-3" />}
                        {isExpired && <Clock className="h-3 w-3" />}
                        {offer.calculated_status || (offer.is_active ? 'ACTIVE' : 'INACTIVE')}
                      </span>
                    </div>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-base font-black text-white line-clamp-1 drop-shadow-md">
                      {offer.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-3">
                      {offer.description}
                    </p>

                    <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong className="text-slate-700 dark:text-zinc-200">Applicable:</strong>{' '}
                          {offer.applicable_properties === 'ALL'
                            ? 'All RKS Layouts & Townships'
                            : offer.applicable_properties}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong className="text-slate-700 dark:text-zinc-200">Validity:</strong>{' '}
                          {new Date(offer.start_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          –{' '}
                          {new Date(offer.end_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {offer.terms_conditions && (
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 italic pt-1">
                          * {offer.terms_conditions}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions according to Role */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    {isCustomer ? (
                      <button
                        onClick={() => openSiteVisitModal()}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Claim Offer & Book Visit
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleToggleActive(offer)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                                offer.is_active
                                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-500'
                              }`}
                            >
                              {offer.is_active ? 'Active' : 'Draft'}
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(offer)}
                                aria-label="Edit Offer"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setOfferToDelete(offer)}
                                aria-label="Delete Offer"
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                            Managed by Director Office
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingOffer ? 'Edit Promotional Offer' : 'Create New Promotional Offer'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Set up discounts, incentives & validity dates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Monsoon Bonanza 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e: any) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                    <option value="SPECIAL_RATE">Special Rate / Sq.Ft</option>
                    <option value="PACKAGE">Perk / Package</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Discount Badge Text *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10% OFF / Free Registration"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain the offer terms, scope, and savings for buyers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 p-3 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Applicable Properties
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ALL or OMR Corridor, ECR"
                    value={formData.applicable_properties}
                    onChange={(e) => setFormData({ ...formData, applicable_properties: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Banner Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.banner_image_url}
                    onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Terms & Conditions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Valid for advance tokens paid before expiry."
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="offer-active-toggle"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="offer-active-toggle" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Publish offer immediately as Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 px-6 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingOffer ? 'Update Offer' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {offerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Offer?</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Are you sure you want to delete &apos;{offerToDelete.title}&apos;? This action will remove it from all views.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setOfferToDelete(null)}
                className="rounded-xl border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOffer}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
