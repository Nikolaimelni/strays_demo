import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useDocumentLanguage = () => {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'en';

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
};
