import React, { Component, ReactNode, useEffect, useState } from 'react';
import {
  MapPin,
  Compass,
  Search,
  AlertTriangle,
  WifiOff,
  Clock,
  Lock,
  CheckCircle2,
  RefreshCw,
  Car,
  FileX,
  FileCheck,
  LogOut,
  AlertCircle,
  X,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PlotOutlineIcon } from './Icons.js';

// ---------------------------------------------------------------------------
// 1. EMPTY STATE — Blueprint Grid & Survey Plot Stake
// ---------------------------------------------------------------------------
interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export const RealEstateEmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Plots Found in this Sector',
  description = 'There are currently no property listings or records registered under this view.',
  actionLabel,
  onAction,
  icon: CustomIcon,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0D1017] p-12 text-center shadow-sm my-4">
      {/* Blueprint Grid Watermark Background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 40L40 0' stroke='%23D4AF37' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
        {/* Survey Boundary Circle with Compass */}
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
            {CustomIcon ? (
              <CustomIcon className="h-10 w-10 text-amber-500" />
            ) : (
              <PlotOutlineIcon className="h-10 w-10 text-amber-500" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-white shadow-md">
            <Compass className="h-4 w-4 animate-spin-slow" />
          </div>
        </div>

        {/* Blueprint Title & Description */}
        <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
          {description}
        </p>

        {/* Action Button */}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-teal to-brand-teal-light px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            <PlotOutlineIcon className="h-4 w-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. NO SEARCH RESULTS STATE — Layout Map & Magnifying Glass
// ---------------------------------------------------------------------------
interface NoSearchResultsProps {
  query?: string;
  onReset?: () => void;
}

export const RealEstateNoSearchResults: React.FC<NoSearchResultsProps> = ({ query, onReset }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0E121B] p-10 text-center my-4">
      <div className="flex flex-col items-center max-w-md mx-auto">
        <div className="relative mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
            <Search className="h-8 w-8" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white font-black text-xs">
            0
          </div>
        </div>

        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          No Plots Matching {query ? `"${query}"` : 'Filter Criteria'}
        </h4>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
          We couldn't find any properties or records matching your active search keywords, location filters, or price boundaries.
        </p>

        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-brand-teal" />
            Clear All Search & Location Filters
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. LOADING SKELETON STATE — Animated Land Survey Radar Scanner
// ---------------------------------------------------------------------------
export const RealEstateLoadingSkeleton: React.FC<{ rows?: number; type?: 'table' | 'cards' }> = ({
  rows = 5,
  type = 'table',
}) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0D1017] p-4 shadow-sm animate-pulse"
          >
            <div className="h-44 w-full rounded-xl bg-slate-200 dark:bg-zinc-800/80 mb-4" />
            <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-zinc-800 mb-2" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-zinc-800 mb-4" />
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="h-6 w-1/3 rounded bg-amber-500/20" />
              <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0D1017] p-4 my-4 shadow-sm">
      {/* Radar Scanner Line Header */}
      <div className="relative h-1 w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden mb-4 rounded-full">
        <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-brand-teal to-transparent animate-shimmer" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 animate-pulse"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-zinc-800 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-6 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-6 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. ERROR STATE CARD — Broken Survey Benchmark Pin
// ---------------------------------------------------------------------------
interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const RealEstateErrorCard: React.FC<ErrorCardProps> = ({
  title = 'Survey Database Interrupted',
  message = 'Failed to load property intelligence data from the central database.',
  onRetry,
}) => {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center my-4">
      <div className="flex flex-col items-center max-w-md mx-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4">
          <MapPin className="h-7 w-7" />
        </div>
        <h4 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-1">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mb-5 leading-relaxed">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Rescan Property Database
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. NO INTERNET (OFFLINE STATE) BANNER — Land Survey Total Station
// ---------------------------------------------------------------------------
export const RealEstateOfflineBanner: React.FC<{ isOffline: boolean }> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-amber-600 text-white px-4 py-2.5 shadow-lg backdrop-blur-md animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold max-w-7xl mx-auto w-full">
        <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
        <span>
          <strong>Field Survey Mode (Offline):</strong> You are currently disconnected from the internet. Local cached changes will sync once reconnected.
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. SLOW NETWORK BANNER — Site Visit Cab Indicator
// ---------------------------------------------------------------------------
export const RealEstateSlowNetworkBanner: React.FC<{ isSlow: boolean; onDismiss?: () => void }> = ({
  isSlow,
  onDismiss,
}) => {
  if (!isSlow) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-40 flex items-center gap-3 bg-slate-900/95 text-amber-300 border border-amber-500/40 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs sm:text-sm animate-in slide-in-from-bottom duration-300">
      <Car className="h-5 w-5 text-amber-400 animate-bounce shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-bold text-amber-200">Navigating Slow Network Corridor...</span>
        <p className="text-[11px] text-slate-300 truncate">Connecting to server. Fetching property records...</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-slate-400 hover:text-white p-1">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 7. PERMISSION DENIED MODAL — Locked Land Registry Gate
// ---------------------------------------------------------------------------
interface PermissionDeniedProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole?: string;
}

export const RealEstatePermissionDeniedModal: React.FC<PermissionDeniedProps> = ({
  isOpen,
  onClose,
  requiredRole = 'ADMIN or MANAGER',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-white dark:bg-[#0D1017] p-6 shadow-2xl text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mx-auto mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold mb-3">
          CLEARANCE RESTRICTED
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Restricted Registry Zone
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
          Your current role does not have administrative permission to modify or execute actions in this section. Role clearance <strong>[{requiredRole}]</strong> is required.
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-slate-900 dark:bg-zinc-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 8. SESSION EXPIRED MODAL — RKS Security Passcard Expiration
// ---------------------------------------------------------------------------
interface SessionExpiredProps {
  isOpen: boolean;
  onReLogin: () => void;
}

export const RealEstateSessionExpiredModal: React.FC<SessionExpiredProps> = ({ isOpen, onReLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-white dark:bg-[#0D1017] p-6 shadow-2xl text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mx-auto mb-4">
          <LogOut className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Security Clearance Expired
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
          Your active session passcard has timed out. Please authenticate again to access live inventory management tools.
        </p>
        <button
          onClick={onReLogin}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-black shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Sign In Again to RKS Command Center
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 9. FORM VALIDATION ERROR HELPER — Red Plot Survey Boundary Marker
// ---------------------------------------------------------------------------
export const RealEstateFormError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium mt-1 animate-in fade-in">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 10. SUCCESS BADGE — Patta Approved Deed Stamp
// ---------------------------------------------------------------------------
export const RealEstateSuccessBadge: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in zoom-in duration-200">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-bounce" />
      <span>{message}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// GLOBAL REACT ERROR BOUNDARY — Blueprint Crash Report Screen
// ---------------------------------------------------------------------------
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RealEstateErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled React Exception in RKS Command Center:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
          <div className="max-w-lg w-full text-center space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/20 border border-rose-500/30 mx-auto text-rose-400 shadow-2xl">
              <FileX className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-heading text-rose-400">
                System Interface Interrupted
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-6 py-3 text-sm font-bold text-white hover:bg-brand-teal-light transition-colors shadow-lg cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Reload RKS Property Command Center
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
