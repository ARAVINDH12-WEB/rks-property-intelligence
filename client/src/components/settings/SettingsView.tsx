import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { UserRole } from '../../types/index.js';
import { Shield, Database, User, Key, Check, Info } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { activeRole, setActiveRole, theme, toggleTheme } = useApp();
  const [dbHealth, setDbHealth] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setDbHealth(data))
      .catch(() => {});
  }, []);

  const roles: { role: UserRole; desc: string; perms: string[] }[] = [
    {
      role: 'ADMIN',
      desc: 'Master Director with unrestricted access across all properties, destructive deletions, user management, and Excel batch commits.',
      perms: ['Create / Edit / Archive Properties', 'Inline Pricing & Valuation Updates', 'Bulk Status & Assignment Operations', 'Permanent Property Deletion', 'Full Excel/CSV Database Import', 'Complete Audit Log Inspection'],
    },
    {
      role: 'MANAGER',
      desc: 'Portfolio Manager with inventory allocation permissions, pricing adjustments, and bulk assignment management.',
      perms: ['Create / Edit / Archive Properties', 'Inline Pricing & Valuation Updates', 'Bulk Status Operations', 'Excel/CSV Database Import', 'Audit Log Inspection'],
    },
    {
      role: 'EMPLOYEE',
      desc: 'Sales & Inventory Officer capable of creating listings, modifying permitted fields, and reserving units.',
      perms: ['Create & Edit Properties', 'Update Availability Status', 'View Complete Inventory & Specifications', 'Export Reports'],
    },
    {
      role: 'VIEWER',
      desc: 'External Auditor or Stakeholder with read-only access to inventory metrics and valuation reports.',
      perms: ['Read-only Inventory Search & Filter', 'View Property Intelligence & Conversions', 'View Analytics Reports'],
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white font-sans">
          Platform Settings & Role Authorization
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage system configuration, switch testing roles, and inspect database connectivity.
        </p>
      </div>

      {/* Role Management Card */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Active Role & Permission Matrix</h3>
            <p className="text-xs text-zinc-400">Select an active role below to test RBAC enforcement live across all views.</p>
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
                    : 'border-zinc-800 bg-[#0A0C10] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-white">
                    {r.role}
                  </span>
                  {isSelected && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                      ACTIVE
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  {r.desc}
                </p>

                <div className="mt-4 space-y-1.5 border-t border-zinc-800/80 pt-3">
                  {r.perms.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-zinc-300">
                      <Check className="h-3 w-3 text-emerald-400 shrink-0" />
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
      <div className="rounded-2xl border border-zinc-800 bg-[#12161F]/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Database & System Health</h3>
            <p className="text-xs text-zinc-400">Underlying relational PostgreSQL engine status</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-xs pt-2">
          <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-3">
            <span className="text-zinc-500 uppercase font-sans text-[10px]">Database Engine</span>
            <div className="mt-1 font-bold text-emerald-400">{dbHealth?.database || 'PostgreSQL'}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-3">
            <span className="text-zinc-500 uppercase font-sans text-[10px]">Database Status</span>
            <div className="mt-1 font-bold text-emerald-400">{dbHealth?.status || 'OK'}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-3">
            <span className="text-zinc-500 uppercase font-sans text-[10px]">Properties Stored</span>
            <div className="mt-1 font-bold text-white">{dbHealth?.propertiesCount || 24} units</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#0A0C10] p-3">
            <span className="text-zinc-500 uppercase font-sans text-[10px]">Theme Mode</span>
            <div className="mt-1 font-bold text-amber-400 uppercase">{theme} MODE</div>
          </div>
        </div>
      </div>
    </div>
  );
};
