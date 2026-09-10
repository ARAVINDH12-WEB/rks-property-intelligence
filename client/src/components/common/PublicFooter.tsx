import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext.js';
import { WhatsAppIcon, PhoneCallIcon } from './Icons.js';
import { MapPin } from 'lucide-react';
import { getLocalizedPath, Locale } from '../../utils/locale.js';

export const PublicFooter: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { openSiteVisitModal } = useApp();

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  return (
    <footer className="bg-brand-navy pt-20 pb-8 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Column 1 */}
          <div>
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate(currentLocale === 'ta' ? '/ta' : '/')}>
              <span className="font-heading font-bold text-2xl text-white">RKS</span>
              <span className="font-heading font-bold text-2xl text-brand-teal">Prime</span>
            </div>
            <p className="text-slate-400 mb-6 max-w-sm leading-relaxed text-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              <a 
                href="https://wa.me/919876543210" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-teal transition-colors"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon size={20} />
              </a>
              <a 
                href="tel:+919876543210" 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-teal transition-colors"
                aria-label="Phone"
              >
                <PhoneCallIcon size={20} />
              </a>
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">{t('footer.quickLinks')}</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <button 
                  onClick={() => navigate(getLocalizedPath('/properties', currentLocale))} 
                  className="hover:text-brand-teal transition-colors"
                >
                  {t('nav.properties')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate(getLocalizedPath('/about', currentLocale))} 
                  className="hover:text-brand-teal transition-colors"
                >
                  {t('nav.about')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => openSiteVisitModal()} 
                  className="hover:text-brand-teal transition-colors"
                >
                  {t('nav.siteVisits')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate(getLocalizedPath('/contact', currentLocale))} 
                  className="hover:text-brand-teal transition-colors"
                >
                  {t('nav.contact')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">{t('footer.contact')}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <PhoneCallIcon size={20} className="text-brand-teal shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-white">+91 98765 43210</div>
                  <div className="text-xs text-slate-400">Mon-Sat, 9AM-7PM</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-brand-teal shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  RKS Prime Properties HQ<br />
                  T Nagar, Chennai<br />
                  Tamil Nadu, India 600017
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div>&copy; {new Date().getFullYear()} RKS Prime Properties. {t('footer.rights')}</div>
          <div className="flex gap-6 text-xs">
            <button onClick={() => navigate(getLocalizedPath('/legal', currentLocale))} className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </button>
            <button onClick={() => navigate(getLocalizedPath('/legal', currentLocale))} className="hover:text-white transition-colors">
              {t('footer.terms')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
