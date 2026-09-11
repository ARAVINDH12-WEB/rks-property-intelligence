import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { PropertyListingPage } from './PropertyListingPage.js';
import { PublicNavbar } from '../common/PublicNavbar.js';
import { PublicFooter } from '../common/PublicFooter.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Locale } from '../../utils/locale.js';

interface CityLandingPageProps {
  city: string;
  slug: string;
}

const cityFactsEn: Record<string, string[]> = {
  'Chennai': [
    "Fastest appreciating micro-markets: Perungalathur, Maraimalai Nagar",
    "₹1,100–₹1,300/sqft — exceptional value for metropolitan infrastructure",
    "Upcoming metro Phase 4 extension through South Chennai corridor"
  ],
  'Trichy': [
    "Rock Fort temple corridor — heritage + rapid residential growth",
    "Base rate ₹850–₹920/sqft — highest ROI potential in Tier-2 TN cities",
    "Proposed AIIMS Trichy driving medical and educational township demand"
  ],
  'Coimbatore': [
    "IT Park expansion driving residential plot demand in Kalapatti",
    "₹1,000–₹1,100/sqft — premium western ghats foothills plots",
    "Industrial growth: auto components + textile manufacturing hub"
  ],
  'Hosur': [
    "Foxconn + Tata EV factory driving explosive residential demand",
    "₹800–₹950/sqft — attractive growth window before price escalation",
    "Hosur declared a Special Economic Zone — rapid infrastructure development"
  ],
  'Hosur Road Corridor': [
    "Whitefield & Electronic City proximity — within 40 minutes drive",
    "₹1,200–₹1,400/sqft — appreciation outpacing Bengaluru city limits",
    "NH-44 and Peripheral Ring Road seamless connectivity"
  ]
};

const cityFactsTa: Record<string, string[]> = {
  'Chennai': [
    "அதிவேக வளர்ச்சி அடையும் பகுதிகள்: பெருங்களத்தூர், மறைமலை நகர்",
    "₹1,100–₹1,300/ச.அடி — மெட்ரோ நகர கட்டமைப்புக்கு ஏற்ற சிறந்த முதலீடு",
    "தென் சென்னை காரிடார் வழியே அமைய உள்ள மெட்ரோ ரயில் விரிவாக்கம்"
  ],
  'Trichy': [
    "மலைக்கோட்டை ஆன்மீக காரிடார் — கலாச்சாரம் மற்றும் குடியிருப்பு வளர்ச்சி",
    "துவக்க விலை ₹850–₹920/ச.அடி — இரண்டாம் நிலை நகரங்களில் அதிக லாபம்",
    "எய்ம்ஸ் (AIIMS) திருச்சி மற்றும் புதிய கல்வி நிறுவனங்களால் உயரும் மதிப்பு"
  ],
  'Coimbatore': [
    "காலாப்பட்டியில் IT பூங்கா விரிவாக்கம் காரணமாக வீட்டு மனைகளுக்கு பெரும் வரவேற்பு",
    "₹1,000–₹1,100/ச.அடி — இயற்கை எழில் கொஞ்சும் மலைச்சாரல் மனைகள்",
    "ஆட்டோமொபைல் உதிரிபாகங்கள் மற்றும் ஜவுளி தொழில் வளர்ச்சி மையம்"
  ],
  'Hosur': [
    "பாக்ஸ்கான் (Foxconn) மற்றும் டாடா EV தொழிற்சாலைகளால் அசுர வளர்ச்சி",
    "₹800–₹950/ச.அடி — விலை உயர்வுக்கு முன்பான சிறந்த முதலீட்டு வாய்ப்பு",
    "ஓசூர் சிறப்பு பொருளாதார மண்டலம் (SEZ) காரணமாக அதிவேக கட்டமைப்பு"
  ],
  'Hosur Road Corridor': [
    "ஒயிட்பீல்ட் மற்றும் எலக்ட்ரானிக் சிட்டிக்கு 40 நிமிட பயண தூரம்",
    "₹1,200–₹1,400/ச.அடி — பெங்களூரு எல்லைகளை விட அதிவேக வளர்ச்சி",
    "NH-44 தேசிய நெடுஞ்சாலை மற்றும் வெளிவட்ட சாலை நேரடி இணைப்பு"
  ]
};

const cityFaqsEn = [
  { q: "Is the legal documentation verified?", a: "Yes, all our plots come with verified title documents, clear Patta, and complete encumbrance certificates inspected by legal advocates." },
  { q: "Do you arrange site visits?", a: "Absolutely. We provide complimentary cab pick-up and drop for families from their doorstep for a guided tour." },
  { q: "Are there any hidden charges?", a: "No, our pricing is 100% transparent. The price covers the plot cost. Registration charges are payable as per government stamp duty norms." },
  { q: "Can I get a bank loan for plot purchase?", a: "Yes, our DTCP/Panchayat approved layouts are pre-approved for up to 75% loan funding from SBI, HDFC, and Axis Bank." }
];

