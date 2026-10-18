import { useTranslation } from 'react-i18next';
import { LegalPage } from './legal-page.tsx';

// TERMS.md in the api repo, section for section, so the numbers a rejection email cites
// point at the same rule here
const SECTIONS = [
  'Who',
  'What',
  'Account',
  'Post',
  'Report',
  'Suspend',
  'Decisions',
  'Meeting',
  'Liability',
  'Changes',
  'Law',
] as const;

export const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.termsTitle')}
      updated={t('legal.termsUpdated')}
      intro={t('legal.termsIntro')}
      sections={SECTIONS.map((name) => ({
        title: t(`legal.terms${name}Title`),
        body: t(`legal.terms${name}Body`),
      }))}
    />
  );
};
