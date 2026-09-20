import { useTranslation } from 'react-i18next';
import { ChoiceGroup } from '../ui/choice-group.tsx';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  return (
    <ChoiceGroup
      legend={t('nav.language')}
      name="lang"
      size="sm"
      value={i18n.resolvedLanguage === 'pt' ? 'pt' : 'en'}
      onChange={(code) => void i18n.changeLanguage(code)}
      choices={[
        { value: 'en', label: 'EN', name: 'English', lang: 'en' },
        { value: 'pt', label: 'PT', name: 'Português', lang: 'pt' },
      ]}
    />
  );
};
