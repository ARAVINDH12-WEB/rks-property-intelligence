import React from 'react';
import { Offer } from '../../types/index.js';
import { formatDate } from '../../utils/formatters.js';
import {
  Tag,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Percent,
} from 'lucide-react';

export interface OfferCardProps {
  offer: Offer;
  isAdmin?: boolean;
  onEdit?: (offer: Offer) => void;
  onDelete?: (offer: Offer) => void;
  onClaim?: (offer: Offer) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  isAdmin = false,
  onEdit,
  onDelete,
  onClaim,
}) => {
  const isExpired = new Date(offer.end_date) < new Date();
  const isActive = offer.is_active && !isExpired;

  return (
    <article
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] p-6 shadow-sm transition-all hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40"
      aria-labelledby={`offer-title-${offer.id}`}
    >
      {/* Top Banner & Discount Pill */}
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {offer.applicable_properties || 'All Layouts'}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                  {offer.discount_value || 'PROMO'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge with WCAG AA compliant colors */}
          <div>
            {isExpired ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                <Clock className="h-3 w-3" /> Expired
              </span>
            ) : isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                Paused
              </span>
            )}
          </div>
        </div>

        {/* Title & Discount Highlight */}
        <div className="mt-4">
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-3 py-1 text-xs font-black text-amber-800 dark:text-amber-300 font-mono">
            <Percent className="h-3.5 w-3.5" />
            <span>{offer.discount_value} OFF</span>
          </div>

          <h3
            id={`offer-title-${offer.id}`}
            className="mt-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white"
          >
            {offer.title}
          </h3>

          <div
            className="mt-2 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-3"
            dangerouslySetInnerHTML={{ __html: offer.description }}
          />
        </div>
      </div>

      {/* Footer Meta & Actions */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Valid till {formatDate(offer.end_date)}</span>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onEdit?.(offer)}
              className="flex-1 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Offer</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(offer)}
              aria-label={`Delete offer ${offer.title}`}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onClaim?.(offer)}
            className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <span>Claim Offer with Site Visit</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </article>
  );
};
