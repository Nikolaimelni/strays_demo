import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { z } from 'zod';
import { api } from '../../shared/api/client.ts';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { buttonClass } from '../../shared/ui/button.tsx';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { AuthPage } from './auth-page.tsx';

const schema = z.object({ password: z.string().min(8).max(72) });

type Values = z.infer<typeof schema>;

export const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  // read once into state: the url is cleared below and the token has to survive it
  const [token] = useState(() => params.get('token') ?? '');

  const [formError, setFormError] = useState<string | null>(null);

  const reset = useMutation({
    mutationFn: async (body: Values) => {
      const { error } = await api.POST('/auth/reset-password', {
        body: { token, password: body.password },
      });
      if (error) throw error;
      // the server ends every session, including this browser's
      queryClient.clear();
      setParams({}, { replace: true });
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await reset.mutateAsync(values);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  const done = () => {
    if (!token) return <p className="text-sm text-danger">{t('auth.resetNoToken')}</p>;
    if (!reset.isSuccess) return null;
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted">{t('auth.resetDone')}</p>
        <Link to="/login" className={buttonClass()}>
          {t('auth.signIn')}
        </Link>
      </div>
    );
  };

  return (
    <AuthPage
      title={t('auth.resetTitle')}
      submitLabel={t('auth.resetSubmit')}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      error={formError}
      footerTo="/login"
      footerLabel={t('auth.backToSignIn')}
      done={done()}
    >
      <Field label={t('auth.newPassword')} error={errors.password}>
        {(control) => (
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...control}
            {...register('password')}
          />
        )}
      </Field>
    </AuthPage>
  );
};
