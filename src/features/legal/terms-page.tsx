import { useTranslation } from 'react-i18next';
import { LegalPage } from './legal-page.tsx';

const SECTIONS = ['Post', 'Moderation', 'Contact', 'NoWarranty', 'Removal'] as const;

export const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.termsTitle')}
      intro={t('legal.termsIntro')}
      sections={SECTIONS.map((name) => ({
        title: t(`legal.terms${name}Title`),
        body: t(`legal.terms${name}Body`),
      }))}
    />
  );
};
