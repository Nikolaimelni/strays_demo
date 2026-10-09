import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../shared/api/client.ts';
import { errorTranslationKey, parseApiError } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { Skeleton } from '../../shared/ui/skeleton.tsx';
import { AccountData } from './account-data.tsx';
import { useSession } from './session.ts';

export const ProfilePage = () => {
  const { t } = useTranslation();
  const session = useSession();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resend = useMutation({
    mutationFn: async () => {
      const { error: failed } = await api.POST('/auth/verify-email/resend');
      if (failed) throw failed;
    },
    onSuccess: () => setSent(true),
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
  });

  if (session.isPending) return <Skeleton className="h-96 max-w-xl" />;

  const user = session.data;

  return (
    <div className="space-y-8">
      <PageMeta title={t('profile.title')} />
      <PageHeading index="01" title={t('profile.title')} />

      <div className="max-w-xl space-y-10 sm:pl-[4.625rem]">
        <Card className="space-y-4 pt-5">
          <CardTitle>{t('profile.email')}</CardTitle>
          <p className="text-sm">{user?.email}</p>

          {user?.emailVerified ? (
            <p className="inline-block rounded-lg bg-found-soft px-3 py-2 text-sm text-found">
              {t('profile.emailConfirmed')}
            </p>
          ) : (
            <div className="space-y-3">
              <Alert>{t('profile.emailPending')}</Alert>
              {sent ? (
                <p className="text-sm text-muted">{t('profile.emailResent')}</p>
              ) : (
                <button
                  type="button"
                  className={buttonClass('secondary')}
                  disabled={resend.isPending}
                  onClick={() => resend.mutate()}
                >
                  {t('profile.emailResend')}
                </button>
              )}
              {error ? <Alert>{error}</Alert> : null}
            </div>
          )}
        </Card>

        <AccountData />
      </div>
    </div>
  );
};
