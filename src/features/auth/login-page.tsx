import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { AuthPage } from './auth-page.tsx';
import { MfaSignIn } from './mfa-sign-in.tsx';
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
  const [challenged, setChallenged] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { mfaRequired } = await login.mutateAsync(values);
      setChallenged(mfaRequired);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  if (challenged) {
    return (
      <MfaSignIn
        onRestart={(message) => {
          setChallenged(false);
          setFormError(message);
        }}
      />
    );
  }

  return (
    <AuthPage
      title={t('auth.signIn')}
      submitLabel={t('auth.signIn')}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      error={formError}
      footerTo="/register"
      footerLabel={t('auth.needAccount')}
      note={
        <p className="mt-3">
          <Link to="/forgot-password" className="link-underline text-sm text-muted hover:text-ink">
            {t('auth.forgotLink')}
          </Link>
        </p>
      }
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
