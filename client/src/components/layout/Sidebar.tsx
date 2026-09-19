import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext.js';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  CheckCheck,
  FolderKanban,
  FileSpreadsheet,
  BarChart3,
  History,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
  X,
  UserCheck,
} from 'lucide-react';
import {
  PlotOutlineIcon,
  PattaDocumentIcon,
  CabPickupIcon,
  SurveyPinIcon,
  GrowthCorridorIcon,
} from '../common/Icons.js';

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
      label: activeRole === 'VIEWER' ? 'Explore Plots' : 'All Properties',
      icon: <PlotOutlineIcon size={16} />,
      badge: badgeCounts.total,
      badgeColor: 'bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300',
    },
    {
      id: 'available',
      label: 'Available Plots',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      badge: badgeCounts.available,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'reserved',
      label: 'Reserved Plots',
      icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      badge: badgeCounts.reserved,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30',
      staffOnly: true,
    },
    {
      id: 'sold',
      label: 'Registered & Sold',
      icon: <CheckCheck className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
      badge: badgeCounts.sold,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-500/30',
      staffOnly: true,
    },
    {
      id: 'site-visits',
      label: activeRole === 'VIEWER' ? 'Book Site Tour' : 'Site Tours & Cabs',
      icon: <CabPickupIcon size={16} className="text-cyan-600 dark:text-cyan-400" />,
      badge: activeRole !== 'VIEWER' ? badgeCounts.siteVisits : undefined,
      badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'leads',
      label: 'Buyer Pipeline',
      icon: <PattaDocumentIcon size={16} className="text-brand-teal-light" />,
      badge: badgeCounts.leads > 0 ? badgeCounts.leads : undefined,
      badgeColor: 'bg-brand-teal text-white border border-brand-teal-light/40 shadow-sm',
      staffOnly: true,
    },
    {
      id: 'offers',
      label: activeRole === 'VIEWER' ? 'Special Offers' : 'Deals & Offers',
      icon: <Sparkles className="h-4 w-4 text-pink-400" />,
    },
    { 
      id: 'projects', 
      label: 'Projects / Layouts', 
      icon: <FolderKanban className="h-4 w-4 text-amber-300" /> 
    },
    { 
      id: 'locations', 
      label: 'Growth Corridors', 
      icon: <GrowthCorridorIcon size={16} className="text-emerald-400" /> 
    },
    { id: 'team', label: 'Team Members', icon: <Users className="h-4 w-4 text-slate-300" />, staffOnly: true },
    { id: 'import', label: 'Import Data', icon: <FileSpreadsheet className="h-4 w-4 text-amber-400" />, staffOnly: true },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="h-4 w-4" />, staffOnly: true },
    { id: 'audit', label: 'Audit Trail', icon: <History className="h-4 w-4" />, staffOnly: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, staffOnly: true },
  ];

  const navItems = allNavItems.filter((item) => !item.staffOnly || activeRole !== 'VIEWER');

  const handleNavClick = (id: NavigationTab) => {
    setActiveTab(id);
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {!sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#0B0F17] transition-all duration-300 shadow-xl md:shadow-none ${
          sidebarCollapsed
            ? '-translate-x-full md:translate-x-0 md:w-20'
            : 'translate-x-0 w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#090C12] shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-white p-1 shadow-sm border border-slate-200/80 flex items-center justify-center">
              <img
                src="/logo-icon.png"
                alt="RKS Property Hub"
                className="h-full w-full object-contain"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white font-heading">
                  RKS Property Hub
                </span>
                <span className="text-[9px] font-bold tracking-widest text-brand-teal uppercase font-mono">
                  {activeRole === 'VIEWER' ? 'Customer Portal' : 'COMMAND CENTER'}
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="rounded-lg p-1.5 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="hidden md:block">
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </span>
            <span className="md:hidden">
              <X className="h-4 w-4" />
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={
                  isActive
                    ? {
                        backgroundImage: `radial-gradient(#0F766E 1px, transparent 1px)`,
                        backgroundSize: '12px 12px',
                      }
                    : undefined
                }
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-brand-teal/15 text-slate-900 dark:text-white border border-brand-teal/40 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
                } ${sidebarCollapsed ? 'justify-center md:justify-center' : 'justify-between'}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className={`${isActive ? 'text-brand-teal-light' : 'text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200'}`}>
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
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-teal shadow-sm shadow-brand-teal" />
                )}
              </button>
            );
          })}
        </div>

        {/* Role Badge Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-[#0A0C10]/60 shrink-0">
          <div
            className={`flex items-center gap-3 rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#12161F] p-2.5 shadow-sm ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-gold/30 to-amber-700/30 border border-brand-gold/40 text-brand-gold font-bold">
              <Shield className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#12161F]" />
            </div>

            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser?.name || 'RKS Administrator'}
                </span>
                <span className="truncate text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                  {activeRole} · Verified
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
