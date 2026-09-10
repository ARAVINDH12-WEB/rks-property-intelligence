import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { Home, Search, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0A0C10] px-4">
      <div className="text-center max-w-md">
        {/* Large 404 */}
        <div className="relative mb-6">
          <span
            className="text-[8rem] font-black text-slate-100 dark:text-zinc-900 select-none leading-none block"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
              <Search className="h-7 w-7 text-black" />
            </div>
          </div>
        </div>

        {/* RKS Logo */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-lg font-black text-brand-navy dark:text-white tracking-wide">RKS</span>
            <span className="text-lg font-light text-brand-teal">Prime Properties</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Plot Not Found
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
            The page you're looking for doesn't exist or may have been moved.
            Let's get you back to our available surveyed plots.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('properties')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-teal to-brand-teal-light px-6 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity cursor-pointer w-full sm:w-auto"
          >
            <Search className="h-4 w-4" />
            Browse Available Plots
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800">
          <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3">Quick links</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {['Available Plots', 'Site Visits', 'Projects', 'Overview'].map((link) => (
              <button
                key={link}
                onClick={() => setActiveTab(link.toLowerCase().replace(' ', '-') as any)}
                className="text-brand-teal hover:text-brand-teal-light transition-colors underline-offset-2 hover:underline cursor-pointer"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
