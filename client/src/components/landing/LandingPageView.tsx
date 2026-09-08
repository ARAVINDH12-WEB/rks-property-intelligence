import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext.js';
import { 
  MapPin, 
  Car, 
  ArrowRight, 
  ShieldCheck, 
  FileCheck, 
  Award,
  Search,
  Building2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface LandingPageViewProps {
  onExploreProperties: () => void;
  onOpenStaffLogin: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onExploreProperties,
  onOpenStaffLogin,
}) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, openSiteVisitModal } = useApp();

  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState('');

  const featuredPlots = [
    {
      id: 1,
      title: 'Emerald Valley Phase 2',
      location: 'Chennai South Corridor',
      price: '?24.5 Lakhs',
      size: '1200 Sq.Ft',
      status: 'Fast Selling',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 2,
      title: 'Golden Acres Reserve',
      location: 'Bangalore Highway',
      price: '?32.0 Lakhs',
      size: '1500 Sq.Ft',
      status: 'Premium',
      image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 3,
      title: 'Riverside Enclave',
      location: 'Trichy Main Road',
      price: '?18.5 Lakhs',
      size: '1000 Sq.Ft',
      status: 'New Launch',
      image: 'https://images.unsplash.com/photo-1629196914167-214e21b8bbf4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-rks-bg dark:bg-rks-bgDark text-brand-navy dark:text-slate-100 font-sans selection:bg-brand-gold selection:text-brand-navy flex flex-col">
      <Helmet>
        <title>RKS Prime Properties | Luxury Plots & Real Estate</title>
        <meta name="description" content="Discover verified, premium clear-title plots across top growth corridors. Direct developer pricing, uncompromising quality." />
        <link rel="canonical" href="https://www.rkspropertyintelligence.com/" />
        <meta property="og:title" content="RKS Prime Properties | Premium Real Estate" />
        <meta property="og:description" content="Secure your legacy with RKS Prime Properties. Verified, luxury plots." />
        <meta property="og:image" content="https://www.rkspropertyintelligence.com/og-image.jpg" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            "name": "RKS Prime Properties",
            "image": "https://www.rkspropertyintelligence.com/og-image.jpg",
            "description": "Premium, verified real estate plots.",
            "url": "https://www.rkspropertyintelligence.com/"
          })}
        </script>
      </Helmet>

      {/* -- Luxury Header -- */}
      <header className="absolute top-0 left-0 w-full z-50 bg-brand-navy/10 backdrop-blur-md border-b border-white/10 dark:bg-[#0A1128]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold text-brand-navy shadow-luxury">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-lg font-bold font-heading tracking-wider text-white">
                RKS PRIME
              </span>
              <span className="block text-[10px] tracking-widest text-brand-gold-light uppercase font-semibold">
                Properties
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/90">
            <button onClick={onExploreProperties} className="hover:text-brand-gold transition-colors">Properties</button>
            <a href="#projects" className="hover:text-brand-gold transition-colors">Projects</a>
            <a href="#about" className="hover:text-brand-gold transition-colors">Legacy</a>
            <button onClick={() => openSiteVisitModal()} className="hover:text-brand-gold transition-colors">Schedule Visit</button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'ta' ? 'en' : 'ta')}
              className="text-xs font-bold px-4 py-2 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors uppercase tracking-wider"
            >
              {i18n.language === 'ta' ? 'EN' : 'தமிழ்'}
            </button>
            <button
              onClick={onExploreProperties}
              className="hidden sm:flex items-center gap-2 bg-brand-gold text-brand-navy px-5 py-2.5 rounded-full text-sm font-bold shadow-luxury hover:bg-brand-gold-light transition-all"
            >
              <span>Explore</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* -- Hero Section (Cinematic Backdrop) -- */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-20">
        {/* Background Image & Overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80" 
            alt="Luxury Real Estate Estate" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-navy/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/40 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center md:text-left">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-gold/50 bg-brand-navy/40 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-brand-gold animate-pulse"></span>
              <span className="text-xs font-semibold text-brand-gold tracking-widest uppercase">Premium Inventory Live</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold font-heading text-white leading-tight">
              Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-light to-brand-gold">Legacy.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl font-light leading-relaxed">
              Discover unparalleled real estate opportunities. 100% clear-title, DTCP-approved premium plots across South India's fastest-growing corridors.
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={onExploreProperties}
                className="w-full sm:w-auto px-8 py-4 bg-brand-gold hover:bg-brand-gold-light text-brand-navy rounded-full font-bold shadow-luxury hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg"
              >
                <span>View Inventory</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button 
                onClick={() => openSiteVisitModal()}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold backdrop-blur-md shadow-luxury hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg"
              >
                <Car className="h-5 w-5" />
                <span>Book VIP Site Visit</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -- Floating Search Bar -- */}
      <section className="relative z-20 max-w-5xl mx-auto px-4 w-full -mt-16 mb-16">
        <div className="bg-white dark:bg-rks-cardDark rounded-2xl p-4 shadow-luxury border border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search locations..." 
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50 font-medium"
            />
          </div>
          <div className="w-full md:flex-1 relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50 font-medium appearance-none"
            >
              <option value="">Property Type</option>
              <option value="residential">Residential Plot</option>
              <option value="commercial">Commercial Plot</option>
              <option value="villa">Villa Plot</option>
            </select>
          </div>
          <button onClick={onExploreProperties} className="w-full md:w-auto px-8 py-3.5 bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>
        </div>
      </section>

      {/* -- Trust & Metrics -- */}
      <section className="py-16 bg-white dark:bg-rks-bgDark border-y border-slate-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100 dark:divide-zinc-800">
            <div className="text-center px-4">
              <div className="text-4xl font-bold font-heading text-brand-navy dark:text-white mb-2">500+</div>
              <div className="text-sm font-semibold text-brand-gold uppercase tracking-wider">Happy Families</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold font-heading text-brand-navy dark:text-white mb-2">100%</div>
              <div className="text-sm font-semibold text-brand-gold uppercase tracking-wider">Clear Titles</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold font-heading text-brand-navy dark:text-white mb-2">30+</div>
              <div className="text-sm font-semibold text-brand-gold uppercase tracking-wider">Prime Locations</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold font-heading text-brand-navy dark:text-white mb-2">24/7</div>
              <div className="text-sm font-semibold text-brand-gold uppercase tracking-wider">Security Setup</div>
            </div>
          </div>
        </div>
      </section>

      {/* -- Featured Inventory -- */}
      <section id="projects" className="py-24 bg-rks-bg dark:bg-[#0A1128]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-brand-gold font-semibold tracking-widest uppercase mb-3 text-sm">Curated Portfolio</h2>
              <h3 className="text-4xl md:text-5xl font-bold font-heading text-brand-navy dark:text-white">Featured Properties</h3>
            </div>
            <button onClick={onExploreProperties} className="flex items-center gap-2 text-brand-navy dark:text-brand-gold font-bold hover:underline">
              <span>View All Properties</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPlots.map((plot) => (
              <div key={plot.id} className="group rounded-3xl bg-white dark:bg-rks-cardDark border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-luxury hover:-translate-y-2 transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <img src={plot.image} alt={plot.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 bg-brand-navy/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {plot.status}
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 mb-3 font-medium">
                    <MapPin className="h-4 w-4 text-brand-gold" />
                    <span>{plot.location}</span>
                  </div>
                  <h4 className="text-2xl font-bold font-heading text-brand-navy dark:text-white mb-2">{plot.title}</h4>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Starting From</div>
                      <div className="text-xl font-bold text-brand-teal dark:text-brand-gold-light">{plot.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Plot Size</div>
                      <div className="font-bold text-slate-900 dark:text-white">{plot.size}</div>
                    </div>
                  </div>
                  <button onClick={() => openSiteVisitModal()} className="w-full py-3.5 rounded-xl border-2 border-brand-navy dark:border-brand-gold text-brand-navy dark:text-brand-gold font-bold hover:bg-brand-navy hover:text-white dark:hover:bg-brand-gold dark:hover:text-brand-navy transition-colors flex items-center justify-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>Schedule Site Visit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer className="bg-brand-navy pt-20 pb-10 text-slate-300 border-t-4 border-brand-gold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold text-brand-navy">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold font-heading text-white tracking-wider">
                  RKS PRIME
                </span>
              </div>
              <p className="max-w-md text-slate-400 font-light leading-relaxed">
                South India's most trusted real estate developer. Delivering premium, 100% clear title plots that build generational wealth.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                  <ShieldCheck className="h-5 w-5 text-brand-gold" />
                  <span className="text-sm font-medium text-white">DTCP Approved</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                  <FileCheck className="h-5 w-5 text-brand-gold" />
                  <span className="text-sm font-medium text-white">Clear Titles</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">Quick Links</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><button onClick={onExploreProperties} className="hover:text-brand-gold transition-colors">Properties Inventory</button></li>
                <li><a href="#projects" className="hover:text-brand-gold transition-colors">Featured Projects</a></li>
                <li><button onClick={() => openSiteVisitModal()} className="hover:text-brand-gold transition-colors">Book a Site Visit</button></li>
                <li><a href="/about" className="hover:text-brand-gold transition-colors">Our Legacy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">Legal</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="/privacy" className="hover:text-brand-gold transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-brand-gold transition-colors">Terms of Service</a></li>
                <li><a href="/compliance" className="hover:text-brand-gold transition-colors">Regulatory Compliance</a></li>
                <li><a href="/contact" className="hover:text-brand-gold transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} RKS Prime Properties. All rights reserved.</p>
            <p>Designed with luxury & trust in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};


