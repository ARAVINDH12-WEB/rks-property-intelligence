import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { UserRole } from '../../types/index.js';
import { api } from '../../services/api.js';
import {
  Shield,
  Database,
  User,
  Key,
  Check,
  Info,
  Phone,
  MessageCircle,
  Save,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { activeRole, setActiveRole, theme, toggleTheme, showToast } = useApp();
  const [dbHealth, setDbHealth] = useState<any>(null);

  // WhatsApp Settings (Admin Only)
  const [whatsappNumber, setWhatsappNumber] = useState('+919840011223');
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setDbHealth(data))
      .catch(() => {});

    api
      .getWhatsAppConfig()
      .then((res) => {
        if (res.whatsapp_number) setWhatsappNumber(res.whatsapp_number);
      })
      .catch(() => {});
  }, []);

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber.trim()) {
      showToast('Validation Error', 'WhatsApp number cannot be empty', 'error');
      return;
    }

    setIsSavingWhatsapp(true);
    try {
      const res = await api.updateWhatsAppNumber(whatsappNumber.trim());
      showToast('WhatsApp Number Updated', res.message, 'success');
    } catch (err: any) {
      showToast('Update Failed', err.message, 'error');
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const isAdmin = activeRole === 'ADMIN';

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
        'Edit System WhatsApp & Site Settings',
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

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
          Platform Settings & Role Authorization
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Manage system configuration, configure customer connect channels, and inspect database connectivity.
        </p>
      </div>

      {/* Admin-Only WhatsApp Support Settings */}
      {isAdmin && (
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Customer WhatsApp Connect Number
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Configure the primary WhatsApp support number used by the customer-facing chat button.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Live Sync
            </span>
          </div>

          <form onSubmit={handleSaveWhatsApp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Official WhatsApp Number (Full International Format) *
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="+919840011223"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingWhatsapp}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingWhatsapp ? 'Saving...' : 'Update Number'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5">
                Must include country code starting with &apos;+&apos; (e.g. <code>+919840011223</code>). Changes take effect instantly for all customers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10] p-3 text-xs flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">
                Test WhatsApp link preview:
              </span>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-[#25D366] hover:underline"
              >
                <span>wa.me/{whatsappNumber.replace(/[^0-9]/g, '')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </form>
        </div>
      )}

      {/* Role Management Card */}
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

      {/* Database & System Architecture Card */}
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
    </div>
  );
};
