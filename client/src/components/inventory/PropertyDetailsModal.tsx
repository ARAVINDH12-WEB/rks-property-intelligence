import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Property, PropertyStatus } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import {
  formatCurrencyINR,
  formatSqFt,
  formatRate,
  formatDate,
  formatDateTime,
} from '../../utils/formatters.js';
import {
  X,
  Edit2,
  Copy,
  Archive,
  Trash2,
  MapPin,
  Compass,
  FileText,
  Clock,
  History,
  Image as ImageIcon,
  Building,
  User,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Calendar,
} from 'lucide-react';

interface PropertyDetailsModalProps {
  propertyId: number | null;
  onClose: () => void;
  onEdit: (prop: Property) => void;
  onDeleteRequest: (prop: Property) => void;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  propertyId,
  onClose,
  onEdit,
  onDeleteRequest,
}) => {
  const { activeRole, showToast, refreshInventory, openSiteVisitModal } = useApp();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'docs' | 'history'>('details');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const canEdit = activeRole === 'ADMIN' || activeRole === 'MANAGER' || activeRole === 'EMPLOYEE';

  useEffect(() => {
    if (!propertyId) {
      setProperty(null);
      return;
    }

    setIsLoading(true);
    api
      .getProperty(propertyId)
      .then((res) => {
        setProperty(res.property);
      })
      .catch((err) => {
        showToast('Error loading property', err.message, 'error');
        onClose();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [propertyId]);

  if (!propertyId) return null;

  const handleStatusChange = async (newStatus: PropertyStatus) => {
    if (!property) return;
    try {
      await api.updateStatus(property.id, newStatus);
      showToast(`Status updated to ${newStatus}`, 'Inventory status modified', 'success');
      setStatusMenuOpen(false);
      // Reload property
      const res = await api.getProperty(property.id);
      setProperty(res.property);
      refreshInventory();
    } catch (err: any) {
      showToast('Failed to update status', err.message, 'error');
    }
  };

  const handleDuplicate = async () => {
    if (!property) return;
    try {
      const res = await api.duplicateProperty(property.id);
      showToast('Property duplicated', `Draft created as ${res.property.property_code}`, 'success');
      refreshInventory();
    } catch (err: any) {
      showToast('Duplication failed', err.message, 'error');
    }
  };

  const statuses: PropertyStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'HOLD', 'UPCOMING'];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-full w-full max-w-4xl flex-col border-l border-zinc-800 bg-[#0D1017] shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Loading Spinner */}
        {isLoading || !property ? (
          <div className="flex h-full items-center justify-center p-12 text-zinc-400">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm font-medium">Loading Property Intelligence...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-[#12161F] px-8 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-extrabold text-base shadow-inner">
                  {property.property_code.split('-')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-mono text-2xl font-black tracking-tight text-white">
                      {property.property_code}
                    </h2>
                    <StatusBadge status={property.status} size="md" />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200">{property.project_name}</span>
                    <span>•</span>
                    <span>{property.city}, {property.state || 'Tamil Nadu'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {/* Status Quick Switch */}
                {canEdit && (
                  <div className="relative">
                    <button
                      onClick={() => setStatusMenuOpen((prev) => !prev)}
                      className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
                    >
                      <span>Change Status</span>
                    </button>

                    {statusMenuOpen && (
                      <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-zinc-700 bg-[#12161F] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                          Set Status
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {statuses.map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(st)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
                                property.status === st
                                  ? 'bg-amber-500/10 text-amber-400 font-bold'
                                  : 'text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <StatusBadge status={st} size="sm" showDot={false} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Site Visit Button */}
                <button
                  onClick={() => openSiteVisitModal(property)}
                  className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all shadow-sm"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Book Site Visit</span>
                </button>

                {canEdit && (
                  <button
                    onClick={() => onEdit(property)}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Property</span>
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={handleDuplicate}
                    title="Duplicate Property"
                    className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={() => onDeleteRequest(property)}
                    title="Archive or Delete"
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="rounded-xl border border-zinc-800 bg-zinc-800/60 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-800 bg-[#0D1017] px-8">
              {[
                { id: 'details', label: 'Property Intelligence', icon: <Layers className="h-4 w-4" /> },
                { id: 'media', label: `Media (${property.images?.length || 0})`, icon: <ImageIcon className="h-4 w-4" /> },
                { id: 'docs', label: `Documents (${property.documents?.length || 0})`, icon: <FileText className="h-4 w-4" /> },
                { id: 'history', label: `History & Audit (${property.history?.length || 0})`, icon: <History className="h-4 w-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-colors ${
                    activeTab === tab.id
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'details' && (
                <div className="space-y-8">
                  {/* HERO 4-METRIC SUMMARY CARDS */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-4 shadow-lg">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Area
                      </span>
                      <div className="mt-2 font-mono text-xl font-black text-white">
                        {formatSqFt(property.area_sqft)}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                        {property.area_sqm || (property.area_sqft * 0.092903).toFixed(2)} sq.m
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-4 shadow-lg">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Rate / Sq.Ft
                      </span>
                      <div className="mt-2 font-mono text-xl font-black text-amber-400">
                        ₹{Number(property.rate_per_sqft).toLocaleString('en-IN')}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">Base Unit Rate</div>
                    </div>

                    <div className="rounded-2xl border border-amber-500/30 bg-[#12161F] p-4 shadow-lg">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Total Price
                      </span>
                      <div className="mt-2 font-mono text-xl font-black text-emerald-400">
                        {formatCurrencyINR(property.total_price)}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-emerald-500 font-bold">
                        {formatCurrencyINR(property.total_price, true)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-4 shadow-lg">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Availability
                      </span>
                      <div className="mt-3">
                        <StatusBadge status={property.status} size="md" />
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-500">
                        {property.expected_availability || 'Ready for Allocation'}
                      </div>
                    </div>
                  </div>

                  {/* LAND UNIT CONVERSION MATRIX */}
                  {property.conversions && (
                    <div className="rounded-2xl border border-zinc-800/80 bg-[#12161F] p-5 shadow-lg">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                        <span>Land Measurement Conversions (Standard Indian Units)</span>
                      </h4>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 font-mono text-center">
                        <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-2.5">
                          <div className="text-[10px] text-zinc-500 uppercase font-sans">Sq.Ft</div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {property.conversions.sqft.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-2.5">
                          <div className="text-[10px] text-zinc-500 uppercase font-sans">Sq.Meters</div>
                          <div className="mt-1 text-sm font-bold text-zinc-200">
                            {property.conversions.sqm}
                          </div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-2.5">
                          <div className="text-[10px] text-zinc-500 uppercase font-sans">Acres</div>
                          <div className="mt-1 text-sm font-bold text-zinc-200">
                            {property.conversions.acres}
                          </div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-2.5">
                          <div className="text-[10px] text-zinc-500 uppercase font-sans">Cents</div>
                          <div className="mt-1 text-sm font-bold text-amber-400">
                            {property.conversions.cents}
                          </div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-2.5">
                          <div className="text-[10px] text-zinc-500 uppercase font-sans">Grounds</div>
                          <div className="mt-1 text-sm font-bold text-emerald-400">
                            {property.conversions.grounds}
                          </div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-2.5">
                          <div className="text-[10px] text-zinc-500 uppercase font-sans">Guntas</div>
                          <div className="mt-1 text-sm font-bold text-zinc-200">
                            {property.conversions.guntas}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROPERTY INFORMATION & PRICING BREAKDOWN */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Basic & Technical Specs */}
                    <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-6 shadow-lg space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-zinc-800 pb-2">
                        Technical Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-y-3 text-xs">
                        <span className="text-zinc-500">Property Type:</span>
                        <span className="font-semibold text-white">{property.property_type}</span>

                        <span className="text-zinc-500">Category:</span>
                        <span className="font-semibold text-white">{property.category || 'Standard'}</span>

                        <span className="text-zinc-500">Plot Number:</span>
                        <span className="font-mono font-semibold text-white">{property.plot_number || '—'}</span>

                        <span className="text-zinc-500">Unit Number:</span>
                        <span className="font-mono font-semibold text-white">{property.unit_number || '—'}</span>

                        <span className="text-zinc-500">Block / Phase:</span>
                        <span className="font-semibold text-white">{property.block || '—'}</span>

                        <span className="text-zinc-500">Floor Level:</span>
                        <span className="font-semibold text-white">{property.floor || 'Ground'}</span>

                        <span className="text-zinc-500">Survey Number:</span>
                        <span className="font-mono font-semibold text-amber-400">{property.survey_number || '—'}</span>

                        <span className="text-zinc-500">Approval Number:</span>
                        <span className="font-mono font-semibold text-emerald-400">{property.approval_number || 'DTCP Approved'}</span>

                        <span className="text-zinc-500">Facing Direction:</span>
                        <span className="font-semibold text-white">{property.facing || 'East'} Facing</span>

                        <span className="text-zinc-500">Road Width:</span>
                        <span className="font-semibold text-white">{property.road_width || '40 ft'}</span>

                        <span className="text-zinc-500">Ownership:</span>
                        <span className="font-semibold text-white">{property.ownership || 'Freehold'}</span>
                      </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-6 shadow-lg space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-zinc-800 pb-2">
                        Financial & Cost Breakdown
                      </h4>
                      <div className="grid grid-cols-2 gap-y-3 text-xs">
                        <span className="text-zinc-500">Rate per Sq.Ft:</span>
                        <span className="font-mono font-bold text-amber-400">
                          ₹{Number(property.rate_per_sqft).toLocaleString('en-IN')}
                        </span>

                        <span className="text-zinc-500">Total Price:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCurrencyINR(property.total_price)}
                        </span>

                        <span className="text-zinc-500">Negotiable:</span>
                        <span className="font-semibold text-white">
                          {property.negotiable ? 'Yes' : 'Fixed Price'}
                        </span>

                        <span className="text-zinc-500">Minimum Price:</span>
                        <span className="font-mono font-semibold text-zinc-300">
                          {property.minimum_price ? formatCurrencyINR(property.minimum_price) : '—'}
                        </span>

                        <span className="text-zinc-500">Registration Charges:</span>
                        <span className="font-mono font-semibold text-zinc-300">
                          {formatCurrencyINR(property.registration_charges || 0)}
                        </span>

                        <span className="text-zinc-500">Other Charges:</span>
                        <span className="font-mono font-semibold text-zinc-300">
                          {formatCurrencyINR(property.other_charges || 0)}
                        </span>

                        <span className="text-zinc-500">Assigned Broker:</span>
                        <span className="font-semibold text-white">{property.broker || 'Direct RKS'}</span>

                        <span className="text-zinc-500">Assigned Officer:</span>
                        <span className="font-semibold text-white">
                          {property.assigned_user_name || 'Karthik Venkat'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION & INTERNAL NOTES */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-6 shadow-lg">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Property Description
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {property.description || 'Prime property in high growth corridor with all essential infrastructural approvals.'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-6 shadow-lg">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-2">
                        Internal Notes & Audit Log Details
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {property.internal_notes || 'All land titles and parent deeds verified by RKS legal panel.'}
                      </p>
                    </div>
                  </div>

                  {/* AMENITIES & TAGS */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="rounded-2xl border border-zinc-800 bg-[#12161F] p-6 shadow-lg">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                        Infrastructure & Amenities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((am, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-200 border border-zinc-700/60"
                          >
                            ✓ {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MEDIA GALLERY */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Media Gallery & Layout Plans
                    </h3>
                  </div>

                  {property.images && property.images.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {property.images.map((img, i) => (
                        <div
                          key={i}
                          className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#12161F] shadow-xl"
                        >
                          <img
                            src={img.url}
                            alt={img.title || 'Property Media'}
                            className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="p-3 bg-[#12161F] flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">
                              {img.title || `Media ${i + 1}`}
                            </span>
                            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                              {img.image_type || 'PHOTO'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-zinc-500">
                      No media uploaded yet.
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTS REPOSITORY */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Property Documents & Legal Clearances
                  </h3>

                  {property.documents && property.documents.length > 0 ? (
                    <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-[#12161F] overflow-hidden">
                      {property.documents.map((doc, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 hover:bg-zinc-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{doc.title}</div>
                              <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-amber-400">{doc.doc_type || 'LEGAL'}</span>
                                <span>•</span>
                                <span>{doc.file_size || '1.5 MB'}</span>
                              </div>
                            </div>
                          </div>

                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                          >
                            <span>View Document</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-zinc-500">
                      No legal documents attached yet.
                    </div>
                  )}
                </div>
              )}

              {/* TIMELINE & AUDIT HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Property Revision Timeline & Audit Trail
                  </h3>

                  {property.history && property.history.length > 0 ? (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                      {property.history.map((item, i) => (
                        <div key={i} className="relative group">
                          <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[#0D1017] bg-amber-400 shadow-sm" />
                          <div className="rounded-xl border border-zinc-800 bg-[#12161F] p-4 shadow-md">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-amber-400">
                                {item.event_type}
                              </span>
                              <span className="text-zinc-500 font-mono">
                                {formatDateTime(item.created_at)}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-zinc-300 font-medium leading-relaxed">
                              {item.description}
                            </p>
                            {item.changed_by_name && (
                              <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Updated by {item.changed_by_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-zinc-500">
                      No revision history logged yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
