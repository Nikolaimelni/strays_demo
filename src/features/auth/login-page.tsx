import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { errorTranslationKey } from '../../shared/api/errors.ts';
import { applyServerErrors } from '../../shared/api/server-errors.ts';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { AuthPage } from './auth-page.tsx';
import { useLogin } from './mutations.ts';

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type Values = z.infer<typeof schema>;

export const LoginPage = () => {
  const { t } = useTranslation();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // no redirect here: RedirectSignedIn sends them on, back to whatever
      // RequireAuth bounced them off rather than always home
      await login.mutateAsync(values);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <AuthPage
      title={t('auth.signIn')}
      submitLabel={t('auth.signIn')}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      error={formError}
      footerTo="/register"
      footerLabel={t('auth.needAccount')}
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

      <Field label={t('auth.password')} error={errors.password}>
        {(control) => (
          <input
            type="password"
            autoComplete="current-password"
            className={inputClass}
            {...control}
            {...register('password')}
          />
        )}
      </Field>
    </AuthPage>
  );
};
