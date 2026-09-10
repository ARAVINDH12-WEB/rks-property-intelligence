import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import taTranslations from './locales/ta.json';
import { detectInitialLocale } from './utils/locale.js';

const initialLocale = detectInitialLocale();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ta: { translation: taTranslations }
    },
    lng: initialLocale,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
