import { useTranslation } from 'react-i18next';
import { LegalPage } from './legal-page.tsx';

// the same sections, in the same order, as PRIVACY.md in the api repo, plus the one about
// the browser, which that document leaves to this one
const SECTIONS = [
  'Who',
  'What',
  'Details',
  'Processors',
  'Keep',
  'Rights',
  'Browser',
  'Children',
  'Changes',
] as const;

export const PrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.privacyTitle')}
      updated={t('legal.privacyUpdated')}
      intro={t('legal.privacyIntro')}
      sections={SECTIONS.map((name) => ({
        title: t(`legal.privacy${name}Title`),
        body: t(`legal.privacy${name}Body`),
      }))}
    />
  );
};
