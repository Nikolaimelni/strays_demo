import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import pt from './pt.json';
import { installValidationMessages } from './zod-messages.ts';

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, pt: { translation: pt } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt'],
    interpolation: { escapeValue: false },
    // the default detection order also reads a cookie, a session and the path.
    // narrowed to what is actually used so the privacy page can list what this
    // app puts in a browser and be exhaustive about it: one session cookie,
    // one language key, nothing else.
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

installValidationMessages();

export { i18next };
