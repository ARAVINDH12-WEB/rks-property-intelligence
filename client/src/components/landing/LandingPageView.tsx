import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Property, Offer } from '../../types/index.js';
import { formatCurrencyINR, formatSqFt } from '../../utils/formatters.js';
import { StatCounter } from '../common/StatCounter.js';
import { OfferCard } from '../common/OfferCard.js';
import {
  Sparkles,
  ShieldCheck,
  Car,
  FileCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Phone,
  MessageCircle,
  Building,
  Navigation,
  Lock,
  ChevronRight,
  ExternalLink,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';

interface LandingPageViewProps {
  onExploreProperties: () => void;
  onOpenStaffLogin: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onExploreProperties,
  onOpenStaffLogin,
}) => {
  const { theme, toggleTheme, openSiteVisitModal, showToast } = useApp();

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'RKS Prime Properties',
    contact_phone: '+91 98400 11223',
    whatsapp_number: '+91 98400 11223',
    stat_total_plots: '58+',
    stat_base_rate: '₹850',
    stat_total_acreage: '120+ Acres',
    toggle_whatsapp_button: 'true',
    toggle_offers_banner: 'true',
  });

  // Featured Properties & Offers
  const [featuredPlots, setFeaturedPlots] = useState<Property[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSettings().catch(() => ({ settings: {} })),
      api.getProperties({ limit: 6, status: 'AVAILABLE' }).catch(() => ({ properties: [] })),
      api.getOffers().catch(() => ({ offers: [] })),
    ]).then(([settingsRes, propsRes, offersRes]) => {
      if (settingsRes.settings) {
        setSettings((prev) => ({ ...prev, ...settingsRes.settings }));
      }
      if (propsRes.properties) {
        setFeaturedPlots(propsRes.properties);
      }
      if (offersRes.offers) {
        setActiveOffers(offersRes.offers.filter((o: Offer) => o.is_active));
      }
      setIsLoading(false);
    });
  }, []);

  const cleanWhatsappNumber = (settings.whatsapp_number || '+919840011223').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
    'Hi RKS Prime Properties, I am interested in exploring available surveyed plots.'
  )}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070A0F] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0B101B]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-800 text-white font-black text-base shadow-md shadow-emerald-800/20">
              RKS
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 font-sans">
                {settings.company_name || 'RKS Prime Properties'}
                <span className="rounded-md border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                  DTCP Verified
                </span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block">
                Direct Developer Surveyed Plots & Township Intelligence
              </p>
            </div>
          </div>

          {/* Nav Links & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-600 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>

            {/* Subtle Staff Sign In */}
            <button
              type="button"
              onClick={onOpenStaffLogin}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-all cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden md:inline">Staff Sign In</span>
            </button>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={onExploreProperties}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-700/20 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>Explore Plots</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Landing Body ── */}
      <main className="flex-1 space-y-16 sm:space-y-24 py-10 sm:py-16">
        {/* 1. Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
            <Award className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            <span>Zero Brokerage • 100% Clear Title Deeds • Direct Developer</span>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] font-sans">
              Discover Verified Surveyed Plots with{' '}
              <span className="text-emerald-700 dark:text-emerald-400 underline decoration-emerald-500/30 underline-offset-8">
                Transparent Pricing.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Explore approved residential and commercial plots across prime growth corridors in Chennai, Bangalore Corridor, Coimbatore, and Hosur.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={onExploreProperties}
              className="w-full sm:w-auto flex min-h-[48px] items-center justify-center gap-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white px-8 py-3.5 text-sm font-bold shadow-xl shadow-emerald-700/25 transition-all cursor-pointer"
            >
              <span>Explore {settings.stat_total_plots || '58+'} Available Plots</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => openSiteVisitModal()}
              className="w-full sm:w-auto flex min-h-[48px] items-center justify-center gap-2.5 rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-7 py-3.5 text-sm font-bold text-slate-800 dark:text-zinc-100 hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm"
            >
              <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Book Free Cab Site Tour</span>
            </button>
          </div>

          {/* 2. Trust Indicators / Dynamic Stats Section */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-5xl mx-auto pt-6">
            <StatCounter
              value={settings.stat_total_plots || '58+'}
              label="Surveyed Plots"
              subtitle="Ready for immediate allocation"
              variant="emerald"
            />
            <StatCounter
              value={`${settings.stat_base_rate || '₹850'}/sq.ft`}
              label="Starting Base Rate"
              subtitle="Guaranteed lowest developer rates"
              variant="gold"
            />
            <StatCounter
              value={settings.stat_total_acreage || '120+ Acres'}
              label="Township Layouts"
              subtitle="Gated communities in TN corridors"
              variant="navy"
            />
            <StatCounter
              value="100%"
              label="Clear Legal Titles"
              subtitle="DTCP & RERA certified approvals"
              variant="slate"
            />
          </div>
        </section>

        {/* 3. Value Pillars & Developer Guarantees */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Why Choose RKS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
              Built on Transparency & Legal Trust
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Every plot in our catalog comes with complete digital documentation, verified survey coordinates, and end-to-end buyer assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Car,
                title: 'Free Doorstep Cab Pickup',
                desc: 'Complimentary private cab pickup and drop from your residence for on-site layout inspection.',
              },
              {
                icon: FileCheck,
                title: '100% Verified Patta & Deeds',
                desc: 'Parent deed verification, encumbrance certificates (EC), and patta transfer facilitated by our legal panel.',
              },
              {
                icon: MapPin,
                title: 'High Growth Corridors',
                desc: 'Strategically located near upcoming metro corridors, industrial hubs, expressways, and IT parks.',
              },
              {
                icon: ShieldCheck,
                title: 'Instant Bank Loan Desk',
                desc: 'Pre-approved project financing with instant title clearance from major nationalized and private banks.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] p-6 shadow-sm transition-all hover:shadow-xl hover:border-emerald-500/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 mb-5">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Active Offers Section (if any) */}
        {activeOffers.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Promotions & Deals
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  Exclusive Festive & Launch Offers
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  isAdmin={false}
                  onClaim={() => openSiteVisitModal()}
                />
              ))}
            </div>
          </section>
        )}

        {/* 5. Featured Plots Showcase */}
        {featuredPlots.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Live Inventory Highlights
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  Featured Plots Ready for Registration
                </h2>
              </div>

              <button
                type="button"
                onClick={onExploreProperties}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <span>View all {settings.stat_total_plots || '58+'} plots</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlots.map((plot) => (
                <div
                  key={plot.id}
                  className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] p-5 shadow-sm transition-all hover:shadow-xl hover:border-emerald-500/40 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {plot.property_code}
                      </span>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        {plot.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {plot.project_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{plot.city || plot.location_name || 'Tamil Nadu'}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 p-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-sans">Area</span>
                        <div className="font-bold text-slate-900 dark:text-white">{formatSqFt(plot.area_sqft)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-sans">Rate</span>
                        <div className="font-bold text-amber-600 dark:text-amber-400">₹{plot.rate_per_sqft}/sq.ft</div>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-baseline">
                        <span className="text-[10px] text-slate-500 uppercase font-sans">Total</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrencyINR(plot.total_price, true)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onExploreProperties}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-950 px-3 py-2 text-xs font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      <span>View Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSiteVisitModal(plot)}
                      className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                    >
                      <Car className="h-3.5 w-3.5" />
                      <span>Free Tour</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. WhatsApp & Free Site Tour Conversion Card */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1 text-xs font-bold text-emerald-300">
                <MessageCircle className="h-3.5 w-3.5" /> Direct WhatsApp Assistance
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight font-sans">
                Have questions about pricing, survey numbers or site tours?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect directly with our dedicated property advisors on WhatsApp or schedule a free site tour with door-to-door cab pickup.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3 text-sm font-extrabold shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={() => openSiteVisitModal()}
                  className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all cursor-pointer"
                >
                  <Car className="h-4 w-4 text-emerald-400" />
                  <span>Schedule Site Visit (Cab Included)</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#0B101B] py-8 text-center text-xs text-slate-500 dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {settings.company_name || 'RKS Prime Properties'}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
            <span>DTCP & RERA Approved</span>
            <span>•</span>
            <span>Clear Title Guarantee</span>
            <span>•</span>
            <button
              type="button"
              onClick={onOpenStaffLogin}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 underline cursor-pointer"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
