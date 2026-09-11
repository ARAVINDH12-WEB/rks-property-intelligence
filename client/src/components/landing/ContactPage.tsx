import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { PublicNavbar } from '../common/PublicNavbar.js';
import { PublicFooter } from '../common/PublicFooter.js';
import { useApp } from '../../context/AppContext.js';
import { Phone, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { WhatsAppIcon } from '../common/Icons.js';
import { api } from '../../services/api.js';
import { Locale } from '../../utils/locale.js';

export const ContactPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useApp();
  
  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    budget: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [whatsappNumber, setWhatsappNumber] = useState('+919840011223');
  const [contactPhone, setContactPhone] = useState('+91 98400 11223');
  const [contactEmail, setContactEmail] = useState('info@rksgroup.in');
  const [contactAddress, setContactAddress] = useState('No. 42, GST Road, Guindy, Chennai, Tamil Nadu - 600032');

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res?.settings) {
          if (res.settings.whatsapp_number) setWhatsappNumber(res.settings.whatsapp_number);
          if (res.settings.contact_phone) setContactPhone(res.settings.contact_phone);
          if (res.settings.contact_email) setContactEmail(res.settings.contact_email);
          if (res.settings.contact_address) setContactAddress(res.settings.contact_address);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.name.trim()) return setErrorMsg(currentLocale === 'ta' ? 'பெயர் அவசியமானது' : 'Name is required');
    if (!/^\d{10}$/.test(formData.phone.trim())) return setErrorMsg(currentLocale === 'ta' ? 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்' : 'Please enter a valid 10-digit phone number');

    setLoading(true);
    try {
      const notes = `City: ${formData.city}\nBudget: ${formData.budget}\nMessage: ${formData.message}`;
      await api.postLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        source: 'WEBSITE',
        notes: notes.trim()
      });
      
      setSuccessMsg(t('contact.success'));
      setFormData({ name: '', phone: '', email: '', city: '', budget: '', message: '' });
    } catch (err: any) {
      setErrorMsg(err.message || t('contact.error'));
    } finally {
      setLoading(false);
    }
  };

  const canonicalUrl = currentLocale === 'ta' ? 'https://rksprime.com/ta/contact' : 'https://rksprime.com/contact';
  const pageTitle = currentLocale === 'ta' ? 'தொடர்பு கொள்ள | RKS Prime Properties' : 'Contact Us | RKS Prime Properties';
  const pageDesc = currentLocale === 'ta'
    ? 'மனை விசாரணைகள், பட்டா ஆவண சரிபார்ப்பு மற்றும் இலவச வாகன தளப் பார்வைக்கு எங்கள் ஆலோசகர்களை அணுகவும்.'
    : 'Get in touch with RKS Prime Properties advisors for property inquiries, legal verification, and free cab site visits.';

  return (
    <div className={`min-h-screen font-sans ${theme === 'dark' ? 'dark bg-rks-bgDark text-white' : 'bg-rks-bg text-brand-navy'}`}>
      <Helmet>
        <html lang={currentLocale} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en" href="https://rksprime.com/contact" />
        <link rel="alternate" hrefLang="ta" href="https://rksprime.com/ta/contact" />
        <link rel="alternate" hrefLang="x-default" href="https://rksprime.com/contact" />
      </Helmet>
      
      <PublicNavbar />

      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading mb-4 text-brand-navy dark:text-white">
            {t('contact.heading')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Left Column: Contact Info */}
          <div className="bg-brand-navy text-white p-8 sm:p-10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand-teal rounded-full blur-3xl opacity-20"></div>
            
            <h3 className="text-2xl font-bold font-heading mb-8">
              {currentLocale === 'ta' ? 'நேரடி தொடர்பு விவரங்கள்' : 'Direct Contact Information'}
            </h3>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-full text-brand-teal shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Phone & WhatsApp</h4>
                  <p className="text-slate-300 text-lg">{contactPhone}</p>
                  <p className="text-slate-400 text-sm">Mon-Sat, 9AM to 7PM</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-full text-brand-teal shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Email Desk</h4>
                  <p className="text-slate-300 text-lg">{contactEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-full text-brand-teal shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {currentLocale === 'ta' ? 'தலைமை அலுவலகம்' : 'Headquarters'}
                  </h4>
                  <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line">
                    {contactAddress}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <a 
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('whatsapp.general'))}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-6 rounded-xl font-bold transition-colors shadow-elevated"
              >
                <WhatsAppIcon size={20} />
                {t('siteVisitBanner.whatsappBtn')}
              </a>
            </div>
          </div>

          {/* Right Column: Enquiry Form */}
          <div className="bg-white dark:bg-[#12161F] p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-2xl font-bold font-heading mb-6 text-brand-navy dark:text-white">
              {currentLocale === 'ta' ? 'மனை விசாரணை படிவம்' : 'Send us an Enquiry'}
            </h3>

            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-3">
                <CheckCircle className="shrink-0" size={20} />
                <p className="text-sm">{successMsg}</p>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3">
                <AlertCircle className="shrink-0" size={20} />
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('contact.fullName')} *
                </label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-teal focus:outline-none" 
                  placeholder={currentLocale === 'ta' ? 'உங்கள் பெயர்' : 'e.g. Arun Kumar'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('contact.phone')} *
                  </label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    required 
                    maxLength={10} 
                    className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-teal focus:outline-none" 
                    placeholder="9840012345" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('contact.email')}
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-teal focus:outline-none" 
                    placeholder="arun@gmail.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('contact.preferredCity')}
                  </label>
                  <select 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-teal focus:outline-none"
                  >
                    <option value="">{t('listing.allLocations')}</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Trichy">Trichy</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Hosur">Hosur</option>
                    <option value="Bangalore Corridor">Bangalore Corridor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('contact.budgetRange')}
                  </label>
                  <select 
                    name="budget" 
                    value={formData.budget} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-teal focus:outline-none"
                  >
                    <option value="">{currentLocale === 'ta' ? 'பட்ஜெட் தேர்வு செய்க' : 'Select Budget'}</option>
                    <option value="Under 15L">{currentLocale === 'ta' ? '₹15 லட்சத்திற்குள்' : 'Under 15 Lakhs'}</option>
                    <option value="15L - 30L">{currentLocale === 'ta' ? '₹15L - ₹30 லட்சம்' : '15 Lakhs - 30 Lakhs'}</option>
                    <option value="30L - 50L">{currentLocale === 'ta' ? '₹30L - ₹50 லட்சம்' : '30 Lakhs - 50 Lakhs'}</option>
                    <option value="50L - 1Cr">{currentLocale === 'ta' ? '₹50L - ₹1 கோடி' : '50 Lakhs - 1 Crore'}</option>
                    <option value="Above 1Cr">{currentLocale === 'ta' ? '₹1 கோடிக்கு மேல்' : 'Above 1 Crore'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('contact.message')}
                </label>
                <textarea 
                  name="message" 
                  rows={4} 
                  value={formData.message} 
                  onChange={handleChange} 
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-teal focus:outline-none" 
                  placeholder={currentLocale === 'ta' ? 'நீங்கள் விரும்பும் மனை அளவு, திசை அல்லது வினாக்கள்...' : 'Specify plot size, facing preferences, or questions...'}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-brand-teal hover:bg-brand-teal-light text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-elevated disabled:opacity-50 text-sm"
              >
                {loading ? t('contact.submitting') : t('contact.submit')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
