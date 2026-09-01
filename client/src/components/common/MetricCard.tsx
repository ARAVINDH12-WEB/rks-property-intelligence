import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'from-amber-500/20 to-transparent',
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-zinc-800/80 bg-[#12161F]/90 p-5 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-zinc-700 hover:shadow-xl ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className={`absolute top-0 right-0 h-28 w-28 rounded-full bg-gradient-to-bl ${accentColor} blur-2xl pointer-events-none opacity-40`} />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800/60 text-amber-400 shadow-inner">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-zinc-400 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};
