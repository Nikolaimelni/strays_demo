import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '../ui/segmented-control.tsx';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as 'en' | 'pt';

  return (
    <SegmentedControl
      legend={t('nav.language')}
      size="sm"
      segments={[
        { value: 'en', label: 'EN', lang: 'en', name: 'English' },
        { value: 'pt', label: 'PT', lang: 'pt', name: 'Português' },
      ]}
      value={current}
      onChange={(code) => code && void i18n.changeLanguage(code)}
    />
  );
};
