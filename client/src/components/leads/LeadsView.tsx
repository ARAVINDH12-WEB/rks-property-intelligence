import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { 
  Users, CheckCircle2, Clock, Ban, Phone, MessageCircle, AlertCircle, RefreshCw, 
  LayoutGrid, List, Plus, X, Upload, Search, Calendar, ChevronRight, TrendingUp,
  MapPin, Shield, FileSpreadsheet, Sparkles, Filter
} from 'lucide-react';
import { 
  PlotOutlineIcon, PattaDocumentIcon, CabPickupIcon, RupeeSignIcon, 
  GrowthCorridorIcon, WhatsAppIcon, PhoneCallIcon 
} from '../common/Icons.js';
import { LeadImportModal } from './LeadImportModal.js';
import { formatCurrencyINR } from '../../utils/formatters.js';
import { openWhatsApp } from '../../utils/whatsapp.js';

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  notes: string | null;
  property_id: number | null;
  property_code: string | null;
  status: string;
  created_at: string;
  total_price: number | null;
  area_sqft: number | null;
  property_type: string | null;
  property_city: string | null;
};

const STAGES = [
  { id: 'NEW', label: 'New Inquiries', shortLabel: 'New', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { id: 'CONTACTED', label: 'Contacted', shortLabel: 'Contacted', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'SITE_VISIT_SCHEDULED', label: 'Site Tour Booked', shortLabel: 'Site Tour', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { id: 'NEGOTIATION', label: 'Token & Negotiation', shortLabel: 'Negotiating', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { id: 'CLOSED_WON', label: 'Closed & Registered', shortLabel: 'Won Deal', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'CLOSED_LOST', label: 'Dropped / Archived', shortLabel: 'Archived', color: 'text-slate-400', bg: 'bg-slate-800/40', border: 'border-slate-700/50' }
];

export const LeadsView: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, refreshTrigger } = useApp();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'dense' | 'kanban' | 'table'>('dense');
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'PHONE_INQUIRY',
    status: 'NEW',
    property_code: '',
    notes: ''
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.getLeads({ limit: 500 });
      setLeads(res.leads || []);
      setStats(res.stats || {});
    } catch (err: any) {
      showToast('Error fetching leads', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [refreshTrigger]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.updateLeadStatus(id, newStatus);
      showToast('Status updated', 'Lead moved to new pipeline stage', 'success');
      fetchLeads();
    } catch (err: any) {
      showToast('Update failed', err.message, 'error');
    }
  };

  const deleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.deleteLead(id);
      showToast('Lead removed', '', 'success');
      fetchLeads();
    } catch (err: any) {
      showToast('Delete failed', err.message, 'error');
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name.trim()) {
      showToast('Validation Error', 'Lead name is required', 'error');
      return;
    }
    const cleanPhone = newLeadForm.phone.trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Validation Error', 'Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.postLead({
        name: newLeadForm.name.trim(),
        phone: cleanPhone,
        email: newLeadForm.email.trim() || undefined,
        source: newLeadForm.source,
        status: newLeadForm.status,
        property_code: newLeadForm.property_code.trim() || undefined,
        notes: newLeadForm.notes.trim() || undefined
      });

      showToast('Lead Ingested', `Added ${newLeadForm.name} to the pipeline`, 'success');
      setShowAddModal(false);
      setNewLeadForm({
        name: '',
        phone: '',
        email: '',
        source: 'PHONE_INQUIRY',
        status: 'NEW',
        property_code: '',
        notes: ''
      });
      fetchLeads();
    } catch (err: any) {
      showToast('Failed to create lead', err.message || 'Error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 10) return phone;
    return `+91 ${phone.slice(0, 2)}****${phone.slice(-4)}`;
  };

  const handleWhatsApp = (phone: string, name: string, propCode?: string | null) => {
    const text = `Vanakkam ${name}, greeting from RKS Property Hub. Following up regarding your inquiry for ${propCode || 'our surveyed plots'}. When would be convenient for a brief call or site visit?`;
    openWhatsApp(phone, text);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:+91${phone}`, '_self');
  };

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    const matchesStage = activeStageFilter === 'ALL' || l.status === activeStageFilter;
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch = !q || 
      l.name.toLowerCase().includes(q) || 
      l.phone.includes(q) || 
      (l.property_code && l.property_code.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q));
    return matchesStage && matchesSearch;
  });

  // KPI Calculations
  const totalLeads = leads.length;
  const activePipelineLeads = leads.filter(l => !['CLOSED_WON', 'CLOSED_LOST'].includes(l.status)).length;
  const siteVisitsBooked = leads.filter(l => l.status === 'SITE_VISIT_SCHEDULED').length;
  const closedWonDeals = leads.filter(l => l.status === 'CLOSED_WON').length;
  const conversionRate = totalLeads > 0 ? Math.round((closedWonDeals / totalLeads) * 100) : 0;
  
  // Pipeline Estimated Value
  const estimatedPipelineValue = leads
    .filter(l => !['CLOSED_LOST'].includes(l.status))
    .reduce((acc, l) => acc + (l.total_price || 1500000), 0);

  // Stale Lead Indicator (3+ days untouched without closing)
  const isStaleLead = (createdAt: string, status: string) => {
    if (!createdAt || ['CLOSED_WON', 'CLOSED_LOST'].includes(status)) return false;
    const createdDate = new Date(createdAt);
    const diffDays = (Date.now() - createdDate.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 3;
  };

  // Lead Temperature Indicator
  const getLeadUrgency = (lead: Lead) => {
    if (lead.status === 'CLOSED_WON') return { label: 'REGISTERED', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (lead.status === 'CLOSED_LOST') return { label: 'ARCHIVED', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    if (lead.status === 'SITE_VISIT_SCHEDULED' || lead.status === 'NEGOTIATION') {
      return { label: '🔥 HOT BUYER', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' };
    }
    if (lead.source === 'WHATSAPP' || lead.source === 'PHONE_INQUIRY') {
      return { label: '⚡ WARM LEAD', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
    return { label: '❄️ INQUIRY', color: 'bg-sky-500/10 text-sky-300 border-sky-500/30' };
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0E131E] border border-slate-800/80 p-5 rounded-2xl shadow-luxury-dark relative overflow-hidden">
        {/* Subtle survey grid background pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#0F766E 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-teal/20 via-brand-navy to-slate-900 border border-brand-teal/40 flex items-center justify-center text-brand-teal-light shadow-inner">
              <PlotOutlineIcon size={24} className="text-brand-teal-light" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight font-sans">
                  Buyer Pipeline & Demand Engine
                </h2>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-brand-gold/15 text-brand-gold-light border border-brand-gold/30">
                  RKS Direct Inventory
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of surveyed plot buyers, site tour bookings, and plot registrations
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-teal-light" />
            <span>Import Leads</span>
          </button>

          {/* Add Single Lead Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-teal to-teal-600 hover:from-teal-500 hover:to-teal-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-teal-900/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Enquiry</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('dense')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'dense' 
                  ? 'bg-brand-teal text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hybrid Dense Cards Mode"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dense Grid</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-brand-teal text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Horizontal Kanban Rail"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-brand-teal text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tabular Ledger View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ledger</span>
            </button>
          </div>

          <button 
            onClick={fetchLeads} 
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
            title="Refresh Leads Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-teal-light' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Funnel Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0D121C] border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Enquiries</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalLeads}</span>
            <span className="text-[10px] text-slate-400">Logged</span>
          </div>
        </div>

        <div className="bg-[#0D121C] border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Pipeline</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300">{activePipelineLeads}</span>
            <span className="text-[10px] text-amber-400/80">In Progress</span>
          </div>
        </div>

        <div className="bg-[#0D121C] border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Site Tours</span>
            <CabPickupIcon size={16} className="text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-300">{siteVisitsBooked}</span>
            <span className="text-[10px] text-cyan-400/80">Booked</span>
          </div>
        </div>

        <div className="bg-[#0D121C] border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Deals Closed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-300">{closedWonDeals}</span>
            <span className="text-[10px] text-emerald-400/80">Registered</span>
          </div>
        </div>

        <div className="bg-[#0D121C] border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-brand-teal-light">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Win Conversion</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{conversionRate}%</span>
            <span className="text-[10px] text-emerald-400">High Intent</span>
          </div>
        </div>

        <div className="bg-[#0D121C] border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-brand-gold-light">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pipeline Value</span>
            <RupeeSignIcon size={16} className="text-brand-gold-light" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-brand-gold-light">
              ₹{(estimatedPipelineValue / 10000000).toFixed(2)} Cr
            </span>
          </div>
        </div>
      </div>

      {/* 3. Stage Navigation Chevron Rail & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0A0E17] border border-slate-800/80 p-2.5 rounded-xl">
        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveStageFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeStageFilter === 'ALL'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Stages ({totalLeads})
          </button>
          {STAGES.map(stage => {
            const count = stats[stage.id] || leads.filter(l => l.status === stage.id).length;
            const isActive = activeStageFilter === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageFilter(stage.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                  isActive
                    ? `${stage.bg} ${stage.color} ${stage.border} ring-1 ring-white/10`
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{stage.shortLabel}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/40">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Filter Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by buyer, phone, plot..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-teal"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Leads Content Presentation */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-72 bg-[#0D121C] rounded-2xl border border-slate-800">
          <div className="animate-spin w-9 h-9 border-3 border-brand-teal border-t-transparent rounded-full" />
          <p className="text-xs text-slate-400 mt-3 font-mono">Synchronizing property buyer pipeline...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#0D121C] border border-dashed border-slate-800 rounded-2xl text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
            <PlotOutlineIcon size={28} />
          </div>
          <h4 className="text-base font-bold text-white">No Matching Leads Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {searchFilter 
              ? `No inquiries match "${searchFilter}". Try another keyword or clear search.` 
              : 'There are no active inquiries in this stage. Add a new lead or import records to populate.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold transition-colors"
          >
            + Add New Lead
          </button>
        </div>
      ) : (
        <>
          {/* VIEW MODE A: PRIMARY HYBRID DENSE CARDS */}
          {viewMode === 'dense' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredLeads.map(lead => {
                const urgency = getLeadUrgency(lead);
                const stageObj = STAGES.find(s => s.id === lead.status) || STAGES[0];

                return (
                  <div 
                    key={lead.id}
                    className="bg-[#0D121C] border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4 transition-all hover:shadow-luxury-dark flex flex-col justify-between relative group overflow-hidden"
                  >
                    {/* Top status bar & buyer info */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center text-xs font-bold font-mono text-brand-gold">
                            {lead.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white group-hover:text-brand-teal-light transition-colors">
                              {lead.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono">{maskPhone(lead.phone)}</span>
                              <span>•</span>
                              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                                {lead.source}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Urgency & Stale Badges */}
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${urgency.color}`}>
                            {urgency.label}
                          </span>
                          {isStaleLead(lead.created_at, lead.status) && (
                            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                              <span>⚠️ Stale (3+ days)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Property Intent Pill */}
                      {lead.property_code ? (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PlotOutlineIcon size={16} className="text-brand-teal-light" />
                            <div>
                              <span className="text-xs font-bold font-mono text-white">
                                {lead.property_code}
                              </span>
                              {lead.property_city && (
                                <span className="text-[10px] text-slate-400 ml-1.5">
                                  ({lead.property_city})
                                </span>
                              )}
                            </div>
                          </div>

                          {lead.total_price && (
                            <span className="text-xs font-bold font-mono text-brand-gold">
                              {formatCurrencyINR(lead.total_price)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 mb-3 text-[11px] text-slate-400 italic">
                          Plot: General inquiries across corridor layouts
                        </div>
                      )}

                      {/* Notes / Buyer Needs */}
                      {lead.notes && (
                        <p className="text-xs text-slate-300 bg-black/20 p-2.5 rounded-xl border border-slate-800/40 line-clamp-2 leading-relaxed mb-3">
                          "{lead.notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer Controls: Stage Selector & Quick Connect */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                      {/* Pipeline Stage Select */}
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className={`text-[11px] font-semibold rounded-lg px-2 py-1 outline-none border transition-colors cursor-pointer ${stageObj.bg} ${stageObj.color} ${stageObj.border}`}
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                            {s.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleWhatsApp(lead.phone, lead.name, lead.property_code)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                          title="WhatsApp Follow-up"
                        >
                          <WhatsAppIcon size={14} />
                        </button>
                        <button
                          onClick={() => handleCall(lead.phone)}
                          className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors"
                          title="Direct Call"
                        >
                          <PhoneCallIcon size={14} />
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                          title="Delete Lead"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE B: REDESIGNED UNCLIPPED KANBAN RAIL */}
          {viewMode === 'kanban' && (
            <div className="w-full overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-[1300px] items-start">
                {STAGES.map(stage => {
                  const stageLeads = leads.filter(l => l.status === stage.id);

                  return (
                    <div 
                      key={stage.id} 
                      className="w-[280px] shrink-0 bg-[#0B0F17] border border-slate-800/90 rounded-2xl flex flex-col max-h-[750px] shadow-sm"
                    >
                      {/* Column Header */}
                      <div className={`p-3.5 rounded-t-2xl border-b flex items-center justify-between ${stage.bg} ${stage.border}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${stage.color.replace('text-', 'bg-')}`} />
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>
                            {stage.shortLabel}
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-black/40 text-slate-300 border border-white/10">
                          {stageLeads.length}
                        </span>
                      </div>

                      {/* Column Cards Rail */}
                      <div className="p-3 overflow-y-auto space-y-3 flex-1">
                        {stageLeads.length === 0 ? (
                          <div className="text-center py-10 px-2 text-slate-500 text-xs border border-dashed border-slate-800/60 rounded-xl">
                            No buyers in {stage.shortLabel}
                          </div>
                        ) : (
                          stageLeads.map(lead => {
                            const urgency = getLeadUrgency(lead);
                            return (
                              <div 
                                key={lead.id}
                                className="bg-[#101622] border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all flex flex-col gap-2"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <h5 className="font-bold text-xs text-white leading-snug">{lead.name}</h5>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${urgency.color}`}>
                                    {lead.source}
                                  </span>
                                </div>

                                <span className="font-mono text-[11px] text-slate-400">{maskPhone(lead.phone)}</span>

                                {lead.property_code && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-gold bg-amber-950/20 border border-amber-500/20 px-2 py-0.5 rounded">
                                    <PlotOutlineIcon size={12} className="text-amber-400" />
                                    <span>{lead.property_code}</span>
                                  </div>
                                )}

                                {lead.notes && (
                                  <p className="text-[11px] text-slate-300 italic line-clamp-2">
                                    "{lead.notes}"
                                  </p>
                                )}

                                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                                  <span>{formatRelativeTime(lead.created_at)}</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleWhatsApp(lead.phone, lead.name, lead.property_code)}
                                      className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                      title="WhatsApp"
                                    >
                                      <WhatsAppIcon size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Step Progress Buttons */}
                                <div className="flex gap-1 mt-0.5">
                                  {STAGES.map((s, sIdx) => {
                                    const currentIdx = STAGES.findIndex(x => x.id === lead.status);
                                    if (sIdx === currentIdx + 1) {
                                      return (
                                        <button
                                          key={s.id}
                                          onClick={() => updateStatus(lead.id, s.id)}
                                          className="w-full text-[10px] font-semibold py-1 rounded bg-slate-800 hover:bg-brand-teal text-slate-300 hover:text-white transition-colors border border-slate-700"
                                        >
                                          Advance to {s.shortLabel} →
                                        </button>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE C: TABULAR INVENTORY LEDGER */}
          {viewMode === 'table' && (
            <div className="bg-[#0D121C] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0A0E17] text-slate-400 uppercase text-[10px] border-b border-slate-800 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Buyer Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Channel</th>
                      <th className="px-4 py-3">Pipeline Stage</th>
                      <th className="px-4 py-3">Plot Interest</th>
                      <th className="px-4 py-3">Notes & Requirements</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredLeads.map(lead => {
                      const stageObj = STAGES.find(s => s.id === lead.status) || STAGES[0];
                      return (
                        <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-white">
                            {lead.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">
                            {maskPhone(lead.phone)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
                              {lead.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={lead.status}
                              onChange={e => updateStatus(lead.id, e.target.value)}
                              className={`text-[10px] font-semibold rounded px-2 py-1 outline-none border cursor-pointer ${stageObj.bg} ${stageObj.color} ${stageObj.border}`}
                            >
                              {STAGES.map(s => (
                                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 font-mono text-brand-gold">
                            {lead.property_code || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                            {lead.notes || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                            {formatRelativeTime(lead.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleWhatsApp(lead.phone, lead.name, lead.property_code)}
                                className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                title="WhatsApp"
                              >
                                <WhatsAppIcon size={14} />
                              </button>
                              <button
                                onClick={() => handleCall(lead.phone)}
                                className="p-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                                title="Call"
                              >
                                <PhoneCallIcon size={14} />
                              </button>
                              <button
                                onClick={() => deleteLead(lead.id)}
                                className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                title="Delete"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Single Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0D121B] border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-luxury-dark overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]">
              <div className="flex items-center gap-2">
                <PlotOutlineIcon size={20} className="text-brand-teal-light" />
                <h3 className="font-bold text-base text-white">Manual Lead Ingestion</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Buyer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter buyer full name"
                  value={newLeadForm.name}
                  onChange={e => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-white outline-none focus:border-brand-teal"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9840012345"
                    value={newLeadForm.phone}
                    onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-white outline-none focus:border-brand-teal font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="buyer@example.com"
                    value={newLeadForm.email}
                    onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-white outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Acquisition Channel
                  </label>
                  <select
                    value={newLeadForm.source}
                    onChange={e => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-brand-teal"
                  >
                    <option value="PHONE_INQUIRY">Direct Phone Inquiry</option>
                    <option value="WHATSAPP">WhatsApp Conversation</option>
                    <option value="WALK_IN">Office / Site Walk-in</option>
                    <option value="WEBSITE">Website Form Submission</option>
                    <option value="SITE_VISIT">Site Visit Booking</option>
                    <option value="REFERRAL">Client Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Target Plot Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RKS-EV-001"
                    value={newLeadForm.property_code}
                    onChange={e => setNewLeadForm({ ...newLeadForm, property_code: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-white outline-none focus:border-brand-teal font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Buyer Requirements & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Budget range, facing preference, loan eligibility status..."
                  value={newLeadForm.notes}
                  onChange={e => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-white outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Lead Import Modal */}
      <LeadImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          fetchLeads();
        }}
      />
    </div>
  );
};
