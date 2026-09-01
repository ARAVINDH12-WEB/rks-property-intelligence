import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Property, Project, Location, PropertyStatus } from '../../types/index.js';
import { formatCurrencyINR } from '../../utils/formatters.js';
import {
  X,
  Building,
  DollarSign,
  MapPin,
  Tag,
  FileText,
  Check,
  Calculator,
} from 'lucide-react';

interface PropertyFormModalProps {
  isOpen: boolean;
  property: Property | null;
  projects: Project[];
  locations: Location[];
  onClose: () => void;
  onSuccess: () => void;
}

export const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  isOpen,
  property,
  projects,
  locations,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useApp();
  const isEditing = !!property;

  const [formData, setFormData] = useState<any>({
    property_code: '',
    project_id: '',
    location_id: '',
    property_type: 'Residential Plot',
    category: 'Standard',
    status: 'AVAILABLE',
    plot_number: '',
    unit_number: '',
    block: '',
    floor: '',
    survey_number: '',
    approval_number: '',
    area_sqft: '',
    rate_per_sqft: '',
    total_price: '',
    negotiable: false,
    minimum_price: '',
    registration_charges: '',
    other_charges: '',
    facing: 'East',
    road_width: '40 ft',
    bedrooms: 0,
    bathrooms: 0,
    ownership: 'Freehold',
    broker: '',
    assigned_to: '',
    description: '',
    internal_notes: '',
    latitude: '',
    longitude: '',
    amenities: ['24x7 Water', 'Gated Security'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTab, setFormTab] = useState<'basic' | 'pricing' | 'specs' | 'notes'>('basic');

  useEffect(() => {
    if (property) {
      setFormData({
        property_code: property.property_code,
        project_id: property.project_id || '',
        location_id: property.location_id || '',
        property_type: property.property_type || 'Residential Plot',
        category: property.category || 'Standard',
        status: property.status || 'AVAILABLE',
        plot_number: property.plot_number || '',
        unit_number: property.unit_number || '',
        block: property.block || '',
        floor: property.floor || '',
        survey_number: property.survey_number || '',
        approval_number: property.approval_number || '',
        area_sqft: property.area_sqft || '',
        rate_per_sqft: property.rate_per_sqft || '',
        total_price: property.total_price || '',
        negotiable: property.negotiable || false,
        minimum_price: property.minimum_price || '',
        registration_charges: property.registration_charges || '',
        other_charges: property.other_charges || '',
        facing: property.facing || 'East',
        road_width: property.road_width || '40 ft',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        ownership: property.ownership || 'Freehold',
        broker: property.broker || '',
        assigned_to: property.assigned_to || '',
        description: property.description || '',
        internal_notes: property.internal_notes || '',
        latitude: property.latitude || '',
        longitude: property.longitude || '',
        amenities: property.amenities || ['24x7 Water', 'Gated Security'],
      });
    } else {
      // New Property Defaults
      const nextCode = `RKS-${Math.floor(10000 + Math.random() * 90000)}`;
      setFormData({
        property_code: nextCode,
        project_id: projects[0]?.id || '',
        location_id: locations[0]?.id || '',
        property_type: 'Residential Plot',
        category: 'Standard',
        status: 'AVAILABLE',
        plot_number: '',
        unit_number: '',
        block: '',
        floor: '',
        survey_number: '',
        approval_number: '',
        area_sqft: 2400,
        rate_per_sqft: 5200,
        total_price: 2400 * 5200,
        negotiable: false,
        minimum_price: '',
        registration_charges: '',
        other_charges: '',
        facing: 'East',
        road_width: '40 ft',
        bedrooms: 0,
        bathrooms: 0,
        ownership: 'Freehold',
        broker: '',
        assigned_to: '',
        description: '',
        internal_notes: '',
        latitude: '',
        longitude: '',
        amenities: ['24x7 Water', 'Gated Security'],
      });
    }
  }, [property, projects, locations, isOpen]);

  // Handle Area & Rate changes with auto-calculating total price
  const handleAreaOrRateChange = (field: 'area_sqft' | 'rate_per_sqft', val: string) => {
    const numVal = parseFloat(val);
    const updated = { ...formData, [field]: val };

    const area = field === 'area_sqft' ? numVal : parseFloat(formData.area_sqft);
    const rate = field === 'rate_per_sqft' ? numVal : parseFloat(formData.rate_per_sqft);

    if (!isNaN(area) && !isNaN(rate)) {
      updated.total_price = Number((area * rate).toFixed(2));
    }

    setFormData(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.property_code.trim()) {
      showToast('Validation Error', 'Property ID is required', 'error');
      setFormTab('basic');
      return;
    }
    if (!formData.project_id) {
      showToast('Validation Error', 'Project selection is required', 'error');
      setFormTab('basic');
      return;
    }
    if (!formData.location_id) {
      showToast('Validation Error', 'Location selection is required', 'error');
      setFormTab('basic');
      return;
    }
    if (!formData.area_sqft || Number(formData.area_sqft) <= 0) {
      showToast('Validation Error', 'Area in sq.ft must be greater than 0', 'error');
      setFormTab('pricing');
      return;
    }
    if (!formData.rate_per_sqft || Number(formData.rate_per_sqft) <= 0) {
      showToast('Validation Error', 'Rate per sq.ft must be greater than 0', 'error');
      setFormTab('pricing');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      project_id: Number(formData.project_id),
      location_id: Number(formData.location_id),
      area_sqft: Number(formData.area_sqft),
      rate_per_sqft: Number(formData.rate_per_sqft),
      total_price: Number(formData.total_price),
      minimum_price: formData.minimum_price ? Number(formData.minimum_price) : null,
      registration_charges: formData.registration_charges ? Number(formData.registration_charges) : 0,
      other_charges: formData.other_charges ? Number(formData.other_charges) : 0,
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
    };

    try {
      if (isEditing && property) {
        await api.updateProperty(property.id, payload);
        showToast('Property updated successfully', `Changes saved to ${formData.property_code}`, 'success');
      } else {
        await api.createProperty(payload);
        showToast('Property created successfully', `${formData.property_code} added to inventory`, 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Save failed', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const propertyTypes = [
    'Residential Plot',
    'Commercial Plot',
    'Villa',
    'Apartment',
    'Agricultural Land',
    'Industrial',
  ];
  const statuses: PropertyStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'HOLD', 'UPCOMING', 'DRAFT'];
  const facings = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-800 bg-[#0D1017] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#12161F] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isEditing ? `Edit Property: ${property?.property_code}` : 'Add New Property to Inventory'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isEditing ? 'Modify property parameters and auto-recalculate valuations' : 'Register a new unit into RKS inventory'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-[#0A0C10] px-6">
          {[
            { id: 'basic', label: '1. Basic Information', icon: <Building className="h-4 w-4" /> },
            { id: 'pricing', label: '2. Dimensions & Pricing', icon: <DollarSign className="h-4 w-4" /> },
            { id: 'specs', label: '3. Technical Specs', icon: <Tag className="h-4 w-4" /> },
            { id: 'notes', label: '4. Description & Notes', icon: <FileText className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFormTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-colors ${
                formTab === tab.id
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            {/* TAB 1: BASIC INFO */}
            {formTab === 'basic' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Property ID <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.property_code}
                    onChange={(e) => setFormData({ ...formData, property_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. RKS-00124"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white font-mono uppercase outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Project <span className="text-amber-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Location / Micro-market <span className="text-amber-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.city} - {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Property Type <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={formData.property_type}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  >
                    {propertyTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Availability Status <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  >
                    {statuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Premium Corner, Ultra Luxury"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Plot Number / Unit Name
                  </label>
                  <input
                    type="text"
                    value={formData.plot_number}
                    onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })}
                    placeholder="e.g. Plot 124"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Survey Number
                  </label>
                  <input
                    type="text"
                    value={formData.survey_number}
                    onChange={(e) => setFormData({ ...formData, survey_number: e.target.value })}
                    placeholder="e.g. 142/3B"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: DIMENSIONS & PRICING */}
            {formTab === 'pricing' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase">
                        Dynamic Price Calculation Engine
                      </div>
                      <div className="text-xs text-zinc-400">
                        Total Price = Area (Sq.Ft) × Rate per Sq.Ft
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-lg font-black text-emerald-400">
                      {formatCurrencyINR(formData.total_price)}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {formatCurrencyINR(formData.total_price, true)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Area in Sq.Ft <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.area_sqft}
                      onChange={(e) => handleAreaOrRateChange('area_sqft', e.target.value)}
                      placeholder="e.g. 2400"
                      className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-500"
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">
                      ≈ {(Number(formData.area_sqft || 0) * 0.092903).toFixed(2)} Sq.Meters • {(Number(formData.area_sqft || 0) / 435.6).toFixed(2)} Cents • {(Number(formData.area_sqft || 0) / 2400).toFixed(2)} Grounds
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Rate per Sq.Ft (₹) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.rate_per_sqft}
                      onChange={(e) => handleAreaOrRateChange('rate_per_sqft', e.target.value)}
                      placeholder="e.g. 5200"
                      className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Minimum / Bottom Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.minimum_price}
                      onChange={(e) => setFormData({ ...formData, minimum_price: e.target.value })}
                      placeholder="e.g. 11500000"
                      className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Registration Charges (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.registration_charges}
                      onChange={(e) => setFormData({ ...formData, registration_charges: e.target.value })}
                      placeholder="e.g. 850000"
                      className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="negotiable-checkbox"
                      checked={formData.negotiable}
                      onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <label htmlFor="negotiable-checkbox" className="text-xs font-semibold text-zinc-300 cursor-pointer">
                      Price is Negotiable
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SPECIFICATIONS */}
            {formTab === 'specs' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Facing Direction</label>
                  <select
                    value={formData.facing}
                    onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  >
                    {facings.map((f) => (
                      <option key={f} value={f}>
                        {f} Facing
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Road Width</label>
                  <input
                    type="text"
                    value={formData.road_width}
                    onChange={(e) => setFormData({ ...formData, road_width: e.target.value })}
                    placeholder="e.g. 40 ft, 60 ft Main Road"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Ownership Type</label>
                  <select
                    value={formData.ownership}
                    onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  >
                    <option value="Freehold">Freehold</option>
                    <option value="Leasehold">Leasehold</option>
                    <option value="Joint Venture">Joint Venture</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Approval / RERA Number</label>
                  <input
                    type="text"
                    value={formData.approval_number}
                    onChange={(e) => setFormData({ ...formData, approval_number: e.target.value })}
                    placeholder="e.g. DTCP/L/0423/2024"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Latitude (for Map view)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g. 12.8442"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Longitude (for Map view)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g. 80.0635"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: NOTES & DESCRIPTION */}
            {formTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Property Description (Public / Customer Facing)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide overview of property, elevation, road connectivity..."
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] p-3 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-amber-400">
                    Internal Notes & Legal Status (Internal RKS Staff Only)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="Parent documents, token advance notes, seller negotiations..."
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#12161F] p-3 text-sm text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-zinc-800 bg-[#12161F] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {formTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    if (formTab === 'notes') setFormTab('specs');
                    else if (formTab === 'specs') setFormTab('pricing');
                    else if (formTab === 'pricing') setFormTab('basic');
                  }}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
                >
                  Previous
                </button>
              )}

              {formTab !== 'notes' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (formTab === 'basic') setFormTab('pricing');
                    else if (formTab === 'pricing') setFormTab('specs');
                    else if (formTab === 'specs') setFormTab('notes');
                  }}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                >
                  Next Step
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2 text-sm font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Property' : 'Create Property'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
