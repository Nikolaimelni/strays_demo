import { useTranslation } from 'react-i18next';
import { LegalPage } from './legal-page.tsx';

const SECTIONS = [
  'Who',
  'What',
  'Public',
  'Basis',
  'Third',
  'Keep',
  'Browser',
  'Ai',
  'Rights',
] as const;

export const PrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.privacyTitle')}
      intro={t('legal.privacyIntro')}
      sections={SECTIONS.map((name) => ({
        title: t(`legal.privacy${name}Title`),
        body: t(`legal.privacy${name}Body`),
      }))}
    />
  );
};
