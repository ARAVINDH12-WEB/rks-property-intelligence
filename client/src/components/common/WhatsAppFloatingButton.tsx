import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { useDraggable } from '../../hooks/useDraggable.js';
import { getWhatsAppUrl } from '../../utils/whatsapp.js';
import { WhatsAppIcon } from '../common/Icons.js';

export const WhatsAppFloatingButton: React.FC = () => {
  const { activeRole } = useApp();
  const [whatsappNumber, setWhatsappNumber] = useState<string>('+919840011223');
  const [defaultMessage] = useState<string>(
    "Hi, I'm interested in learning more about your properties."
  );
  const [isEnabled, setIsEnabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAdminView = activeRole !== 'VIEWER' || pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  const getDefaultPos = useCallback(() => ({
    x: typeof window !== 'undefined' ? Math.max(8, window.innerWidth - 72) : 300,
    y: typeof window !== 'undefined' ? Math.max(8, window.innerHeight - 72) : 500,
  }), []);

  const { isDragging, bind, handleClick } = useDraggable({
    storageKey: 'rks_pos_whatsapp',
    getDefaultPosition: getDefaultPos,
    elementWidth: 56,
    elementHeight: 56,
  });

  useEffect(() => {
    api
      .getSettings()
      .then((res) => {
        if (res.settings) {
          if (res.settings.whatsapp_number) setWhatsappNumber(res.settings.whatsapp_number);
          if (res.settings.toggle_whatsapp_button !== undefined) {
            setIsEnabled(res.settings.toggle_whatsapp_button !== 'false');
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load WhatsApp configuration:', err);
      });
  }, []);

  if (!isEnabled || isAdminView) return null;

  const whatsappUrl = getWhatsAppUrl(whatsappNumber, defaultMessage);

  return (
    <div
      {...bind}
      className="flex items-center gap-3 cursor-grab active:cursor-grabbing transition-shadow select-none"
    >
      {/* Tooltip Pill */}
      {isHovered && !isDragging && (
        <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white dark:bg-[#12161F] px-4 py-2 text-xs font-bold text-slate-800 dark:text-zinc-100 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-fadeIn pointer-events-none">
          <span>Chat with us on WhatsApp</span>
        </div>
      )}

      {/* WhatsApp Floating Native Anchor Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => handleClick(e)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-500/40 hover:bg-[#20bd5a] transition-transform duration-200 active:scale-95 cursor-pointer"
        aria-label="Chat with us on WhatsApp"
        title="Drag to reposition | Click to chat on WhatsApp"
      >
        {/* Soft pulse ping */}
        {!isDragging && (
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping opacity-60 pointer-events-none" />
        )}

        {/* Official WhatsApp Icon */}
        <WhatsAppIcon size={28} className="relative z-10 transition-transform duration-300 group-hover:rotate-6 pointer-events-none" />
      </a>
    </div>
  );
};
