import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { UserRole } from '../../types/index.js';
import { api } from '../../services/api.js';
import { ImageUploadField } from '../common/ImageUploadField.js';
import { SettingsTabLayout } from '../common/SettingsTabLayout.js';
import { ToggleSwitch } from '../common/ToggleSwitch.js';
import {
  Shield,
  Database,
  Phone,
  MessageCircle,
  Save,
  CheckCircle2,
  ExternalLink,
  Sliders,
  BarChart3,
  Globe,
  Mail,
  MapPin,
  Share2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Sparkles,
  Bot,
  Calendar,
  Tag,
  Layers,
  Check,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { activeRole, setActiveRole, theme, showToast } = useApp();
  const isAdmin = activeRole === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'general' | 'stats' | 'toggles' | 'roles' | 'system'>('general');
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State Dictionary
  const [settings, setSettings] = useState<Record<string, string>>({
    whatsapp_number: '+919840011223',
    contact_phone: '+91 98400 11223',
    contact_email: 'info@rksgroup.in',
    contact_address: 'No. 42, GST Road, Guindy, Chennai, Tamil Nadu - 600032',
    social_facebook: 'https://facebook.com/rksgroup',
    social_instagram: 'https://instagram.com/rksgroup',
    social_linkedin: 'https://linkedin.com/company/rksgroup',
    stat_total_plots: '58+',
    stat_base_rate: '₹850/sq.ft',
    stat_total_acreage: '120+ Acres',
    stat_happy_customers: '2,400+',
    toggle_whatsapp_button: 'true',
    toggle_offers_section: 'true',
    toggle_site_visit_booking: 'true',
    toggle_ai_concierge: 'true',
  });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setDbHealth(data))
      .catch(() => {});

    api
      .getSettings()
      .then((res) => {
        if (res.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    const current = settings[key] === 'true';
    setSettings((prev) => ({ ...prev, [key]: current ? 'false' : 'true' }));
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) {
      showToast('Permission Denied', 'Only Administrator can modify platform settings.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateSettings(settings);
      showToast('Settings Saved', res.message, 'success');
    } catch (err: any) {
      showToast('Save Failed', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const roles: { role: UserRole; desc: string; perms: string[] }[] = [
    {
      role: 'ADMIN',
      desc: 'Master Director with unrestricted access across all properties, destructive deletions, user management, and Excel batch commits.',
      perms: [
        'Create / Edit / Archive Properties',
        'Inline Pricing & Valuation Updates',
        'Bulk Status & Assignment Operations',
        'Permanent Property Deletion',
        'Full Excel/CSV Database Import',
        'Complete Audit Log Inspection',
        'Edit System WhatsApp, Stats & Feature Toggles',
      ],
    },
    {
      role: 'MANAGER',
      desc: 'Portfolio Manager with inventory allocation permissions, pricing adjustments, and bulk assignment management.',
      perms: [
        'Create / Edit / Archive Properties',
        'Inline Pricing & Valuation Updates',
        'Bulk Status Operations',
        'Excel/CSV Database Import',
        'Audit Log Inspection',
      ],
    },
    {
      role: 'EMPLOYEE',
      desc: 'Sales & Inventory Officer capable of creating listings, modifying permitted fields, and reserving units.',
      perms: [
        'Create & Edit Properties',
        'Update Availability Status',
        'View Complete Inventory & Specifications',
        'Export Reports',
      ],
    },
    {
      role: 'VIEWER',
      desc: 'External Customer or Stakeholder with read-only access to available plots, promotional offers, and WhatsApp connect.',
      perms: [
        'Explore Available Listings & Layouts',
        'View Special Promotional Offers',
        'Book Direct Site Visits & Cab Pickup',
        'Instant WhatsApp Concierge Connect',
      ],
    },
  ];

  const tabs = [
    { id: 'general', label: 'Contact & Social', icon: Globe },
    { id: 'stats', label: 'Stats & Highlights', icon: BarChart3 },
    { id: 'toggles', label: 'Feature Toggles', icon: Sliders },
    { id: 'roles', label: 'Role Permissions', icon: Shield },
    { id: 'system', label: 'System & Database', icon: Database },
  ];

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            Site Settings & Dynamic Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Manage public contact channels, homepage statistics, feature on/off switches, and RBAC matrix in real time.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <SettingsTabLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
      />

      {/* TAB 1: General & Contact Settings */}
      {activeTab === 'general' && (
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Official Contact & Public Channels
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                These details are displayed across the customer portal, site visit confirmations, and footer.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> No Code Edit Needed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Customer WhatsApp Number (Full International Format) *
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#25D366]" />
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.whatsapp_number}
                  onChange={(e) => handleSettingChange('whatsapp_number', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
                  placeholder="+919840011223"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Official Support Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.contact_phone}
                  onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                  placeholder="+91 98400 11223"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Support Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  disabled={!isAdmin}
                  value={settings.contact_email}
                  onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                  placeholder="info@rksgroup.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Corporate Office Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.contact_address}
                  onChange={(e) => handleSettingChange('contact_address', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                  placeholder="No. 42, GST Road, Guindy, Chennai"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Social Media Profiles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">Facebook URL</span>
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={settings.social_facebook}
                  onChange={(e) => handleSettingChange('social_facebook', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">Instagram URL</span>
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={settings.social_instagram}
                  onChange={(e) => handleSettingChange('social_instagram', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">LinkedIn URL</span>
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={settings.social_linkedin}
                  onChange={(e) => handleSettingChange('social_linkedin', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Stats & Highlights with Live Preview */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Homepage Highlights & Metric Badges
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Update key marketing statistics shown to prospective property buyers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Total Plots Stat
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.stat_total_plots}
                  onChange={(e) => handleSettingChange('stat_total_plots', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none disabled:opacity-60"
                  placeholder="58+"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Base Price / Sq.Ft
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.stat_base_rate}
                  onChange={(e) => handleSettingChange('stat_base_rate', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none disabled:opacity-60"
                  placeholder="₹850/sq.ft"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Total Land Acreage
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.stat_total_acreage}
                  onChange={(e) => handleSettingChange('stat_total_acreage', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none disabled:opacity-60"
                  placeholder="120+ Acres"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Happy Clients
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.stat_happy_customers}
                  onChange={(e) => handleSettingChange('stat_happy_customers', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none disabled:opacity-60"
                  placeholder="2,400+"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Snippet (Step 6) */}
          <div className="rounded-3xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400">
              <Eye className="h-4 w-4" />
              <span>Live Preview: How customers will see these stats on the homepage</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0C10] p-4 text-center shadow-sm">
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {settings.stat_total_plots || '58+'}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mt-1">
                  Surveyed Plots
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0C10] p-4 text-center shadow-sm">
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {settings.stat_base_rate || '₹850/sq.ft'}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mt-1">
                  Base Price
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0C10] p-4 text-center shadow-sm">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {settings.stat_total_acreage || '120+ Acres'}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mt-1">
                  Township Land
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0C10] p-4 text-center shadow-sm">
                <div className="text-xl font-black text-violet-600 dark:text-violet-400 font-mono">
                  {settings.stat_happy_customers || '2,400+'}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mt-1">
                  Happy Families
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Feature Toggles */}
      {activeTab === 'toggles' && (
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Platform Feature Toggles
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Instantly enable or disable optional features platform-wide with 1 click.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp Button Toggle */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] shadow-sm">
              <ToggleSwitch
                label="Customer WhatsApp Concierge Button"
                description="Floating green button on all customer pages"
                checked={settings.toggle_whatsapp_button === 'true'}
                onChange={() => isAdmin && handleToggle('toggle_whatsapp_button')}
                disabled={!isAdmin}
                id="toggle-whatsapp"
              />
            </div>

            {/* Offers Section Toggle */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] shadow-sm">
              <ToggleSwitch
                label="Special Promotional Offers Section"
                description="Displays promotional discounts and banners"
                checked={settings.toggle_offers_section === 'true'}
                onChange={() => isAdmin && handleToggle('toggle_offers_section')}
                disabled={!isAdmin}
                id="toggle-offers"
              />
            </div>

            {/* Site Visit Booking Toggle */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] shadow-sm">
              <ToggleSwitch
                label="Site Visit Booking Module"
                description="Allows customers to book cab and property tours"
                checked={settings.toggle_site_visit_booking === 'true'}
                onChange={() => isAdmin && handleToggle('toggle_site_visit_booking')}
                disabled={!isAdmin}
                id="toggle-site-visit"
              />
            </div>

            {/* AI Concierge Toggle */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] shadow-sm">
              <ToggleSwitch
                label="AI Property Advisor (Floating Bot)"
                description="Instant multimodal plot intelligence concierge"
                checked={settings.toggle_ai_concierge === 'true'}
                onChange={() => isAdmin && handleToggle('toggle_ai_concierge')}
                disabled={!isAdmin}
                id="toggle-ai-concierge"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Role Matrix */}
      {activeTab === 'roles' && (
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Role & Permission Matrix</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Select an active role below to test RBAC enforcement live across all views.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {roles.map((r) => {
              const isSelected = activeRole === r.role;
              return (
                <div
                  key={r.role}
                  onClick={() => setActiveRole(r.role)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500 shadow-lg'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-[#0A0C10] hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {r.role}
                    </span>
                    {isSelected && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    {r.desc}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-slate-200 dark:border-zinc-800/80 pt-3">
                    {r.perms.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-zinc-300">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: System & Database Health */}
      {activeTab === 'system' && (
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Database & System Health</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Underlying relational PostgreSQL engine status</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-xs pt-2">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10] p-3">
              <span className="text-slate-400 dark:text-zinc-500 uppercase font-sans text-[10px]">Database Engine</span>
              <div className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">{dbHealth?.database || 'PostgreSQL'}</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10] p-3">
              <span className="text-slate-400 dark:text-zinc-500 uppercase font-sans text-[10px]">Database Status</span>
              <div className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">{dbHealth?.status || 'OK'}</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10] p-3">
              <span className="text-slate-400 dark:text-zinc-500 uppercase font-sans text-[10px]">Properties Stored</span>
              <div className="mt-1 font-bold text-slate-900 dark:text-white">{dbHealth?.propertiesCount || 0} units</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10] p-3">
              <span className="text-slate-400 dark:text-zinc-500 uppercase font-sans text-[10px]">Theme Mode</span>
              <div className="mt-1 font-bold text-amber-600 dark:text-amber-400 uppercase">{theme} MODE</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
