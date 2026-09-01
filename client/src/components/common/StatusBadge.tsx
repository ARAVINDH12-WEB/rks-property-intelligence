import React from 'react';
import { PropertyStatus } from '../../types/index.js';
import { getStatusConfig } from '../../utils/formatters.js';

interface StatusBadgeProps {
  status: PropertyStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] font-medium tracking-wider',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wide',
    lg: 'px-3 py-1.5 text-sm font-bold tracking-wider',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses[size]} uppercase transition-all duration-150 ${className}`}
    >
      {showDot && (
        <span className={`rounded-full ${config.dotColor} ${dotSizes[size]} shrink-0 shadow-sm animate-pulse`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};
