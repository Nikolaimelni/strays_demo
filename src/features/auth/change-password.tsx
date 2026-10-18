import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { api } from '../../shared/api/client.ts';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { type SessionUser, sessionKey } from './session.ts';
import { sessionsKey } from './sessions.tsx';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

type Values = z.infer<typeof schema>;

export const ChangePassword = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [changed, setChanged] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const change = useMutation({
    mutationFn: async (body: Values) => {
      const { data, error } = await api.POST('/auth/change-password', { body });
      if (error) throw error;
      return data.user;
    },
    // the server hands this browser fresh cookies and ends every other session, so the
    // list of sessions on this page is wrong the moment this resolves
    onSuccess: async (user) => {
      queryClient.setQueryData<SessionUser | null>(sessionKey, user);
      await queryClient.invalidateQueries({ queryKey: sessionsKey });
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setChanged(false);
    try {
      await change.mutateAsync(values);
      reset();
      setChanged(true);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <Card className="space-y-4 pt-5">
      <CardTitle>{t('profile.passwordTitle')}</CardTitle>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label={t('auth.currentPassword')} error={errors.currentPassword}>
          {(control) => (
            <input
              type="password"
              autoComplete="current-password"
              className={inputClass}
              {...control}
              {...register('currentPassword')}
            />
          )}
        </Field>

        <Field label={t('auth.newPassword')} error={errors.newPassword}>
          {(control) => (
            <input
              type="password"
              autoComplete="new-password"
              className={inputClass}
              {...control}
              {...register('newPassword')}
            />
          )}
        </Field>

        {formError ? <Alert>{formError}</Alert> : null}
        <p aria-live="polite" className="text-sm text-found empty:hidden">
          {changed ? t('profile.passwordChanged') : ''}
        </p>

        <button type="submit" disabled={isSubmitting} className={buttonClass('secondary')}>
          {t('profile.passwordChange')}
        </button>
      </form>
    </Card>
  );
};
