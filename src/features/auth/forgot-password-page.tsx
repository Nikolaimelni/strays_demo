import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { api } from '../../shared/api/client.ts';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { AuthPage } from './auth-page.tsx';

const schema = z.object({ email: z.email() });

type Values = z.infer<typeof schema>;

export const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const ask = useMutation({
    mutationFn: async (body: Values) => {
      const { error } = await api.POST('/auth/forgot-password', { body });
      if (error) throw error;
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
      await ask.mutateAsync(values);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <AuthPage
      title={t('auth.forgotTitle')}
      submitLabel={t('auth.forgotSubmit')}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      error={formError}
      footerTo="/login"
      footerLabel={t('auth.backToSignIn')}
      // the same answer whether or not that address has an account: the other
      // way round, this page is a way to find out who is registered
      done={ask.isSuccess ? <p className="text-sm text-muted">{t('auth.forgotSent')}</p> : null}
    >
      <Field label={t('auth.email')} error={errors.email}>
        {(control) => (
          <input
            type="email"
            autoComplete="email"
            className={inputClass}
            {...control}
            {...register('email')}
          />
        )}
      </Field>
    </AuthPage>
  );
};
