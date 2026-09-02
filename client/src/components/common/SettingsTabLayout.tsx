import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface SettingsTabLayoutProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const SettingsTabLayout: React.FC<SettingsTabLayoutProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-slate-200 dark:border-zinc-800 ${className}`}>
      <nav
        role="tablist"
        aria-label="Site Settings Sections"
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px custom-scrollbar"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex min-h-[44px] items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-emerald-600 dark:border-emerald-400 bg-white dark:bg-[#0F141E] text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-zinc-800/40'
              }`}
            >
              {tab.icon && (
                <span className="shrink-0">
                  {typeof tab.icon === 'function' ? (
                    React.createElement(tab.icon as React.ComponentType<{ className?: string }>, {
                      className: 'h-4 w-4',
                    })
                  ) : (
                    tab.icon
                  )}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
