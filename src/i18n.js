import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// translation files
import enTranslation from './locales/en/translation.json';
import arTranslation from './locales/ar/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  ar: {
    translation: arTranslation,
  },
};

const applyLanguageSettings = (lng) => {
  if (!lng) return;


  if (lng === 'ar') {
    document.documentElement.classList.remove('font-kanit');
    document.documentElement.classList.add('font-Rubik');
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.classList.remove('font-Rubik');
    document.documentElement.classList.add('font-kanit');
    document.documentElement.dir = 'ltr';
  }
};

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init(
    {
      resources,
      fallbackLng: 'en',

      detection: {
        order: ['localStorage', 'navigator'],

        lookupLocalStorage: 'preferredLanguage',
        caches: ['localStorage'],
      },

      interpolation: {
        escapeValue: false,
      },
    },
    (err, t) => {
      if (err) {
        console.error('Something went wrong loading i18n:', err);
        return;
      }
      applyLanguageSettings(i18n.language);
    }
  );

i18n.on('languageChanged', (lng) => {
  console.log("Language changed to:", lng);
  applyLanguageSettings(lng);
});

export default i18n;