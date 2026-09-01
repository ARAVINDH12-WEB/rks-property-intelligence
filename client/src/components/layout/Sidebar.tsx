import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext.js';
import {
  LayoutDashboard,
  Building2,
  CheckCircle2,
  Clock,
  CheckCheck,
  FolderKanban,
  MapPin,
  FileSpreadsheet,
  BarChart3,
  History,
  Settings,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    badgeCounts,
    activeRole,
    currentUser,
  } = useApp();

  const allNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
    staffOnly?: boolean;
  }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      id: 'properties',
      label: activeRole === 'VIEWER' ? 'Explore Plots' : 'Properties',
      icon: <Building2 className="h-4 w-4" />,
      badge: badgeCounts.total,
      badgeColor: 'bg-zinc-800 text-zinc-300',
    },
    {
      id: 'available',
      label: 'Available Plots',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      badge: badgeCounts.available,
      badgeColor: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'reserved',
      label: 'Reserved',
      icon: <Clock className="h-4 w-4 text-amber-400" />,
      badge: badgeCounts.reserved,
      badgeColor: 'bg-amber-950/60 text-amber-300 border border-amber-500/30',
      staffOnly: true,
    },
    {
      id: 'sold',
      label: 'Sold',
      icon: <CheckCheck className="h-4 w-4 text-rose-400" />,
      badge: badgeCounts.sold,
      badgeColor: 'bg-rose-950/60 text-rose-300 border border-rose-500/30',
      staffOnly: true,
    },
    {
      id: 'site-visits',
      label: activeRole === 'VIEWER' ? 'Book Site Visit' : 'Site Visits',
      icon: <Calendar className="h-4 w-4 text-cyan-400" />,
      badge: activeRole !== 'VIEWER' ? badgeCounts.siteVisits : undefined,
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30',
    },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
    { id: 'locations', label: 'Micro-Markets', icon: <MapPin className="h-4 w-4" /> },
    { id: 'team', label: 'Team Members', icon: <Users className="h-4 w-4 text-amber-300" />, staffOnly: true },
    { id: 'import', label: 'Import Data', icon: <FileSpreadsheet className="h-4 w-4 text-amber-400" />, staffOnly: true },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" />, staffOnly: true },
    { id: 'audit', label: 'Audit Logs', icon: <History className="h-4 w-4" />, staffOnly: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, staffOnly: true },
  ];

  const navItems = allNavItems.filter((item) => !item.staffOnly || activeRole !== 'VIEWER');

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col border-r border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#0D1017] transition-all duration-300 shadow-sm ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 font-extrabold text-black shadow-lg shadow-amber-500/20 font-mono tracking-tighter">
            RKS
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
                RKS Intelligence
              </span>
              <span className="text-[10px] font-medium tracking-widest text-amber-600 dark:text-amber-400/90 uppercase font-mono">
                {activeRole === 'VIEWER' ? 'Customer Portal' : 'Command Center'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className="rounded-lg p-1.5 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
              } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 truncate">
                <span className={`${isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200'}`}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!sidebarCollapsed && item.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold font-mono ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-amber-500 shadow-sm shadow-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Role Badge Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-[#0A0C10]/60">
        <div
          className={`flex items-center gap-3 rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#12161F] p-2.5 shadow-sm ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Shield className="h-4 w-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                {currentUser?.name || 'Guest User'}
              </span>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                {activeRole}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
