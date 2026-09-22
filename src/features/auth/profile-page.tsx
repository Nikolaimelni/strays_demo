import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { api } from '../../shared/api/client.ts';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { Skeleton } from '../../shared/ui/skeleton.tsx';
import { useLogout } from './mutations.ts';
import { sessionKey, useSession } from './session.ts';

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    repeatPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.repeatPassword, {
    path: ['repeatPassword'],
    params: { key: 'validation.passwordsDiffer' },
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export const ProfilePage = () => {
  const { t } = useTranslation();
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useLogout();

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: session.data?.name ?? '' },
  });

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const saveProfile = useMutation({
    mutationFn: async (values: ProfileValues) => {
      const { error } = await api.PATCH('/users/me', { body: { name: values.name } });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKey }),
  });

  const changePassword = useMutation({
    mutationFn: async (values: PasswordValues) => {
      const { error } = await api.POST('/users/me/password', {
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      if (error) throw error;
    },
  });

  if (session.isPending) return <Skeleton className="h-96 max-w-xl" />;

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    setProfileError(null);
    setProfileSaved(false);
    try {
      await saveProfile.mutateAsync(values);
      setProfileSaved(true);
    } catch (error) {
      setProfileError(t(errorTranslationKey(applyServerErrors(error, profileForm.setError))));
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    setPasswordError(null);
    try {
      await changePassword.mutateAsync(values);
      await logout.mutateAsync();
      await navigate('/login', { replace: true });
    } catch (error) {
      setPasswordError(t(errorTranslationKey(applyServerErrors(error, passwordForm.setError))));
    }
  });

  return (
    <div className="space-y-8">
      <PageMeta title={t('profile.title')} />
      <PageHeading index="01" title={t('profile.title')} />

      <div className="max-w-xl space-y-10 sm:pl-[4.625rem]">
        <Card className="space-y-4 pt-5">
          <CardTitle>{t('profile.details')}</CardTitle>
          <p className="text-sm text-muted">{session.data?.email}</p>

          <form onSubmit={onSaveProfile} className="space-y-4" noValidate>
            <Field label={t('auth.name')} error={profileForm.formState.errors.name}>
              {(control) => (
                <input className={inputClass} {...control} {...profileForm.register('name')} />
              )}
            </Field>

            {profileError ? <Alert>{profileError}</Alert> : null}
            {profileSaved ? (
              <p className="rounded-lg bg-found-soft px-3 py-2 text-sm text-found">
                {t('profile.saved')}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className={buttonClass()}
            >
              {t('profile.save')}
            </button>
          </form>
        </Card>

        <Card className="space-y-4 pt-5">
          <CardTitle>{t('profile.password')}</CardTitle>
          <p className="text-sm text-muted">{t('profile.passwordNote')}</p>

          <form onSubmit={onChangePassword} className="space-y-4" noValidate>
            <Field
              label={t('profile.currentPassword')}
              error={passwordForm.formState.errors.currentPassword}
            >
              {(control) => (
                <input
                  type="password"
                  autoComplete="current-password"
                  className={inputClass}
                  {...control}
                  {...passwordForm.register('currentPassword')}
                />
              )}
            </Field>

            <Field
              label={t('profile.newPassword')}
              error={passwordForm.formState.errors.newPassword}
            >
              {(control) => (
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  {...control}
                  {...passwordForm.register('newPassword')}
                />
              )}
            </Field>

            <Field
              label={t('profile.repeatPassword')}
              error={passwordForm.formState.errors.repeatPassword}
            >
              {(control) => (
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  {...control}
                  {...passwordForm.register('repeatPassword')}
                />
              )}
            </Field>

            {passwordError ? <Alert>{passwordError}</Alert> : null}

            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className={buttonClass()}
            >
              {t('profile.changePassword')}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};
