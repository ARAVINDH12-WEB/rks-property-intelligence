import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  gradient?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = 'from-violet-500 to-indigo-600',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700/60' : ''}`}
    >
      <div className={`absolute -top-6 -right-6 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 truncate">{title}</p>
          <p className={`mt-2 text-3xl font-black leading-none bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
            {value}
          </p>
          {subtitle && <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 truncate">{subtitle}</p>}

          {trend && (
            <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              trend.value > 0
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : trend.value < 0
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}>
              {trend.value > 0 ? <TrendingUp className="h-3 w-3" /> : trend.value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
            </div>
          )}
        </div>

        {icon && (
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg bg-gradient-to-br ${gradient} shadow-violet-500/20`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
