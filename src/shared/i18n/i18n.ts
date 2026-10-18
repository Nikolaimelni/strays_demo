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
    // app puts in a browser and be exhaustive about it. nothing is cached here:
    // a guess from the browser is not a choice, and only a choice gets stored
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: [],
    },
  });

installValidationMessages();

// written only from the switcher. storage can be switched off or full, and then the choice
// lasts until the tab closes, which is all a language preference is worth
export const rememberLanguage = (code: 'en' | 'pt') => {
  try {
    localStorage.setItem('i18nextLng', code);
  } catch {
    // nothing to do: the language is already set for this visit
  }
};

export { i18next };
