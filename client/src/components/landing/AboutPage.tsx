import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicNavbar } from '../common/PublicNavbar.js';
import { PublicFooter } from '../common/PublicFooter.js';
import { useApp } from '../../context/AppContext.js';
import { Shield, FileCheck, Users, TrendingUp, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { getLocalizedPath, Locale } from '../../utils/locale.js';

export const AboutPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useApp();
  const navigate = useNavigate();

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  const cities = [
    { name: 'Chennai', slug: 'chennai' },
    { name: 'Trichy', slug: 'trichy' },
    { name: 'Coimbatore', slug: 'coimbatore' },
    { name: 'Hosur', slug: 'hosur' },
    { name: 'Bangalore Corridor', slug: 'bangalore-corridor' }
  ];

  const canonicalUrl = currentLocale === 'ta' ? 'https://www.rkspropertyhub.in/ta/about' : 'https://www.rkspropertyhub.in/about';
  const pageTitle = currentLocale === 'ta' ? 'எங்களை பற்றி | RKS Property Hub' : 'About Us | RKS Property Hub';
  const pageDesc = currentLocale === 'ta'
    ? 'RKS Property Hub பற்றி அறியவும் — 500-க்கும் மேற்பட்ட ஏக்கர் தெளிவான பட்டா மனைகளை உருவாக்கி மேம்படுத்திய நிறுவனம்.'
    : 'Learn about RKS Property Hub — surveying and developing over 500 acres of prime residential communities with transparent titles.';

  return (
    <div className={`min-h-screen font-sans ${theme === 'dark' ? 'dark bg-rks-bgDark text-white' : 'bg-rks-bg text-brand-navy'}`}>
      <Helmet>
        <html lang={currentLocale} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en" href="https://www.rkspropertyhub.in/about" />
        <link rel="alternate" hrefLang="ta" href="https://www.rkspropertyhub.in/ta/about" />
        <link rel="alternate" hrefLang="x-default" href="https://www.rkspropertyhub.in/about" />
      </Helmet>
      
      <PublicNavbar />

      {/* Company Story Section */}
      <section className="pt-32 pb-20 bg-brand-navy text-white text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold font-heading mb-6">
            {t('about.storyTitle')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed">
            {t('about.storyText')}
          </p>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-white dark:bg-[#12161F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-center mb-12 text-brand-navy dark:text-white">
            {t('about.valuesTitle')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-slate-50 dark:bg-zinc-800 rounded-2xl text-center border border-slate-100 dark:border-zinc-700">
              <Shield className="w-12 h-12 text-brand-teal mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-brand-navy dark:text-white">{t('about.transparency')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t('about.transparencyDesc')}</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-zinc-800 rounded-2xl text-center border border-slate-100 dark:border-zinc-700">
              <FileCheck className="w-12 h-12 text-brand-teal mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-brand-navy dark:text-white">{t('about.clearTitles')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t('about.clearTitlesDesc')}</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-zinc-800 rounded-2xl text-center border border-slate-100 dark:border-zinc-700">
              <Users className="w-12 h-12 text-brand-teal mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-brand-navy dark:text-white">{t('about.communityFirst')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t('about.communityFirstDesc')}</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-zinc-800 rounded-2xl text-center border border-slate-100 dark:border-zinc-700">
              <TrendingUp className="w-12 h-12 text-brand-teal mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-brand-navy dark:text-white">{t('about.growthCorridors')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t('about.growthCorridorsDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Presence */}
      <section className="py-20 bg-slate-50 dark:bg-[#0A0C10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-center mb-12 text-brand-navy dark:text-white">
            {currentLocale === 'ta' ? 'எங்கள் இருப்பிடம்' : 'Our Presence Across Key Hubs'}
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {cities.map(city => (
              <div 
                key={city.slug} 
                onClick={() => navigate(getLocalizedPath(`/plots/${city.slug}`, currentLocale))}
                className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-zinc-800 rounded-full border border-slate-200 dark:border-zinc-700 cursor-pointer hover:border-brand-teal transition-colors"
              >
                <MapPin className="text-brand-teal" size={20} />
                <span className="font-semibold text-base sm:text-lg">{city.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-navy text-white text-center border-y-4 border-brand-teal">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-6">
            {currentLocale === 'ta' ? 'உங்கள் கனவு மனையை தேர்ந்தெடுக்க தயாரா?' : 'Ready to Find Your Surveyed Plot?'}
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mb-8">
            {currentLocale === 'ta' ? 'தெளிவான பட்டா ஆவணங்களுடன் கூடிய எங்கள் மனைகளை உடனே பார்வையிடுங்கள்.' : 'Browse our handpicked selection of clear-title properties ready for immediate registration.'}
          </p>
          <button 
            onClick={() => navigate(getLocalizedPath('/properties', currentLocale))} 
            className="bg-brand-teal text-white px-8 py-4 rounded-full font-bold text-base sm:text-lg hover:bg-brand-teal-light transition-colors shadow-elevated"
          >
            {t('nav.explorePlots')}
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
