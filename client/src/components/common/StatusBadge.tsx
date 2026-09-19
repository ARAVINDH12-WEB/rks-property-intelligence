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
      badgeStyles = 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300';
      Icon = CheckCircle2;
      break;
    case 'RESERVED':
      badgeStyles = 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300';
      Icon = Clock;
      break;
    case 'SOLD':
      badgeStyles = 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300';
      Icon = CheckCheck;
      break;
    case 'BLOCKED':
    case 'HOLD':
      badgeStyles = 'border-l-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300';
      Icon = Lock;
      break;
    case 'UPCOMING':
    case 'DRAFT':
      badgeStyles = 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300';
      Icon = Eye;
      break;
    default:
      badgeStyles = 'border-l-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300';
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
