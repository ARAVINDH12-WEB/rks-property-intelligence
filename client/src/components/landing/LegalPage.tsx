import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { PublicNavbar } from '../common/PublicNavbar.js';
import { PublicFooter } from '../common/PublicFooter.js';
import { useApp } from '../../context/AppContext.js';
import { Locale } from '../../utils/locale.js';

type Tab = 'privacy' | 'terms' | 'disclaimer';

export const LegalPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('privacy');

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  const canonicalUrl = currentLocale === 'ta' ? 'https://rksprime.com/ta/legal' : 'https://rksprime.com/legal';
  const pageTitle = currentLocale === 'ta' ? 'சட்டத் தகவல்கள் & மறுப்புரைகள் | RKS Property Hub' : 'Legal Information & Disclaimers | RKS Property Hub';
  const pageDesc = currentLocale === 'ta'
    ? 'RKS Property Hub தனியுரிமைக் கொள்கை, சேவை விதிமுறைகள் மற்றும் சொத்து பொறுப்புத்துறப்பு விபரங்கள்.'
    : 'Legal terms, privacy policy, and survey property disclaimers for RKS Property Hub.';

  return (
    <div className={`min-h-screen font-sans ${theme === 'dark' ? 'dark bg-rks-bgDark text-white' : 'bg-rks-bg text-brand-navy'}`}>
      <Helmet>
        <html lang={currentLocale} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en" href="https://rksprime.com/legal" />
        <link rel="alternate" hrefLang="ta" href="https://rksprime.com/ta/legal" />
        <link rel="alternate" hrefLang="x-default" href="https://rksprime.com/legal" />
      </Helmet>
      
      <PublicNavbar />

      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading mb-10 text-center text-brand-navy dark:text-white">
          {t('legal.title')}
        </h1>
        
        <div className="flex flex-wrap border-b border-slate-200 dark:border-zinc-800 mb-8">
          <button 
            onClick={() => setActiveTab('privacy')} 
            className={`px-6 py-3 font-semibold text-base sm:text-lg transition-colors border-b-2 ${activeTab === 'privacy' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-500 hover:text-brand-navy dark:hover:text-white'}`}
          >
            {t('legal.privacy')}
          </button>
          <button 
            onClick={() => setActiveTab('terms')} 
            className={`px-6 py-3 font-semibold text-base sm:text-lg transition-colors border-b-2 ${activeTab === 'terms' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-500 hover:text-brand-navy dark:hover:text-white'}`}
          >
            {t('legal.terms')}
          </button>
          <button 
            onClick={() => setActiveTab('disclaimer')} 
            className={`px-6 py-3 font-semibold text-base sm:text-lg transition-colors border-b-2 ${activeTab === 'disclaimer' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-500 hover:text-brand-navy dark:hover:text-white'}`}
          >
            {t('legal.disclaimer')}
          </button>
        </div>

        <div className="bg-white dark:bg-[#12161F] p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm text-slate-700 dark:text-slate-300">
          
          {activeTab === 'privacy' && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-2xl font-bold font-heading text-brand-navy dark:text-white">{t('legal.privacy')}</h2>
              <p className="text-sm text-slate-500">Last updated: 2026</p>
              <p className="leading-relaxed">
                {currentLocale === 'ta'
                  ? 'RKS Property Hub ("நாங்கள்") உங்கள் தனியுரிமையைப் பாதுகாப்பதில் முழு அர்ப்பணிப்புடன் செயல்படுகிறது. எங்கள் இணையதளத்தின் மூலம் சேகரிக்கப்படும் உங்களின் தனிப்பட்ட விவரங்கள் எவ்வாறு கையாளப்படுகின்றன என்பதை இந்த அறிக்கை விளக்குகிறது.'
                  : 'RKS Property Hub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by RKS Property Hub.'}
              </p>
              <h3 className="text-xl font-bold font-heading pt-4 text-brand-navy dark:text-white">
                {currentLocale === 'ta' ? 'நாங்கள் சேகரிக்கும் தகவல்கள்' : 'Information We Collect'}
              </h3>
              <p className="leading-relaxed">
                {currentLocale === 'ta'
                  ? 'விசாரணை படிவம், இலவச தளப் பார்வை முன்பதிவு அல்லது வாட்ஸ்அப் வழியாக நீங்கள் எங்களுக்கு வழங்கும் பெயர், தொலைபேசி எண், மின்னஞ்சல் மற்றும் விரும்பும் பட்ஜெட் ஆகியவற்றை நாங்கள் சேகரிக்கிறோம்.'
                  : 'We collect information you provide directly to us, such as when you submit an enquiry form, request a site visit, or communicate with us via email or WhatsApp. This may include your name, email address, phone number, and preferences.'}
              </p>
              <h3 className="text-xl font-bold font-heading pt-4 text-brand-navy dark:text-white">
                {currentLocale === 'ta' ? 'தகவல்களை நாங்கள் எவ்வாறு பயன்படுத்துகிறோம்' : 'How We Use Your Information'}
              </h3>
              <p className="leading-relaxed">
                {currentLocale === 'ta'
                  ? 'உங்கள் மனை கேள்விகளுக்கு பதிலளிக்க, தளப் பார்வை வாகனத்தை ஒருங்கிணைக்க மற்றும் ஆவண சரிபார்ப்பு விபரங்களை வழங்க மட்டுமே இந்தத் தகவல்கள் பயன்படுத்தப்படுகின்றன. மூன்றாம் தரப்பினருக்கு இவை விற்கப்பட மாட்டாது.'
                  : 'We use the information we collect to respond to your inquiries, schedule site visits, send you property updates, and improve our services. We do not sell or share your personal information with third parties for their marketing purposes.'}
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-2xl font-bold font-heading text-brand-navy dark:text-white">{t('legal.terms')}</h2>
              <p className="leading-relaxed">
                {currentLocale === 'ta'
                  ? 'எங்கள் தளத்தைப் பயன்படுத்துவதன் மூலம், இந்த சேவை விதிமுறைகளை நீங்கள் ஏற்றுக்கொள்கிறீர்கள்.'
                  : 'By accessing or using our website, you agree to be bound by these Terms of Service.'}
              </p>
              <h3 className="text-xl font-bold font-heading pt-4 text-brand-navy dark:text-white">
                {currentLocale === 'ta' ? 'மனை தகவல்கள் மற்றும் துல்லியம்' : 'Property Information'}
              </h3>
              <p className="leading-relaxed">
                {currentLocale === 'ta'
                  ? 'இத்தளத்தில் காட்டப்பட்டுள்ள மனை அளவுகள், சர்வே வரைபடங்கள் மற்றும் சதுர அடி விலைகள் தகவல் நோக்கங்களுக்காக மட்டுமே. துல்லியத்தை உறுதிப்படுத்தினாலும், அரசு மாற்றங்களுக்கு ஏற்ப இவை முன்கூட்டிய அறிவிப்பின்றி மாறுபடலாம்.'
                  : 'All property details, layouts, dimensions, and prices displayed on this website are for informational purposes only. While we strive for accuracy, they are subject to change without notice and do not constitute a legal offer or contract.'}
              </p>
              <h3 className="text-xl font-bold font-heading pt-4 text-brand-navy dark:text-white">
                {currentLocale === 'ta' ? 'முன்பதிவு மற்றும் பத்திரப்பதிவு' : 'Booking and Reservations'}
              </h3>
              <p className="leading-relaxed">
                {currentLocale === 'ta'
                  ? 'மனையின் முன்பதிவு முறையான டோக்கன் முன்பணம் செலுத்தி பில் பெறுவதன் மூலம் மட்டுமே உறுதி செய்யப்படும். இறுதி பத்திரப்பதிவு உரிய அரசு கட்டணங்கள் செலுத்தப்பட்ட பிறகு சார்-பதிவாளர் அலுவலகத்தில் நடைபெறும்.'
                  : 'Any booking or reservation of a plot is subject to the execution of a formal agreement and payment of the required advance amount. Registration is subject to government rules and local registrar guidelines.'}
              </p>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-2xl font-bold font-heading text-brand-navy dark:text-white">{t('legal.disclaimer')}</h2>
              <p className="leading-relaxed text-base sm:text-lg font-medium text-brand-teal">
                {currentLocale === 'ta'
                  ? 'காட்டப்படும் அனைத்து விலைகளும் வழிகாட்டுதல் விலைகள் மட்டுமே. மனை பரிமாணங்கள் அரசு சர்வே ஆவணங்களின்படி அமைந்துள்ளன. வாங்குபவர்கள் தங்களின் வழக்கறிஞர் மூலம் தனிப்பட்ட சட்ட ஆய்வு செய்து கொள்ள அறிவுறுத்தப்படுகிறார்கள்.'
                  : 'All prices shown are indicative. Plot dimensions are as per official revenue survey records. Buyers are advised to conduct independent due diligence before purchase.'}
              </p>
              <h3 className="text-xl font-bold font-heading pt-4 text-brand-navy dark:text-white">
                {t('legal.regulatoryTitle')}
              </h3>
              <p className="leading-relaxed">
                {t('legal.regulatoryText')}
              </p>
            </div>
          )}

        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
