import React, { useId } from 'react';

export interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
  description,
  disabled = false,
  id,
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;
  const descId = `${switchId}-desc`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="space-y-0.5">
        <label
          htmlFor={switchId}
          className={`text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer ${disabled ? 'opacity-50' : ''}`}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
        {description && (
          <p id={descId} className="text-xs text-slate-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex min-h-[28px] min-w-[50px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
          checked ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
