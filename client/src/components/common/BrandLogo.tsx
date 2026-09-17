import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'auto',
  size = 'md',
  showText = true,
  showTagline = false,
  className = '',
  onClick,
}) => {
  const iconDimensions = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  }[size];

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`${iconDimensions} rounded-xl bg-white p-1 shadow-md border border-slate-200/50 flex items-center justify-center shrink-0 overflow-hidden`}>
        <img
          src="/logo-icon.png"
          alt="RKS Property Hub"
          className="h-full w-full object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center">
            <span className={`font-heading font-bold ${titleSizes} tracking-tight ${
              variant === 'light' 
                ? 'text-white drop-shadow-sm' 
                : variant === 'dark' 
                ? 'text-brand-navy dark:text-white' 
                : 'text-brand-navy dark:text-white'
            }`}>
              RKS
            </span>
            <span className={`font-heading font-bold ${titleSizes} tracking-tight ml-1.5 ${
              variant === 'light'
                ? 'text-teal-400 drop-shadow-sm'
                : 'text-brand-teal dark:text-teal-400'
            }`}>
              Property Hub
            </span>
          </div>
          {showTagline && (
            <span className={`text-[10px] font-medium tracking-wide -mt-0.5 ${
              variant === 'light' ? 'text-slate-300' : 'text-slate-400 dark:text-zinc-400'
            }`}>
              Your trusted partner in property solutions
            </span>
          )}
        </div>
      )}
    </div>
  );
};
