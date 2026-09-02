import React from 'react';

export interface StatCounterProps {
  value: string | number;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'emerald' | 'gold' | 'navy' | 'slate';
  className?: string;
}

export const StatCounter: React.FC<StatCounterProps> = ({
  value,
  label,
  subtitle,
  icon,
  variant = 'emerald',
  className = '',
}) => {
  const variantStyles = {
    emerald: 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
    gold: 'border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
    navy: 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200',
    slate: 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] text-slate-900 dark:text-white',
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all hover:scale-[1.02] ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
          {label}
        </span>
        {icon && <div className="text-current opacity-80">{icon}</div>}
      </div>

      <div className="mt-2 font-mono text-2xl sm:text-3xl font-black tracking-tight">
        {value}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
};
