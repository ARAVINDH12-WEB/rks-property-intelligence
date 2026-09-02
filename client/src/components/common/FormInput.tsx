import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  optional?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, icon, rightElement, optional, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
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
        </div>

        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`w-full min-h-[44px] rounded-xl border ${
              error
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-[#0F141E] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-emerald-500/20'
            } ${icon ? 'pl-10' : 'pl-3.5'} ${rightElement ? 'pr-11' : 'pr-3.5'} py-2 text-sm outline-none transition-all focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
              {rightElement}
            </div>
          )}
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

FormInput.displayName = 'FormInput';
