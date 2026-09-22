import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Property, Poster, Offer } from '../../types/index.js';
import { 
  PlotOutlineIcon,
  VerifiedShieldIcon,
  RupeeSignIcon,
  GrowthCorridorIcon,
  KeyHandoverIcon,
  CabPickupIcon,
  PattaDocumentIcon,
  SurveyPinIcon,
  WhatsAppIcon,
  CommercialBuildingIcon,
  VillaHouseIcon,
  ApartmentBuildingIcon,
  AgriculturalLandIcon,
  IndustrialFactoryIcon,
  DuplexHouseIcon
} from '../common/Icons.js';
import { ArrowRight, MapPin, ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut, Tag, Sparkles, Gift, Percent, Calendar } from 'lucide-react';
import { getWhatsAppUrl } from '../../utils/whatsapp.js';
import { PublicNavbar } from '../common/PublicNavbar.js';
import { PublicFooter } from '../common/PublicFooter.js';
import { OfferCard } from '../common/OfferCard.js';
import { getLocalizedPath, Locale } from '../../utils/locale.js';

interface LandingPageViewProps {
  onExploreProperties?: () => void;
}

const DEFAULT_POSTERS: Poster[] = [
  {
    id: -1,
    title: 'DTCP & RERA Approved Residential Plots',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop',
    link_url: '/properties?property_type=Residential+Plot',
    alt_text: 'DTCP & RERA Approved Plots in Tamil Nadu',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: -2,
    title: 'Free Cab Pickup for Site Visit — Book Today',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600&auto=format&fit=crop',
    link_url: '/contact',
    alt_text: 'Free Cab Tour Pickup for Property Inspection',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: -3,
    title: 'Commercial & Industrial Corridors across Chennai, Trichy & Hosur',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
    link_url: '/properties?property_type=Commercial+Plot',
    alt_text: 'Commercial & Industrial Land Investment',
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const CATEGORY_ITEMS = [
  { type: 'Residential Plot', label: 'Residential Plot', labelTa: 'குடியிருப்பு மனை', icon: PlotOutlineIcon },
  { type: 'Commercial Plot', label: 'Commercial Plot', labelTa: 'வணிக மனை', icon: CommercialBuildingIcon },
  { type: 'Villa', label: 'Villa & House', labelTa: 'வில்லா & தனி வீடு', icon: VillaHouseIcon },
  { type: 'Apartment', label: 'Apartment / Flat', labelTa: 'அபார்ட்மெண்ட்', icon: ApartmentBuildingIcon },
  { type: 'Agricultural Land', label: 'Agricultural Land', labelTa: 'விவசாய நிலம்', icon: AgriculturalLandIcon },
  { type: 'Industrial', label: 'Industrial Zone', labelTa: 'தொழில்துறை நிலம்', icon: IndustrialFactoryIcon },
  { type: 'Independent House', label: 'Independent House', labelTa: 'தனி வீடு', icon: KeyHandoverIcon },
  { type: 'Duplex', label: 'Duplex Home', labelTa: 'டூப்ளக்ஸ் வீடு', icon: DuplexHouseIcon },
];

export const LandingPageView: React.FC<LandingPageViewProps> = () => {
  const { t, i18n } = useTranslation();
  const { openSiteVisitModal } = useApp();
  const navigate = useNavigate();

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  const [cachedStatsData] = useState(() => {
    try {
      const cached = localStorage.getItem('rks_cached_public_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [totalPlots, setTotalPlots] = useState<number | null>(cachedStatsData?.totalPlots ?? null);
  const [availablePlots, setAvailablePlots] = useState<number | null>(cachedStatsData?.availablePlots ?? null);
  const [completedVisits, setCompletedVisits] = useState<number | null>(cachedStatsData?.completedVisits ?? null);
  const [startingRate, setStartingRate] = useState<number | null>(cachedStatsData?.startingRate ?? null);
  const [featuredPlots, setFeaturedPlots] = useState<Property[]>(cachedStatsData?.featuredPlots || []);
  const [isLoading, setIsLoading] = useState(!cachedStatsData);
  const [cityCounts, setCityCounts] = useState<Record<string, number>>(cachedStatsData?.cityCounts || {});
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(cachedStatsData?.categoryCounts || {});
  const [locationList, setLocationList] = useState<string[]>(cachedStatsData?.locations || []);
  const [whatsappNumber, setWhatsappNumber] = useState(cachedStatsData?.settings?.whatsapp_number || '+919840011223');

  // Poster carousel state initialized from localStorage cache to avoid flash of old default posters
  const [posters, setPosters] = useState<Poster[]>(() => {
    try {
      const cached = localStorage.getItem('rks_cached_posters');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage parse error
    }
    return DEFAULT_POSTERS;
  });
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const [isPosterPaused, setIsPosterPaused] = useState(false);

  // Poster Lightbox Zoom state
  const [zoomedPoster, setZoomedPoster] = useState<Poster | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState('');

  // ESC key to close lightbox zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomedPoster(null);
        setZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active promotional offers state initialized from cache
  const [offers, setOffers] = useState<Offer[]>(() => {
    try {
      const cached = localStorage.getItem('rks_cached_offers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [stats, postersRes, offersRes] = await Promise.all([
          api.getPublicStats().catch(() => null),
          api.getPosters().catch(() => ({ posters: [] })),
          api.getOffers().catch(() => ({ offers: [] })),
        ]);

        if (mounted && stats) {
          setTotalPlots(stats.totalPlots);
          setAvailablePlots(stats.availablePlots);
          setStartingRate(stats.startingRate);
          setCompletedVisits(stats.completedVisits);
          setFeaturedPlots(stats.featuredPlots || []);
          setCityCounts(stats.cityCounts || {});
          setCategoryCounts(stats.categoryCounts || {});
          setLocationList(stats.locations || []);
          if (stats.settings?.whatsapp_number) {
            setWhatsappNumber(stats.settings.whatsapp_number);
          }
          try {
            localStorage.setItem('rks_cached_public_stats', JSON.stringify(stats));
          } catch {
            // LocalStorage quota
          }
        }

        if (mounted && postersRes?.posters && postersRes.posters.length > 0) {
          setPosters(postersRes.posters);
          try {
            localStorage.setItem('rks_cached_posters', JSON.stringify(postersRes.posters));
          } catch {
            // LocalStorage quota
          }
        }

        if (mounted && offersRes?.offers && Array.isArray(offersRes.offers)) {
          setOffers(offersRes.offers);
          try {
            localStorage.setItem('rks_cached_offers', JSON.stringify(offersRes.offers));
          } catch {
            // LocalStorage quota
          }
        }
      } catch (err) {
        console.error('Error fetching landing page data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // Poster Auto-scroll timer
  useEffect(() => {
    if (isPosterPaused || posters.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPosterIndex((prev) => (prev + 1) % posters.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPosterPaused, posters.length]);

  // Build city cards dynamically from API data
  const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-');
  const cityCards = locationList.map(city => ({
    name: city,
    count: cityCounts[city] || 0,
    slug: slugify(city),
  }));

  const handleExplore = () => {
    navigate(getLocalizedPath('/properties', currentLocale));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set('city', searchLocation);
    if (searchType) params.set('type', searchType);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    navigate(`${getLocalizedPath('/properties', currentLocale)}${queryString}`);
  };



  const canonicalUrl = currentLocale === 'ta' ? 'https://www.rkspropertyhub.in/ta' : 'https://www.rkspropertyhub.in/';
  const pageTitle = currentLocale === 'ta' 
    ? 'RKS Property Hub — சர்வே சரிபார்க்கப்பட்ட வீட்டு மனைகள்' 
    : 'RKS Property Hub — Surveyed Plots with Clear Title';
  const pageDesc = currentLocale === 'ta'
    ? 'சென்னை, திருச்சி, கோவை, ஓசூர் மற்றும் பெங்களூரு காரிடாரில் வில்லங்கமற்ற பட்டா ஆவணங்கள் மற்றும் இலவச வாகன தளப் பார்வையுடன் கூடிய பிரீமியம் வீட்டு மனைகள்.'
    : 'Find verified surveyed plots in Chennai, Trichy, Coimbatore, Hosur & Bangalore Corridor with transparent pricing and clear titles. Book a free cab site visit.';

  return (
    <div className="min-h-screen bg-white dark:bg-rks-bgDark text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      <Helmet>
        <html lang={currentLocale} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en" href="https://www.rkspropertyhub.in/" />
        <link rel="alternate" hrefLang="ta" href="https://www.rkspropertyhub.in/ta" />
        <link rel="alternate" hrefLang="x-default" href="https://www.rkspropertyhub.in/" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": "RKS Property Hub",
              "image": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200",
              "telephone": "+919876543210",
              "email": "info@rksprime.com",
              "priceRange": "₹₹",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "T Nagar",
                "addressLocality": "Chennai",
                "addressRegion": "Tamil Nadu",
                "postalCode": "600017",
                "addressCountry": "IN"
              },
              "areaServed": ["Chennai", "Trichy", "Coimbatore", "Hosur", "Bangalore Corridor"],
              "sameAs": ["https://wa.me/919876543210"]
            }
          `}
        </script>
      </Helmet>

      {/* A. Navigation Bar */}
      <PublicNavbar />

      {/* Top Landscape Auto-scrolling Poster Carousel */}
      {posters.length > 0 && (
        <section 
          className="pt-24 pb-4 bg-brand-navy border-b border-slate-800"
          onMouseEnter={() => setIsPosterPaused(true)}
          onMouseLeave={() => setIsPosterPaused(false)}
          onTouchStart={() => setIsPosterPaused(true)}
          onTouchEnd={() => setIsPosterPaused(false)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-brand-navy border border-slate-700/50 aspect-[21/9] sm:aspect-[24/9] md:aspect-[28/9]">
              <div 
                className="w-full h-full relative group cursor-pointer"
                onClick={() => {
                  const currentPoster = posters[currentPosterIndex];
                  if (currentPoster) {
                    setZoomedPoster(currentPoster);
                    setZoomScale(1);
                  }
                }}
              >
                <img 
                  src={posters[currentPosterIndex]?.image_url} 
                  alt={posters[currentPosterIndex]?.alt_text || posters[currentPosterIndex]?.title || 'RKS Property Hub Banner'} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Zoom Badge overlay button (Top Right) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentPoster = posters[currentPosterIndex];
                    if (currentPoster) {
                      setZoomedPoster(currentPoster);
                      setZoomScale(1);
                    }
                  }}
                  className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Zoom Banner Image"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-brand-gold" />
                  <span className="hidden sm:inline">Tap to Zoom</span>
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-8">
                  {posters[currentPosterIndex]?.title && (
                    <h3 className="text-white text-lg sm:text-2xl md:text-3xl font-black font-heading tracking-tight drop-shadow-md">
                      {posters[currentPosterIndex].title}
                    </h3>
                  )}
                  {posters[currentPosterIndex]?.link_url && (
                    <a
                      href={posters[currentPosterIndex]?.link_url || '#'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!posters[currentPosterIndex]?.link_url) e.preventDefault();
                        else if (posters[currentPosterIndex].link_url?.startsWith('/')) {
                          e.preventDefault();
                          navigate(posters[currentPosterIndex].link_url!);
                        }
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-teal bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 rounded-full w-fit shadow-md hover:bg-brand-teal hover:text-white transition-colors cursor-pointer"
                    >
                      Explore Offer <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Prev / Next Arrows */}
              {posters.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPosterIndex((prev) => (prev === 0 ? posters.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer z-10"
                    aria-label="Previous Poster"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPosterIndex((prev) => (prev + 1) % posters.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer z-10"
                    aria-label="Next Poster"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {/* Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                    {posters.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPosterIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all cursor-pointer ${idx === currentPosterIndex ? 'w-6 bg-brand-teal' : 'w-2 bg-white/50'}`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* B. Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col justify-center pt-12 pb-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80" 
            alt="Premium Real Estate" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/95 via-brand-navy/80 to-brand-navy/60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8">
          <div className="max-w-3xl animate-slide-up">
            <div className="inline-block px-3 py-1 rounded-full bg-brand-teal/30 border border-brand-teal-light/40 text-brand-teal-light text-xs font-semibold uppercase tracking-wider mb-4">
              {t('hero.badge')}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-white leading-tight mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-200 mb-8 max-w-2xl leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button 
                onClick={handleExplore} 
                className="bg-brand-teal hover:bg-brand-teal-light text-white px-8 py-4 rounded-full font-bold text-base sm:text-lg transition-all shadow-elevated hover:shadow-luxury flex items-center justify-center gap-2"
              >
                {t('hero.exploreBtn', { count: availablePlots !== null ? availablePlots : '…' })}
                <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => openSiteVisitModal()} 
                className="bg-transparent hover:bg-white/10 text-white border-2 border-white px-8 py-4 rounded-full font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2"
              >
                <CabPickupIcon size={20} />
                {t('hero.bookTourBtn')}
              </button>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-8 items-center text-xs sm:text-sm font-medium text-slate-200">
              <div className="flex items-center gap-2">
                <VerifiedShieldIcon size={18} className="text-brand-teal-light" />
                <span>{t('hero.trustPatta')}</span>
              </div>
              <div className="flex items-center gap-2">
                <VerifiedShieldIcon size={18} className="text-brand-teal-light" />
                <span>{t('hero.trustTitle')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CabPickupIcon size={18} className="text-brand-teal-light" />
                <span>{t('hero.trustCab')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 w-full mt-12 mb-4">
          <div className="bg-white dark:bg-brand-slate rounded-2xl p-4 shadow-luxury flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select 
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-brand-navy border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal text-slate-800 dark:text-slate-200 appearance-none font-medium text-sm"
              >
                <option value="">{t('hero.allLocations')}</option>
                {locationList.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:flex-1 relative">
              <PlotOutlineIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-brand-navy border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal text-slate-800 dark:text-slate-200 appearance-none font-medium text-sm"
              >
                <option value="">{t('hero.allTypes')}</option>
                <option value="Residential Plot">Residential Plot</option>
                <option value="Commercial Plot">Commercial Plot</option>
              </select>
            </div>
            <button 
              onClick={handleSearch} 
              className="w-full md:w-auto px-8 py-3 bg-brand-teal text-white font-bold rounded-xl shadow-md hover:bg-brand-teal-light transition-colors text-sm"
            >
              {t('hero.searchBtn')}
            </button>
          </div>
        </div>
      </section>

      {/* Icon-Based Category Browsing Grid */}
      <section className="py-14 bg-white dark:bg-rks-bgDark border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-brand-navy dark:text-white">
              {currentLocale === 'ta' ? 'வகை வாரியாக மனைகள்' : 'Browse Properties by Category'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {currentLocale === 'ta' ? 'அதிகாரப்பூர்வ நேரடி தரவுகளுடன் கூடிய சொத்து பிரிவுகள்' : 'Filter verified listings directly by property type'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {CATEGORY_ITEMS.map((cat) => {
              const IconComp = cat.icon;
              const count = categoryCounts[cat.type] || (cat.type === 'Residential Plot' ? (availablePlots || 40) : 0);
              return (
                <button
                  key={cat.type}
                  onClick={() => navigate(`${getLocalizedPath('/properties', currentLocale)}?property_type=${encodeURIComponent(cat.type)}`)}
                  className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 dark:bg-[#12161F] border border-slate-200 dark:border-zinc-800 hover:border-brand-teal dark:hover:border-brand-teal hover:shadow-xl transition-all duration-300 cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-teal/10 text-brand-teal group-hover:bg-brand-teal group-hover:text-white flex items-center justify-center transition-all duration-300 mb-3">
                    <IconComp size={24} />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-teal transition-colors">
                    {currentLocale === 'ta' ? cat.labelTa : cat.label}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-mono">
                    {count} {currentLocale === 'ta' ? 'கிடைக்கிறது' : 'available'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* C. Live Stats Strip */}
      <section className="py-12 bg-slate-50 dark:bg-[#0A0C10] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-brand-slate rounded-2xl shadow-card border border-slate-100 dark:border-slate-800">
              <SurveyPinIcon size={32} className="text-brand-amber mb-4" />
              <div className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-white mb-1 font-heading">
                {totalPlots !== null ? totalPlots : '…'}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('stats.plotsCount')}</div>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-brand-slate rounded-2xl shadow-card border border-slate-100 dark:border-slate-800">
              <RupeeSignIcon size={32} className="text-brand-amber mb-4" />
              <div className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-white mb-1 font-heading">
                {startingRate !== null ? `₹${startingRate}` : '…'}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('stats.startingRate')} {t('stats.perSqft')}</div>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-brand-slate rounded-2xl shadow-card border border-slate-100 dark:border-slate-800">
              <VerifiedShieldIcon size={32} className="text-brand-amber mb-4" />
              <div className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-white mb-1 font-heading">
                100%
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('stats.guarantee')}</div>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-brand-slate rounded-2xl shadow-card border border-slate-100 dark:border-slate-800">
              <KeyHandoverIcon size={32} className="text-brand-amber mb-4" />
              <div className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-white mb-1 font-heading">
                {completedVisits !== null ? completedVisits + '+' : '…'}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('stats.visitsCompleted')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* D. Why Choose RKS Grid */}
      <section className="py-20 bg-white dark:bg-rks-bgDark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-brand-navy dark:text-white mb-4">
              {t('features.heading')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-4">
              {t('features.subheading')}
            </p>
            <div className="h-1 w-20 bg-brand-teal mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-brand-slate border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 hover:shadow-premium transition-shadow">
              <div className="flex-shrink-0 w-16 h-16 bg-brand-teal/10 dark:bg-brand-teal/20 rounded-full flex items-center justify-center text-brand-teal">
                <CabPickupIcon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-navy dark:text-white mb-2">{t('features.cabTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{t('features.cabDesc')}</p>
              </div>
            </div>
            
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-brand-slate border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 hover:shadow-premium transition-shadow">
              <div className="flex-shrink-0 w-16 h-16 bg-brand-teal/10 dark:bg-brand-teal/20 rounded-full flex items-center justify-center text-brand-teal">
                <PattaDocumentIcon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-navy dark:text-white mb-2">{t('features.pattaTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{t('features.pattaDesc')}</p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-brand-slate border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 hover:shadow-premium transition-shadow">
              <div className="flex-shrink-0 w-16 h-16 bg-brand-teal/10 dark:bg-brand-teal/20 rounded-full flex items-center justify-center text-brand-teal">
                <GrowthCorridorIcon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-navy dark:text-white mb-2">{t('features.corridorsTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{t('features.corridorsDesc')}</p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-brand-slate border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 hover:shadow-premium transition-shadow">
              <div className="flex-shrink-0 w-16 h-16 bg-brand-teal/10 dark:bg-brand-teal/20 rounded-full flex items-center justify-center text-brand-teal">
                <RupeeSignIcon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-navy dark:text-white mb-2">{t('features.bankTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{t('features.bankDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E. Exclusive Offers & Seasonal Promotions */}
      <section id="offers" className="py-20 bg-gradient-to-b from-amber-500/5 via-slate-50 to-white dark:from-amber-950/20 dark:via-[#090C12] dark:to-[#0A0C10] border-t border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="h-4 w-4" />
                <span>Limited Time Concessions</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-white">
                {currentLocale === 'ta' ? 'சிறப்பு சலுகைகள் & தள்ளுபடிகள்' : 'Exclusive Deals & Festive Offers'}
              </h2>
              <p className="text-slate-600 dark:text-zinc-400 mt-2 text-sm sm:text-base max-w-2xl">
                {currentLocale === 'ta'
                  ? 'RKS பிரைம் ப்ராப்பர்டீஸ் வழங்கும் பிரத்யேக விலை தள்ளுபடி மற்றும் பதிவுக் கட்டண சலுகைகள்.'
                  : 'Avail direct developer discounts, stamp duty concessions, and complimentary site visit cab tours.'}
              </p>
            </div>

            <button
              onClick={() => openSiteVisitModal()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer shrink-0"
            >
              <Calendar className="h-4 w-4" />
              <span>{currentLocale === 'ta' ? 'சலுகையைப் பெற முன்பதிவு செய்' : 'Claim Offer & Book Visit'}</span>
            </button>
          </div>

          {offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onClaim={() => openSiteVisitModal()}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-amber-500/30 bg-white dark:bg-[#12161F] p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-500">
                    <Gift className="h-4 w-4" /> FESTIVAL PROMO
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Zero Registration & Legal Fees Waiver</h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">Save up to ₹75,000 on DTCP plot registration fees when booking this month.</p>
                </div>
                <button onClick={() => openSiteVisitModal()} className="mt-6 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 py-2.5 text-xs font-bold text-slate-900 dark:text-white hover:bg-amber-500 hover:text-black transition-all cursor-pointer">
                  Book Visit to Claim
                </button>
              </div>

              <div className="rounded-3xl border border-cyan-500/30 bg-white dark:bg-[#12161F] p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-400">
                    <CabPickupIcon size={16} /> FREE DOORSTEP PICKUP
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Complimentary AC Cab Inspection Tour</h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">Free door-to-door AC cab pickup for your family to inspect layout developments.</p>
                </div>
                <button onClick={() => openSiteVisitModal()} className="mt-6 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 py-2.5 text-xs font-bold text-slate-900 dark:text-white hover:bg-cyan-500 hover:text-black transition-all cursor-pointer">
                  Schedule Free Pickup
                </button>
              </div>

              <div className="rounded-3xl border border-emerald-500/30 bg-white dark:bg-[#12161F] p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                    <Percent className="h-4 w-4" /> DIRECT SAVINGS
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">₹100/sq.ft Concession on Bulk Plot Bookings</h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">Special developer concession for dual plot bookings in Chennai & Trichy corridors.</p>
                </div>
                <button onClick={() => openSiteVisitModal()} className="mt-6 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 py-2.5 text-xs font-bold text-slate-900 dark:text-white hover:bg-emerald-500 hover:text-black transition-all cursor-pointer">
                  Inquire Concession
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* E. Featured Properties */}
      <section id="projects" className="py-20 bg-slate-50 dark:bg-[#0A0C10] border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-brand-navy dark:text-white mb-2">
                {t('featured.heading')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {t('featured.subheading')}
              </p>
            </div>
            <button 
              onClick={handleExplore} 
              className="hidden md:flex items-center gap-2 text-brand-teal font-semibold hover:text-brand-teal-light transition-colors"
            >
              {t('featured.viewAll', { count: availablePlots !== null ? availablePlots : '…' })}
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-brand-slate h-96 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPlots.length > 0 ? featuredPlots.map(plot => {
                const localizedDesc = (currentLocale === 'ta' && plot.description_ta) 
                  ? plot.description_ta 
                  : (plot.description || '');

                return (
                  <div key={plot.id} className="bg-white dark:bg-brand-slate rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow border border-slate-100 dark:border-slate-800 flex flex-col">
                    <div className="relative h-48 bg-slate-200 dark:bg-slate-700">
                      {plot.primary_image_url ? (
                        <img src={plot.primary_image_url} alt={plot.project_name || plot.property_code} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <PlotOutlineIcon size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {t('listing.available')}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="text-xs text-brand-teal font-semibold mb-2">{plot.property_code} {plot.project_name ? `• ${plot.project_name}` : ''}</div>
                      <h3 className="text-xl font-bold text-brand-navy dark:text-white mb-2 font-heading">
                        {currentLocale === 'ta' ? `${plot.city || plot.location_name || ''} மனை` : `Plot in ${plot.city || plot.location_name || 'Prime Location'}`}
                      </h3>
                      
                      {localizedDesc && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                          {localizedDesc}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 my-2 py-3 border-y border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('featured.area')}</div>
                          <div className="font-semibold text-brand-navy dark:text-white">{plot.area_sqft} {t('featured.sqft')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('featured.rate')}</div>
                          <div className="font-semibold text-brand-navy dark:text-white">₹{plot.rate_per_sqft}{t('stats.perSqft')}</div>
                        </div>
                      </div>
                      
                      <div className="mb-6 mt-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('featured.price')}</div>
                        <div className="text-2xl font-bold text-brand-amber">₹{(plot.total_price / 100000).toFixed(2)} Lakhs</div>
                      </div>

                      <div className="flex gap-3 mt-auto">
                        <button 
                          onClick={handleExplore} 
                          className="flex-1 py-2.5 rounded-lg border border-brand-teal text-brand-teal font-semibold hover:bg-brand-teal/5 transition-colors text-center text-sm"
                        >
                          {t('featured.viewDetails')}
                        </button>
                        <button 
                          onClick={() => openSiteVisitModal(plot)} 
                          className="flex-1 py-2.5 rounded-lg bg-brand-teal text-white font-semibold hover:bg-brand-teal-light transition-colors text-center text-sm"
                        >
                          {t('featured.bookVisit')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                  {t('listing.noPlots')}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-10 text-center md:hidden">
            <button 
              onClick={handleExplore} 
              className="inline-flex items-center gap-2 text-brand-teal font-semibold text-sm"
            >
              {t('featured.viewAll', { count: availablePlots !== null ? availablePlots : '…' })}
            </button>
          </div>
        </div>
      </section>

      {/* F. City/Location CTA Cards */}
      <section id="locations" className="py-20 bg-white dark:bg-rks-bgDark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-brand-navy dark:text-white mb-2 text-center">
            {t('cities.heading')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-xl mx-auto mb-10 text-sm sm:text-base">
            {t('cities.subheading')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {cityCards.map((city, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 dark:bg-brand-slate rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-800 hover:border-brand-teal/50 transition-colors group cursor-pointer" 
                onClick={() => navigate(getLocalizedPath(`/plots/${city.slug}`, currentLocale))}
              >
                <div className="w-12 h-12 bg-white dark:bg-[#0A0C10] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-brand-teal group-hover:scale-110 transition-transform">
                  <MapPin size={24} />
                </div>
                <h3 className="font-bold text-brand-navy dark:text-white mb-1">{city.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{city.count} {t('cities.plotsAvailable')}</p>
                <span className="text-sm text-brand-teal font-semibold group-hover:underline">{t('cities.viewPlots')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* G. Site Visit CTA Banner */}
      <section className="bg-brand-navy py-16 border-y-4 border-brand-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-4">
                {t('siteVisitBanner.title')}
              </h2>
              <p className="text-slate-300 text-base sm:text-lg">
                {t('siteVisitBanner.subtitle')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <button 
                onClick={() => openSiteVisitModal()} 
                className="bg-brand-teal hover:bg-brand-teal-light text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg transition-colors shadow-elevated"
              >
                {t('siteVisitBanner.bookBtn')}
              </button>
              <a 
                href={getWhatsAppUrl(whatsappNumber, t('whatsapp.general'))} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg transition-colors shadow-elevated flex items-center justify-center gap-2"
              >
                <WhatsAppIcon size={24} />
                {t('siteVisitBanner.whatsappBtn')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* H. Footer */}
      <PublicFooter />

      {/* Poster Zoom Lightbox Modal */}
      {zoomedPoster && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in select-none"
          onClick={() => {
            setZoomedPoster(null);
            setZoomScale(1);
          }}
        >
          {/* Top Control Bar */}
          <div 
            className="absolute top-4 right-4 z-50 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-900/80 border border-slate-700/80 rounded-full px-3 py-1.5 gap-2 text-white shadow-lg">
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.8, prev - 0.25))}
                className="hover:text-brand-teal transition-colors cursor-pointer p-1"
                title="Zoom Out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-xs font-semibold w-12 text-center text-slate-300">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(3, prev + 0.25))}
                className="hover:text-brand-teal transition-colors cursor-pointer p-1"
                title="Zoom In"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setZoomedPoster(null);
                setZoomScale(1);
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
              aria-label="Close Zoom Modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main Zoomed Image Container */}
          <div 
            className="relative max-w-5xl max-h-[80vh] overflow-auto flex items-center justify-center transition-all rounded-2xl border border-slate-700/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={zoomedPoster.image_url} 
              alt={zoomedPoster.alt_text || zoomedPoster.title || 'Zoomed Poster Banner'} 
              className="max-w-full max-h-[75vh] object-contain transition-transform duration-300 ease-out rounded-xl"
              style={{ transform: `scale(${zoomScale})` }}
            />
          </div>

          {/* Caption & Navigation CTA */}
          <div 
            className="mt-4 max-w-2xl text-center z-50 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {zoomedPoster.title && (
              <h4 className="text-lg sm:text-xl font-bold font-heading mb-1 text-white">
                {zoomedPoster.title}
              </h4>
            )}
            {zoomedPoster.link_url && (
              <a
                href={zoomedPoster.link_url}
                onClick={(e) => {
                  if (zoomedPoster.link_url?.startsWith('/')) {
                    e.preventDefault();
                    setZoomedPoster(null);
                    navigate(zoomedPoster.link_url);
                  }
                }}
                className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-brand-teal hover:text-brand-teal-light underline transition-colors cursor-pointer"
              >
                Explore Offer Details <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
