import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Property, UserRole } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatCurrencyINR, formatSqFt } from '../../utils/formatters.js';
import { LoginModal } from '../auth/LoginModal.js';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Shield,
  Bell,
  Command,
  ChevronDown,
  Building,
  Calendar,
  Lock,
  LogOut,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const { i18n } = useTranslation();
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    searchQuery,
    setSearchQuery,
    setSelectedPropertyId,
    setIsAddModalOpen,
    openSiteVisitModal,
    activeRole,
    setActiveRole,
    logoutToGateway,
    theme,
    toggleTheme,
    currentUser,
    showToast,
  } = useApp();

  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced live search preview
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      api
        .getProperties({ q: searchQuery, limit: 6 })
        .then((res) => {
          setSearchResults(res.properties);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hotkey listener for '/' key to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        const inputEl = document.getElementById('global-search-input');
        if (inputEl) {
          inputEl.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logoutToGateway();
  };

  const isStaff = activeRole !== 'VIEWER';

  return (
    <>
      <header
        className={`fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0A0C10]/95 px-4 sm:px-6 backdrop-blur-md transition-all duration-300 shadow-sm left-0 ${
          sidebarCollapsed ? 'md:left-20' : 'md:left-64'
        }`}
      >
        <div className="flex items-center gap-3 w-full max-w-2xl">
          {/* Mobile Sidebar Toggle (hamburger) */}
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Open menu"
            aria-label="Toggle navigation"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Global Omnisearch */}
        <div ref={searchContainerRef} className="relative w-full max-w-xl">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-zinc-400 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search plots, projects, cities..."
              className="h-9 sm:h-10 w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F]/90 pl-9 sm:pl-10 pr-8 sm:pr-12 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 shadow-inner outline-none transition-all duration-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 font-sans"
            />
            <div className="hidden sm:flex absolute right-3 items-center gap-1 rounded bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
              <Command className="h-3 w-3" />
              <span>/</span>
            </div>
          </div>

          {/* Omnisearch Instant Preview Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute top-12 left-0 right-0 z-50 overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-[#12161F] shadow-2xl backdrop-blur-xl animate-in fade-in">
              <div className="p-2 border-b border-slate-200 dark:border-zinc-800/80 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex justify-between">
                <span>Matching Properties</span>
                {isSearching && <span className="text-amber-500 animate-pulse">Searching...</span>}
              </div>

              {searchResults.length > 0 ? (
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/40">
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPropertyId(p.id);
                        setIsSearchOpen(false);
                      }}
                      className="group flex items-center justify-between p-3 hover:bg-zinc-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-amber-400 group-hover:bg-amber-500/10">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm group-hover:text-amber-400">
                              {p.property_code}
                            </span>
                            <StatusBadge status={p.status} size="sm" />
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {p.project_name} • {p.city}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs text-zinc-300 font-semibold">{formatSqFt(p.area_sqft)}</div>
                        <div className="text-sm font-bold text-emerald-400">
                          {formatCurrencyINR(p.total_price, true)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  No properties matching "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}
        </div>
        </div>

        {/* Top Bar Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Book Site Visit CTA for Customers */}
          <button
            onClick={() => openSiteVisitModal()}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all shadow-sm"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Book Site Visit</span>
          </button>

          {/* Quick Add Property Button (Staff Only) */}
          {isStaff && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all duration-200"
              title="Add Property"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Property</span>
              <span className="hidden sm:inline-block ml-1 rounded bg-black/20 px-1 text-[10px] font-mono">N</span>
            </button>
          )}

          {/* Header Action Controls */}
          {!isStaff ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#12161F] px-2.5 sm:px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer"
                title="Exit to Main Portal Gateway"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Bespoke RKS Admin Crest Badge */}
              <div className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-100 dark:bg-gradient-to-r dark:from-brand-teal/20 dark:via-slate-900 dark:to-[#12161F] border border-slate-200 dark:border-brand-teal/40 shadow-inner">
                <div className="relative flex items-center justify-center shrink-0">
                  <img
                    src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'RKS')}`}
                    alt={currentUser?.name}
                    className="h-6 w-6 rounded-full border border-amber-500/40 object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-zinc-900" />
                </div>
                <div className="flex flex-col truncate max-w-[130px]">
                  <span className="text-[10px] font-bold text-slate-900 dark:text-white leading-none truncate">
                    {currentUser?.name || 'RKS Admin'}
                  </span>
                  <span className="text-[8px] font-mono tracking-wider uppercase text-amber-600 dark:text-brand-gold-light font-semibold leading-tight mt-0.5">
                    {activeRole}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#12161F] px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                title="Log Out to Login Gateway"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#12161F] p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* Staff Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};
