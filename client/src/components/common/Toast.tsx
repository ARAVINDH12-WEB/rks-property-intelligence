import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

// Auto-dismiss hook
const useAutoDismiss = (id: string, duration: number = 4000) => {
  const { removeToast } = useApp();
  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, removeToast]);
};

const ToastItem: React.FC<{ toast: { id: string; title: string; description?: string; type: 'success' | 'error' | 'info' | 'warning' } }> = ({ toast }) => {
  const { removeToast } = useApp();
  useAutoDismiss(toast.id, 4000);

  const config = {
    success: {
      Icon: CheckCircle2,
      bg: 'bg-[#0D1F15] border-emerald-500/30',
      icon: 'text-emerald-400',
      title: 'text-emerald-100',
      desc: 'text-emerald-300/70',
      progress: 'bg-emerald-500',
    },
    error: {
      Icon: AlertCircle,
      bg: 'bg-[#1F0D10] border-rose-500/30',
      icon: 'text-rose-400',
      title: 'text-rose-100',
      desc: 'text-rose-300/70',
      progress: 'bg-rose-500',
    },
    warning: {
      Icon: AlertTriangle,
      bg: 'bg-[#1F1808] border-amber-500/30',
      icon: 'text-amber-400',
      title: 'text-amber-100',
      desc: 'text-amber-300/70',
      progress: 'bg-amber-500',
    },
    info: {
      Icon: Info,
      bg: 'bg-[#0C1520] border-cyan-500/30',
      icon: 'text-cyan-400',
      title: 'text-cyan-100',
      desc: 'text-cyan-300/70',
      progress: 'bg-cyan-500',
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md ${config.bg}`}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${config.progress} opacity-60`}
        style={{ animation: 'progressBar 4s linear forwards' }}
      />
      <config.Icon className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${config.icon}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold leading-tight ${config.title}`}>{toast.title}</div>
        {toast.description && (
          <div className={`mt-0.5 text-xs leading-relaxed ${config.desc}`}>{toast.description}</div>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-zinc-500 hover:text-white transition-colors cursor-pointer p-0.5 rounded"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  // Max 5 toasts, newest on top
  const visible = toasts.slice(-5);

  if (visible.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      {/* 
        Position: fixed bottom-5 right-5 
        z-[60] so it sits above modals (z-50) but below critical overlays
        max-w-sm keeps it from overlapping admin sidebar content
        The sidebar is 256px (w-64), so on desktop we shift left enough to not overlap sidebar
      */}
      <div
        className="fixed bottom-5 right-5 z-[60] flex flex-col-reverse gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {visible.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  );
};
