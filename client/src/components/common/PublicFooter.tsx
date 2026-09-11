import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { WhatsAppIcon, PhoneCallIcon } from './Icons.js';
import { MapPin } from 'lucide-react';
import { getLocalizedPath, Locale } from '../../utils/locale.js';

import { BrandLogo } from './BrandLogo.js';

export const PublicFooter: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { openSiteVisitModal } = useApp();

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  const [whatsappNumber, setWhatsappNumber] = useState('+919840011223');
  const [contactPhone, setContactPhone] = useState('+91 98400 11223');
  const [contactAddress, setContactAddress] = useState('No. 42, GST Road, Guindy, Chennai, Tamil Nadu - 600032');

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res?.settings) {
          if (res.settings.whatsapp_number) setWhatsappNumber(res.settings.whatsapp_number);
          if (res.settings.contact_phone) setContactPhone(res.settings.contact_phone);
          if (res.settings.contact_address) setContactAddress(res.settings.contact_address);
        }
      })
      .catch(() => {});
  }, []);

  const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, '');
  const cleanPhone = contactPhone.replace(/[^\d+]/g, '');

  return (
    <footer className="bg-brand-navy pt-20 pb-8 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Column 1 */}
          <div>
            <div className="mb-6">
              <BrandLogo
                variant="light"
                size="md"
                showTagline={true}
                onClick={() => navigate(currentLocale === 'ta' ? '/ta' : '/')}
              />
            </div>
            <p className="text-slate-400 mb-6 max-w-sm leading-relaxed text-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              <a 
                href={`https://wa.me/${cleanWhatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-teal transition-colors"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon size={20} />
              </a>
              <a 
                href={`tel:${cleanPhone}`} 
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

          {/* Column 3 - Contact Desk */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">{t('footer.contact')}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <PhoneCallIcon size={20} className="text-brand-teal shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-white">{contactPhone}</div>
                  <div className="text-xs text-slate-400">Mon-Sat, 9AM-7PM</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-brand-teal shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                  {contactAddress}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div>&copy; {new Date().getFullYear()} RKS Property Hub. {t('footer.rights')}</div>
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
