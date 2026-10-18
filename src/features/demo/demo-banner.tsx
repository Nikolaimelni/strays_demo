import { useTranslation } from 'react-i18next';

// the first thing on every page of the demo, and not dismissible: a board that asks for
// listings and messages has to say up front that none of it goes anywhere
export const DemoBanner = () => {
  const { t } = useTranslation();

  return (
    <aside aria-label={t('demo.label')} className="bg-brand text-brand-ink">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-4 sm:px-6 sm:py-5">
        <p className="font-display text-xl font-semibold sm:text-2xl">{t('demo.bannerTitle')}</p>
        <p className="max-w-3xl text-sm leading-relaxed">{t('demo.bannerBody')}</p>
      </div>
    </aside>
  );
};
