import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext.js';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setLocaleCookie, switchLocalePath, getLocalizedPath, Locale } from '../../utils/locale.js';

import { BrandLogo } from './BrandLogo.js';

export const PublicNavbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, openSiteVisitModal } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  const handleSwitchLanguage = (targetLocale: Locale) => {
    if (currentLocale === targetLocale) return;
    setLocaleCookie(targetLocale);
    i18n.changeLanguage(targetLocale);
    const newPath = switchLocalePath(location.pathname + location.search + location.hash, targetLocale);
    navigate(newPath);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onExploreProperties = () => navigate(getLocalizedPath('/properties', currentLocale));

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-brand-navy/95 backdrop-blur-md shadow-luxury-dark py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <BrandLogo
            variant={isScrolled ? 'light' : 'auto'}
            size="md"
            onClick={() => navigate(currentLocale === 'ta' ? '/ta' : '/')}
          />

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={onExploreProperties} 
              className="text-white/90 hover:text-brand-teal font-medium transition-colors"
            >
              {t('nav.properties')}
            </button>
            <button 
              onClick={() => navigate(getLocalizedPath('/about', currentLocale))} 
              className="text-white/90 hover:text-brand-teal font-medium transition-colors"
            >
              {t('nav.about')}
            </button>
            <button 
              onClick={() => openSiteVisitModal()} 
              className="text-white/90 hover:text-brand-teal font-medium transition-colors"
            >
              {t('nav.siteVisits')}
            </button>
            <button 
              onClick={() => navigate(getLocalizedPath('/contact', currentLocale))} 
              className="text-white/90 hover:text-brand-teal font-medium transition-colors"
            >
              {t('nav.contact')}
            </button>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {/* EN | த Language Toggle */}
            <div className="flex items-center bg-white/10 dark:bg-black/30 backdrop-blur-sm p-0.5 rounded-full border border-white/20 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSwitchLanguage('en')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  currentLocale === 'en'
                    ? 'bg-brand-teal text-white shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <span className="text-white/40 text-[10px] select-none">|</span>
              <button
                type="button"
                onClick={() => handleSwitchLanguage('ta')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  currentLocale === 'ta'
                    ? 'bg-brand-teal text-white shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="தமிழ்"
              >
                த
              </button>
            </div>

            <button 
              onClick={toggleTheme} 
              className="p-2 text-white/90 hover:text-brand-teal transition-colors" 
              aria-label={t('nav.darkMode')}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onExploreProperties} 
              className="bg-brand-teal hover:bg-brand-teal-light text-white font-semibold px-6 py-2.5 rounded-full transition-colors shadow-elevated text-sm"
            >
              {t('nav.explorePlots')}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile EN | த Language Toggle */}
            <div className="flex items-center bg-white/10 backdrop-blur-sm p-0.5 rounded-full border border-white/20 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSwitchLanguage('en')}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  currentLocale === 'en'
                    ? 'bg-brand-teal text-white font-bold'
                    : 'text-white/80'
                }`}
              >
                EN
              </button>
              <span className="text-white/40 text-[10px] select-none">|</span>
              <button
                type="button"
                onClick={() => handleSwitchLanguage('ta')}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  currentLocale === 'ta'
                    ? 'bg-brand-teal text-white font-bold'
                    : 'text-white/80'
                }`}
              >
                த
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Slide-down */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-brand-navy border-t border-white/10 shadow-luxury-dark animate-fade-in">
          <div className="px-4 pt-2 pb-6 space-y-1 flex flex-col">
            <button 
              onClick={() => { onExploreProperties(); setMobileMenuOpen(false); }} 
              className="block w-full text-left px-3 py-3 text-white font-medium hover:bg-white/5 rounded-md"
            >
              {t('nav.properties')}
            </button>
            <button 
              onClick={() => { navigate(getLocalizedPath('/about', currentLocale)); setMobileMenuOpen(false); }} 
              className="block w-full text-left px-3 py-3 text-white font-medium hover:bg-white/5 rounded-md"
            >
              {t('nav.about')}
            </button>
            <button 
              onClick={() => { openSiteVisitModal(); setMobileMenuOpen(false); }} 
              className="block w-full text-left px-3 py-3 text-white font-medium hover:bg-white/5 rounded-md"
            >
              {t('nav.siteVisits')}
            </button>
            <button 
              onClick={() => { navigate(getLocalizedPath('/contact', currentLocale)); setMobileMenuOpen(false); }} 
              className="block w-full text-left px-3 py-3 text-white font-medium hover:bg-white/5 rounded-md"
            >
              {t('nav.contact')}
            </button>
            
            <div className="flex items-center justify-between px-3 py-3 border-t border-white/10 mt-2">
              <span className="text-white font-medium">{t('nav.language')}</span>
              <div className="flex items-center bg-white/10 p-0.5 rounded-full border border-white/20 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleSwitchLanguage('en')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    currentLocale === 'en' ? 'bg-brand-teal text-white font-bold' : 'text-white/80'
                  }`}
                >
                  EN
                </button>
                <span className="text-white/40 text-[10px] select-none">|</span>
                <button
                  type="button"
                  onClick={() => handleSwitchLanguage('ta')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    currentLocale === 'ta' ? 'bg-brand-teal text-white font-bold' : 'text-white/80'
                  }`}
                >
                  த
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-3">
              <span className="text-white font-medium">{t('nav.darkMode')}</span>
              <button onClick={toggleTheme} className="p-2 text-white bg-white/10 rounded-full">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            <button 
              onClick={() => { onExploreProperties(); setMobileMenuOpen(false); }} 
              className="block w-full text-center mt-3 px-3 py-3 bg-brand-teal text-white font-semibold rounded-full shadow-elevated"
            >
              {t('nav.explorePlots')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
