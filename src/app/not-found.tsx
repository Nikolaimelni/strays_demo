import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../shared/ui/button.tsx';
import { PageMeta } from '../shared/ui/page-meta.tsx';
import { Reveal } from '../shared/ui/reveal.tsx';

export const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="border-t border-rule/15 pt-5 sm:pt-7">
      <PageMeta title={t('notFound.title')} />
      <div className="grid gap-x-6 gap-y-2 sm:grid-cols-[3.5rem_1fr] sm:gap-y-4">
        <p className="section-index text-xs font-medium text-muted sm:pt-1">404</p>
        <Reveal className="max-w-prose">
          <h1 className="font-display text-display font-semibold text-balance">
            {t('notFound.title')}
          </h1>
          <p className="mt-5 text-lead text-muted">{t('notFound.body')}</p>
          <div className="mt-8">
            <ButtonLink to="/">{t('notFound.back')}</ButtonLink>
          </div>
        </Reveal>
      </div>
    </div>
  );
};
