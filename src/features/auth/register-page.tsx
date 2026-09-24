import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { AuthPage } from './auth-page.tsx';
import { useRegister } from './mutations.ts';

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

type Values = z.infer<typeof schema>;

export const RegisterPage = () => {
  const { t } = useTranslation();
  const signUp = useRegister();
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
      await signUp.mutateAsync(values);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <AuthPage
      title={t('auth.signUp')}
      submitLabel={t('auth.signUp')}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      error={formError}
      footerTo="/login"
      footerLabel={t('auth.haveAccount')}
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
