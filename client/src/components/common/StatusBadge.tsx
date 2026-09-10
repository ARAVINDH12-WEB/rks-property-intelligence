import React from 'react';
import { PropertyStatus } from '../../types/index.js';
import { getStatusConfig } from '../../utils/formatters.js';
import { CheckCircle2, Clock, CheckCheck, Lock, Eye, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: PropertyStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = false,
  className = '',
}) => {
  const upperStatus = typeof status === 'string' ? status.toUpperCase() : '';
  
  let badgeStyles = '';
  let Icon = CheckCircle2;
  
  switch (upperStatus) {
    case 'AVAILABLE':
      badgeStyles = 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400';
      Icon = CheckCircle2;
      break;
    case 'RESERVED':
      badgeStyles = 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400';
      Icon = Clock;
      break;
    case 'SOLD':
      badgeStyles = 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400';
      Icon = CheckCheck;
      break;
    case 'BLOCKED':
    case 'HOLD':
      badgeStyles = 'border-l-slate-400 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400';
      Icon = Lock;
      break;
    case 'UPCOMING':
    case 'DRAFT':
      badgeStyles = 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400';
      Icon = Eye;
      break;
    default:
      badgeStyles = 'border-l-slate-400 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400';
      Icon = XCircle;
  }

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border-l-4 text-xs font-semibold tracking-wide ${badgeStyles} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
};
