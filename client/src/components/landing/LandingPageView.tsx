import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Property } from '../../types/index.js';
import { 
  PlotOutlineIcon,
  VerifiedShieldIcon,
  RupeeSignIcon,
  GrowthCorridorIcon,
  KeyHandoverIcon,
  CabPickupIcon,
  PattaDocumentIcon,
  SurveyPinIcon,
  WhatsAppIcon
} from '../common/Icons.js';
import { ArrowRight, MapPin } from 'lucide-react';
import { PublicNavbar } from '../common/PublicNavbar.js';
import { PublicFooter } from '../common/PublicFooter.js';
import { getLocalizedPath, Locale } from '../../utils/locale.js';

interface LandingPageViewProps {
  onExploreProperties?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = () => {
  const { t, i18n } = useTranslation();
  const { openSiteVisitModal } = useApp();
  const navigate = useNavigate();

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  const [totalPlots, setTotalPlots] = useState<number | null>(null);
  const [availablePlots, setAvailablePlots] = useState<number | null>(null);
  const [completedVisits, setCompletedVisits] = useState<number | null>(null);
  const [featuredPlots, setFeaturedPlots] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const allProps = await api.getProperties({ limit: 1 });
        const availProps = await api.getProperties({ status: 'AVAILABLE', limit: 6 });
        const siteVisits = await api.getSiteVisits({ status: 'COMPLETED', limit: 1 });

        if (mounted) {
          setTotalPlots(allProps.pagination.total);
          setAvailablePlots(availProps.pagination.total);
          setFeaturedPlots(availProps.properties || []);
          
          let visitsCount = 0;
          if (siteVisits.stats && typeof siteVisits.stats.COMPLETED === 'number') {
            visitsCount = siteVisits.stats.COMPLETED;
          } else if (siteVisits.stats && typeof siteVisits.stats.total === 'number') {
            visitsCount = siteVisits.stats.total;
          } else if (siteVisits.site_visits) {
            visitsCount = siteVisits.site_visits.length;
          }
          setCompletedVisits(visitsCount > 0 ? visitsCount : 10);
        }
      } catch (err) {
        console.error('Error fetching landing page data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

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

  const cityCards = [
    { name: 'Chennai', count: '14+', slug: 'chennai' },
    { name: 'Trichy', count: '16+', slug: 'trichy' },
    { name: 'Coimbatore', count: '10+', slug: 'coimbatore' },
    { name: 'Hosur', count: '10+', slug: 'hosur' },
    { name: 'Bangalore Corridor', count: '8+', slug: 'bangalore-corridor' },
  ];

  const canonicalUrl = currentLocale === 'ta' ? 'https://rksprime.com/ta' : 'https://rksprime.com/';
  const pageTitle = currentLocale === 'ta' 
    ? 'RKS Prime Properties — சர்வே சரிபார்க்கப்பட்ட வீட்டு மனைகள்' 
    : 'RKS Prime Properties — Surveyed Plots with Clear Title';
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
        <link rel="alternate" hrefLang="en" href="https://rksprime.com/" />
        <link rel="alternate" hrefLang="ta" href="https://rksprime.com/ta" />
        <link rel="alternate" hrefLang="x-default" href="https://rksprime.com/" />
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
              "name": "RKS Prime Properties",
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

      {/* B. Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-16">
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
                {t('hero.exploreBtn', { count: availablePlots !== null ? availablePlots : 40 })}
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
                <option value="Chennai">Chennai</option>
                <option value="Trichy">Trichy</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Hosur">Hosur</option>
                <option value="Bangalore Corridor">Bangalore Corridor</option>
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

      {/* C. Live Stats Strip */}
      <section className="py-12 bg-slate-50 dark:bg-[#0A0C10] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-brand-slate rounded-2xl shadow-card border border-slate-100 dark:border-slate-800">
              <SurveyPinIcon size={32} className="text-brand-amber mb-4" />
              <div className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-white mb-1 font-heading">
                {totalPlots !== null ? totalPlots : '58'}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('stats.plotsCount')}</div>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-brand-slate rounded-2xl shadow-card border border-slate-100 dark:border-slate-800">
              <RupeeSignIcon size={32} className="text-brand-amber mb-4" />
              <div className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-white mb-1 font-heading">
                ₹850
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
                {completedVisits !== null ? completedVisits + '+' : '10+'}
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
              {t('featured.viewAll', { count: availablePlots !== null ? availablePlots : 40 })}
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
              {t('featured.viewAll', { count: availablePlots !== null ? availablePlots : 40 })}
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
                href={`https://wa.me/919876543210?text=${encodeURIComponent(t('whatsapp.general'))}`} 
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
    </div>
  );
};
