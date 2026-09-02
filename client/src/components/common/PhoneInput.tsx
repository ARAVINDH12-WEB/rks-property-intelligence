import React, { forwardRef, useId } from 'react';
import { Phone, AlertCircle } from 'lucide-react';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  helperText?: string;
  optional?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, value, onChange, error, helperText, optional, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(/[^0-9 ]/g, '');
      onChange(cleaned);
    };

    return (
      <div className="w-full space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-xs font-bold tracking-tight text-slate-800 dark:text-slate-200"
        >
          {label}
          {optional && (
            <span className="ml-1 text-[11px] font-normal text-slate-500 dark:text-slate-400">
              (Optional)
            </span>
          )}
        </label>

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-xs font-bold pointer-events-none border-r border-slate-200 dark:border-zinc-700 pr-2">
            <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+91</span>
          </div>

          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={value}
            onChange={handleInputChange}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            placeholder="98400 12345"
            className={`w-full min-h-[44px] rounded-xl border ${
              error
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-[#0F141E] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-emerald-500/20'
            } pl-16 pr-3.5 py-2 text-sm font-mono outline-none transition-all focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>

        {error && (
          <div
            id={errorId}
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-fadeIn"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-slate-500 dark:text-zinc-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
