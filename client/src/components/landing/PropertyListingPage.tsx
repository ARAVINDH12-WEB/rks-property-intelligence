import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PublicNavbar } from '../common/PublicNavbar.js';
import { PublicFooter } from '../common/PublicFooter.js';
import { api } from '../../services/api.js';
import { Property } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';
import { MapPin, Filter, X, ArrowUp, LayoutGrid, List } from 'lucide-react';
import { WhatsAppIcon } from '../common/Icons.js';
import { useNavigate } from 'react-router-dom';
import { getLocalizedPath, Locale } from '../../utils/locale.js';

interface PropertyListingPageProps {
  cityFilter?: string;
  hideNavFooter?: boolean;
  children?: React.ReactNode;
}

const statusColors = {
  AVAILABLE: { border: 'border-green-500', bg: 'bg-green-50/50 dark:bg-green-900/10', text: 'text-green-700 dark:text-green-400' },
  RESERVED: { border: 'border-brand-amber', bg: 'bg-amber-50/50 dark:bg-amber-900/10', text: 'text-brand-amber dark:text-amber-400' },
};

export const PropertyListingPage: React.FC<PropertyListingPageProps> = ({ cityFilter, hideNavFooter, children }) => {
  const { t, i18n } = useTranslation();
  const { theme, openSiteVisitModal } = useApp();
  const navigate = useNavigate();

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [city, setCity] = useState(cityFilter || '');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED'>('AVAILABLE');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = window.innerWidth < 768 ? 10 : 12;
  const [total, setTotal] = useState(0);
  const [locations, setLocations] = useState<string[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('+919840011223');

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Parse URL search params on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('property_type') || urlParams.get('type');
    const urlCity = urlParams.get('city') || urlParams.get('q');
    if (urlType) setPropertyType(urlType);
    if (urlCity && !cityFilter) setCity(urlCity);

    // Fetch distinct locations & settings
    api.getPublicStats().then(stats => {
      if (stats.locations) setLocations(stats.locations);
      if (stats.settings?.whatsapp_number) setWhatsappNumber(stats.settings.whatsapp_number);
    }).catch(console.error);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update URL search parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (propertyType) params.set('property_type', propertyType);
    else params.delete('property_type');
    if (city) params.set('city', city);
    else params.delete('city');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [propertyType, city]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit,
        offset: (page - 1) * limit,
        status,
      };
      if (city) params.q = city;
      if (propertyType) params.property_type = propertyType;

      const res = await api.getProperties(params);
      let fetchedProps = res.properties || [];

      // Sorting
      if (sortBy === 'price_asc') fetchedProps.sort((a, b) => a.total_price - b.total_price);
      if (sortBy === 'price_desc') fetchedProps.sort((a, b) => b.total_price - a.total_price);
      if (sortBy === 'area_desc') fetchedProps.sort((a, b) => b.area_sqft - a.area_sqft);

      // Filtering
      if (minBudget) fetchedProps = fetchedProps.filter(p => p.total_price >= parseInt(minBudget) * 100000);
      if (maxBudget) fetchedProps = fetchedProps.filter(p => p.total_price <= parseInt(maxBudget) * 100000);
      if (minArea) fetchedProps = fetchedProps.filter(p => p.area_sqft >= parseInt(minArea));
      if (maxArea) fetchedProps = fetchedProps.filter(p => p.area_sqft <= parseInt(maxArea));

      setProperties(fetchedProps);
      setTotal(res.pagination?.total || fetchedProps.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, city, minBudget, maxBudget, minArea, maxArea, propertyType, status, sortBy]);

  useEffect(() => {
    if (cityFilter) {
      setCity(cityFilter);
      setPage(1);
    }
  }, [cityFilter]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsApp = (plot: Property) => {
    const message = t('whatsapp.plotInquiry', { 
      code: plot.property_code, 
      city: plot.city || plot.location_name || 'Tamil Nadu' 
    });
    const cleanWa = whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹ ${(price / 10000000).toFixed(2)} Cr`;
    return `₹ ${(price / 100000).toFixed(2)} Lakhs`;
  };

  const canonicalUrl = currentLocale === 'ta' ? 'https://rksprime.com/ta/properties' : 'https://rksprime.com/properties';
  const pageTitle = currentLocale === 'ta' 
    ? 'விற்பனைக்கு உள்ள மனைகள் | RKS Property Hub' 
    : 'Verified Surveyed Plots for Sale | RKS Property Hub';
  const pageDesc = currentLocale === 'ta'
    ? 'சென்னை, திருச்சி, கோவை மற்றும் ஓசூரில் உடனடி பத்திரப்பதிவுக்கு தயார் நிலையில் உள்ள சர்வே வீட்டு மனைகள்.'
    : 'Browse verified residential plots in Chennai, Trichy, Coimbatore, Hosur & Bangalore Corridor with clear Patta and transparent pricing.';

  return (
    <div className={`min-h-screen font-sans ${theme === 'dark' ? 'dark bg-rks-bgDark text-white' : 'bg-rks-bg text-brand-navy'}`}>
      <Helmet>
        <html lang={currentLocale} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en" href="https://rksprime.com/properties" />
        <link rel="alternate" hrefLang="ta" href="https://rksprime.com/ta/properties" />
        <link rel="alternate" hrefLang="x-default" href="https://rksprime.com/properties" />
      </Helmet>

      {!hideNavFooter && <PublicNavbar />}
      
      {children}

      <div className={`${hideNavFooter ? 'pt-8' : 'pt-24'} max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex flex-col md:flex-row gap-8`}>
        
        {/* Filter Sidebar (Desktop) */}
        <div 
          className="hidden md:block w-[280px] shrink-0 sticky top-24 self-start h-[calc(100vh-120px)] overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-sm"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0z' fill='none'/%3E%3Cpath d='M0 20L20 0' stroke='%230F766E' stroke-width='0.3' stroke-opacity='0.2'/%3E%3C/svg%3E")` }}
        >
          <h2 className="text-xl font-heading font-bold mb-6 text-brand-navy dark:text-white">
            {t('listing.filters')}
          </h2>
          
          <div className="space-y-6 relative z-10 bg-white/80 dark:bg-[#12161F]/80 backdrop-blur-sm p-2 rounded-lg -m-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('listing.location')}
              </label>
              <select value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm">
                <option value="">{t('listing.allLocations')}</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('listing.budget')}
              </label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={minBudget} onChange={e => setMinBudget(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                <span>-</span>
                <input type="number" placeholder="Max" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('listing.plotSize')}
              </label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={minArea} onChange={e => setMinArea(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                <span>-</span>
                <input type="number" placeholder="Max" value={maxArea} onChange={e => setMaxArea(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('listing.propertyType')}
              </label>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm">
                <option value="">{t('listing.allTypes')}</option>
                <option value="Residential Plot">Residential Plot</option>
                <option value="Commercial Plot">Commercial Plot</option>
                <option value="Villa">Villa & House</option>
                <option value="Apartment">Apartment / Flat</option>
                <option value="Agricultural Land">Agricultural Land</option>
                <option value="Industrial">Industrial Zone</option>
                <option value="Independent House">Independent House</option>
                <option value="Duplex">Duplex Home</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('listing.sortBy')}
              </label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm">
                <option value="AVAILABLE">{t('listing.available')}</option>
                <option value="RESERVED">{t('listing.reserved')}</option>
              </select>
            </div>
            
            <button 
              onClick={() => { setCity(''); setMinBudget(''); setMaxBudget(''); setMinArea(''); setMaxArea(''); setPropertyType(''); setStatus('AVAILABLE'); setPage(1); }} 
              className="w-full text-brand-teal text-sm font-semibold hover:underline"
            >
              {t('listing.clearFilters')}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-brand-navy dark:text-white">
                {t('listing.title')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {t('listing.subtitle')} ({properties.length} results)
              </p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                className="md:hidden flex-1 border border-slate-300 dark:border-zinc-700 rounded-md py-2 px-4 flex items-center justify-center gap-2 bg-white dark:bg-[#12161F] text-sm" 
                onClick={() => setShowMobileFilters(true)}
              >
                <Filter size={18} /> {t('listing.filters')}
              </button>
              
              <div className="flex items-center rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12161F] p-1">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-zinc-800 text-brand-teal' : 'text-slate-400'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 dark:bg-zinc-800 text-brand-teal' : 'text-slate-400'}`}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>

              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)} 
                className="rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12161F] px-3 py-2 text-sm"
              >
                <option value="newest">{t('listing.newest')}</option>
                <option value="price_asc">{t('listing.priceLowHigh')}</option>
                <option value="price_desc">{t('listing.priceHighLow')}</option>
                <option value="area_desc">{t('listing.areaLargeSmall')}</option>
              </select>
            </div>
          </div>

          {/* Quick Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {[
              { type: '', label: 'All Categories' },
              { type: 'Residential Plot', label: 'Residential Plot' },
              { type: 'Commercial Plot', label: 'Commercial Plot' },
              { type: 'Villa', label: 'Villa & House' },
              { type: 'Apartment', label: 'Apartment' },
              { type: 'Agricultural Land', label: 'Agricultural Land' },
              { type: 'Industrial', label: 'Industrial' },
              { type: 'Independent House', label: 'Independent House' },
              { type: 'Duplex', label: 'Duplex Home' },
            ].map((chip) => (
              <button
                key={chip.type}
                onClick={() => setPropertyType(chip.type)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  propertyType === chip.type
                    ? 'bg-brand-teal text-white shadow-md'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200 dark:bg-zinc-800 h-[300px] rounded-xl"></div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#12161F] rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <MapPin className="text-brand-teal" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('listing.noPlots')}</h3>
              <p className="text-slate-500 mb-6 text-sm">{t('listing.subtitle')}</p>
              <button 
                onClick={() => { setCity(''); setMinBudget(''); setMaxBudget(''); setMinArea(''); setMaxArea(''); setPropertyType(''); setStatus('AVAILABLE'); setPage(1); }} 
                className="bg-brand-teal text-white px-6 py-2 rounded-full font-semibold text-sm hover:bg-brand-teal-light transition-colors"
              >
                {t('listing.clearFilters')}
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-auto' : 'grid-cols-1'}`}>
              {properties.map((plot) => {
                const localizedDesc = (currentLocale === 'ta' && plot.description_ta) 
                  ? plot.description_ta 
                  : (plot.description || '');

                return (
                  <div key={plot.id} className={`group bg-white dark:bg-[#12161F] rounded-xl overflow-hidden border border-slate-200/60 dark:border-zinc-800 hover:border-brand-teal/50 hover:shadow-premium transition-all duration-300 relative ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}>
                    {/* Hover accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-teal scale-y-0 group-hover:scale-y-100 transition-transform origin-top z-10"></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider border-l-4 ${statusColors[plot.status as keyof typeof statusColors]?.border} ${statusColors[plot.status as keyof typeof statusColors]?.bg} ${statusColors[plot.status as keyof typeof statusColors]?.text} backdrop-blur-md rounded-r-md`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-75"></span>
                        {plot.status === 'AVAILABLE' ? t('listing.available') : t('listing.reserved')}
                      </div>
                    </div>

                    <div className={`${viewMode === 'list' ? 'w-full sm:w-1/3' : 'w-full'} aspect-[4/3] bg-slate-100 dark:bg-zinc-800 relative overflow-hidden`}>
                      <img 
                        src={(plot as any).survey_image_url || (plot as any).image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                        alt={`Plot ${plot.property_code}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="text-xs text-brand-teal font-semibold mb-1">{plot.property_code} {plot.project_name ? `• ${plot.project_name}` : ''}</div>
                      <h3 className="text-lg font-bold font-heading text-brand-navy dark:text-white mb-2">
                        {currentLocale === 'ta' ? `${plot.city || plot.location_name || ''} மனை` : `Plot in ${plot.city || plot.location_name || 'Prime Location'}`}
                      </h3>

                      {localizedDesc && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                          {localizedDesc}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 mt-2">
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">{t('featured.area')}</div>
                          <div className="font-semibold text-sm">{plot.area_sqft} <span className="text-xs font-normal text-slate-500">{t('featured.sqft')}</span></div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">{t('featured.facing')}</div>
                          <div className="font-semibold text-sm">{plot.facing || 'East'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">{t('featured.rate')}</div>
                          <div className="font-semibold text-sm">₹{plot.rate_per_sqft}{t('stats.perSqft')}</div>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="text-xl font-bold text-brand-amber">{formatPrice(plot.total_price)}</div>
                      </div>

                      <div className={`mt-4 gap-2 ${viewMode === 'list' ? 'flex' : 'grid grid-cols-2'}`}>
                        <button 
                          onClick={() => navigate(getLocalizedPath('/contact', currentLocale))} 
                          className="flex-1 py-2 rounded-lg border border-brand-teal text-brand-teal font-semibold hover:bg-brand-teal/5 transition-colors text-center text-xs sm:text-sm"
                        >
                          {t('featured.viewDetails')}
                        </button>
                        <button 
                          onClick={() => openSiteVisitModal(plot)} 
                          className="flex-1 py-2 rounded-lg bg-brand-teal text-white font-semibold hover:bg-brand-teal-light transition-colors text-center text-xs sm:text-sm"
                        >
                          {t('featured.bookVisit')}
                        </button>
                        <button 
                          onClick={() => handleWhatsApp(plot)} 
                          className="col-span-2 py-2 rounded-lg bg-[#25D366] text-white font-semibold hover:bg-[#20bd5a] transition-colors text-center flex justify-center items-center gap-2 text-xs sm:text-sm"
                        >
                          <WhatsAppIcon size={16} /> {t('listing.enquireWhatsApp')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {!loading && properties.length > 0 && (
            <div className="mt-10 flex justify-center">
              <div className="flex items-center gap-2 bg-white dark:bg-[#12161F] p-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)} 
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-zinc-800 text-sm"
                >
                  Prev
                </button>
                <div className="px-4 font-semibold text-brand-teal text-sm">Page {page}</div>
                <button 
                  disabled={properties.length < limit} 
                  onClick={() => setPage(p => p + 1)} 
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-zinc-800 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[60] bg-black/60 md:hidden" onClick={() => setShowMobileFilters(false)}>
          <div className="absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white dark:bg-[#12161F] p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t('listing.filters')}</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">{t('listing.location')}</label>
                <select value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm">
                  <option value="">{t('listing.allLocations')}</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => { setPage(1); setShowMobileFilters(false); }} 
                className="w-full bg-brand-teal text-white py-3 rounded-xl font-bold text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Back-to-Top */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-6 right-6 w-12 h-12 bg-brand-navy dark:bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-elevated z-40 hover:bg-brand-teal transition-colors">
          <ArrowUp size={24} />
        </button>
      )}

      {!hideNavFooter && <PublicFooter />}
    </div>
  );
};
