import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { ButtonLink } from '../../shared/ui/button.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { Band } from '../../shared/ui/section.tsx';
import { Skeleton } from '../../shared/ui/skeleton.tsx';

export const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const token = params.get('token') ?? '';

  // a POST behind a query key on purpose: the token arrives in the url and the
  // call has to fire once for it, not again on a retry or a strict-mode
  // remount. a mutation in an effect does both.
  const confirmed = useQuery({
    queryKey: ['verify-email', token],
    enabled: token !== '',
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const { error } = await api.POST('/auth/verify-email', { body: { token } });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      return true;
    },
  });

  return (
    <div className="border-t border-rule/15 pt-5 sm:pt-7">
      <PageMeta title={t('verifyEmail.title')} />
      <Band index="01">
        <div className="max-w-prose">
          <h1 className="font-display text-title font-semibold">{t('verifyEmail.title')}</h1>

          <div className="mt-6 space-y-5">
            {confirmed.isPending && token ? <Skeleton className="h-6 w-48" /> : null}

            {confirmed.isSuccess ? (
              <p className="text-lead text-muted">{t('verifyEmail.ok')}</p>
            ) : null}

            {!token || confirmed.isError ? <Alert>{t('verifyEmail.failed')}</Alert> : null}

            <ButtonLink to="/profile">{t('verifyEmail.toAccount')}</ButtonLink>
          </div>
        </div>
      </Band>
    </div>
  );
};
