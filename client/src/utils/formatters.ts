import { PropertyStatus } from '../types/index.js';

export function formatCurrencyINR(amount: number | string | undefined | null, compact: boolean = false): string {
  const num = Number(amount) || 0;
  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    } else if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)} K`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatSqFt(sqft: number | string | undefined | null): string {
  const num = Number(sqft) || 0;
  return `${num.toLocaleString('en-IN')} sq.ft`;
}

export function formatRate(rate: number | string | undefined | null): string {
  const num = Number(rate) || 0;
  return `₹${num.toLocaleString('en-IN')} / sq.ft`;
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export interface StatusConfig {
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export function getStatusConfig(status: PropertyStatus | string): StatusConfig {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'AVAILABLE':
      return {
        label: 'AVAILABLE',
        dotColor: 'bg-emerald-400',
        badgeBg: 'bg-emerald-950/40',
        badgeText: 'text-emerald-300',
        badgeBorder: 'border-emerald-500/30',
      };
    case 'RESERVED':
      return {
        label: 'RESERVED',
        dotColor: 'bg-amber-400',
        badgeBg: 'bg-amber-950/40',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500/30',
      };
    case 'SOLD':
      return {
        label: 'SOLD',
        dotColor: 'bg-rose-500',
        badgeBg: 'bg-rose-950/40',
        badgeText: 'text-rose-300',
        badgeBorder: 'border-rose-500/30',
      };
    case 'BLOCKED':
      return {
        label: 'BLOCKED',
        dotColor: 'bg-slate-400',
        badgeBg: 'bg-slate-900/60',
        badgeText: 'text-slate-300',
        badgeBorder: 'border-slate-600/40',
      };
    case 'HOLD':
      return {
        label: 'HOLD',
        dotColor: 'bg-yellow-400',
        badgeBg: 'bg-yellow-950/40',
        badgeText: 'text-yellow-300',
        badgeBorder: 'border-yellow-500/30',
      };
    case 'UPCOMING':
      return {
        label: 'UPCOMING',
        dotColor: 'bg-cyan-400',
        badgeBg: 'bg-cyan-950/40',
        badgeText: 'text-cyan-300',
        badgeBorder: 'border-cyan-500/30',
      };
    case 'DRAFT':
    default:
      return {
        label: s || 'DRAFT',
        dotColor: 'bg-zinc-400',
        badgeBg: 'bg-zinc-900/60',
        badgeText: 'text-zinc-400',
        badgeBorder: 'border-zinc-700/40',
      };
  }
}