const cityFaqsTa = [
  { q: "மனைகளின் சட்ட ஆவணங்கள் சரிபார்க்கப்பட்டுள்ளனவா?", a: "ஆம், எங்கள் அனைத்து மனைகளும் சரிபார்க்கப்பட்ட உரிமை ஆவணங்கள், பட்டா மற்றும் வில்லங்கச் சான்றிதழுடன் (EC) வழங்கப்படுகின்றன." },
  { q: "இலவச தளப் பார்வை ஏற்பாடு செய்யப்படுகிறதா?", a: "நிச்சயமாக. உங்கள் குடும்பத்துடன் நேரில் சென்று பார்வையிட உங்கள் வீட்டிலிருந்தே இலவச கார் வசதி செய்து தரப்படுகிறது." },
  { q: "மறைமுகக் கட்டணங்கள் ஏதேனும் உண்டா?", a: "எந்த மறைமுகக் கட்டணமும் இல்லை. சதுர அடி விலை மட்டுமே. அரசு வழிகாட்டுதல்படி பத்திரப்பதிவு கட்டணம் மட்டுமே தனி." },
  { q: "மனை வாங்குவதற்கு வங்கிக் கடன் கிடைக்குமா?", a: "ஆம், எங்கள் அங்கீகரிக்கப்பட்ட மனைகளுக்கு SBI, HDFC மற்றும் Axis வங்கிகள் மூலம் 75% வரை எளிய தவணையில் கடன் வசதி உள்ளது." }
];

export const CityLandingPage: React.FC<CityLandingPageProps> = ({ city, slug }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useApp();
  const [availableCount, setAvailableCount] = useState<number | null>(null);

  const currentLocale: Locale = i18n.language === 'ta' ? 'ta' : 'en';

  useEffect(() => {
    api.getProperties({ status: 'AVAILABLE', q: city, limit: 1 }).then(res => {
      setAvailableCount(res.pagination?.total || 0);
    }).catch(() => setAvailableCount(0));
  }, [city]);

  const facts = currentLocale === 'ta'
    ? (cityFactsTa[city] || cityFactsTa['Chennai'])
    : (cityFactsEn[city] || cityFactsEn['Chennai']);

  const faqs = currentLocale === 'ta' ? cityFaqsTa : cityFaqsEn;

  const canonicalUrl = currentLocale === 'ta' 
    ? `https://rksprime.com/ta/plots/${slug}` 
    : `https://rksprime.com/plots/${slug}`;

  const pageTitle = currentLocale === 'ta'
    ? `${city} வீட்டு மனைகள் விற்பனைக்கு | RKS Property Hub`
    : `Verified Plots in ${city} for Sale | RKS Property Hub`;

  const pageDesc = currentLocale === 'ta'
    ? `${city}ல் உடனடி கட்டுமானத்திற்கு ஏற்ற பட்டா சர்வே வீட்டு மனைகள். இலவச வாகன தளப் பார்வை வசதியுடன்.`
    : `Explore survey-verified residential plots in ${city} with clear titles, Patta verification, and complimentary cab site tours.`;

  return (
    <div className={`min-h-screen font-sans ${theme === 'dark' ? 'dark bg-rks-bgDark text-white' : 'bg-rks-bg text-brand-navy'}`}>
      <Helmet>
        <html lang={currentLocale} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en" href={`https://rksprime.com/plots/${slug}`} />
        <link rel="alternate" hrefLang="ta" href={`https://rksprime.com/ta/plots/${slug}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://rksprime.com/plots/${slug}`} />
      </Helmet>

      <PublicNavbar />
      
      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-20 bg-brand-navy text-white overflow-hidden" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 40L40 0' stroke='%230F766E' stroke-width='1' stroke-opacity='0.2'/%3E%3C/svg%3E")` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-heading mb-6 inline-block relative">
            <span className="relative z-10">{city}</span>
            <span className="absolute bottom-2 left-0 w-full h-3 bg-brand-gold/60 -z-0"></span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {currentLocale === 'ta' 
              ? `${city}ல் ${availableCount !== null ? availableCount : '...'} கிடைக்கும் பிரீமியம் மனைகள்`
              : `${availableCount !== null ? availableCount : '...'} Premium Available Plots in ${city}`}
          </p>
          <a 
            href="#listings" 
            className="inline-block bg-brand-teal text-white px-8 py-3 rounded-full font-bold text-base sm:text-lg hover:bg-brand-teal-light transition-colors shadow-elevated"
          >
            {t('cityPage.browsePlots', { city })}
          </a>
        </div>
      </section>

      {/* Why City Section */}
      <section className="py-16 bg-white dark:bg-[#12161F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10 text-brand-navy dark:text-white">
            {t('cityPage.whyInvest', { city })}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {facts.map((fact, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-zinc-800 p-6 rounded-xl border border-slate-200 dark:border-zinc-700">
                <div className="w-10 h-10 bg-brand-teal/10 text-brand-teal rounded-full flex items-center justify-center mb-4 font-bold text-xl">{idx + 1}</div>
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{fact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filtered Listing */}
      <div id="listings">
        <PropertyListingPage cityFilter={city} hideNavFooter />
      </div>

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-[#12161F]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10 text-brand-navy dark:text-white">
            {t('cityPage.faqs', { city })}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-zinc-800 p-6 rounded-xl border border-slate-200 dark:border-zinc-700">
                <h4 className="font-bold text-base sm:text-lg mb-2 text-brand-navy dark:text-white">{faq.q}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
