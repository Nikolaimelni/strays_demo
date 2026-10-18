import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Field, inputClass } from '../../shared/ui/field.tsx';
import { AuthPage } from './auth-page.tsx';
import { useVerifyMfa } from './mutations.ts';

// six digits from the app, or one of the longer recovery codes, in the same box
const schema = z.object({ code: z.string().trim().min(6).max(64) });

type Values = z.infer<typeof schema>;

interface MfaSignInProps {
  onRestart: (message: string | null) => void;
}

export const MfaSignIn = ({ onRestart }: MfaSignInProps) => {
  const { t } = useTranslation();
  const verify = useVerifyMfa();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ code }) => {
    setFormError(null);
    try {
      await verify.mutateAsync(code);
    } catch (error) {
      const parsed = applyServerErrors(error, setError);
      // the challenge lives five minutes and dies after five wrong codes. past that no
      // code will ever be right again, so the only way on is the password
      if (parsed.code === 'MFA_CHALLENGE_INVALID') {
        onRestart(t(errorTranslationKey(parsed)));
        return;
      }
      setFormError(t(errorTranslationKey(parsed)));
    }
  });

  return (
    <AuthPage
      title={t('auth.mfaTitle')}
      submitLabel={t('auth.mfaSubmit')}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      error={formError}
      footerTo="/forgot-password"
      footerLabel={t('auth.forgotLink')}
      note={
        <button
          type="button"
          onClick={() => onRestart(null)}
          className="link-underline mt-3 text-sm text-muted hover:text-ink"
        >
          {t('auth.backToSignIn')}
        </button>
      }
    >
      <p className="text-sm text-muted">{t('auth.mfaNote')}</p>

      <Field label={t('auth.mfaCode')} error={errors.code}>
        {(control) => (
          <input
            type="text"
            autoComplete="one-time-code"
            spellCheck={false}
            className={inputClass}
            {...control}
            {...register('code')}
          />
        )}
      </Field>
    </AuthPage>
  );
};
