import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { buttonClass } from '../shared/ui/button.tsx';
import { NotFound } from './not-found.tsx';

export const RouteError = () => {
  const { t } = useTranslation();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{t('routeError.title')}</h1>
      <p className="mt-1 text-sm text-muted">{t('routeError.body')}</p>
      <a href="/" className={`${buttonClass()} mt-6`}>
        {t('notFound.back')}
      </a>
    </div>
  );
};
