import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button, buttonClass } from '../../shared/ui/button.tsx';
import { Field, inputClass } from '../../shared/ui/field.tsx';

const schemaFor = (withCode: boolean) =>
  z.object({
    password: z.string().min(1),
    code: withCode ? z.string().trim().min(6).max(64) : z.string(),
  });

type Values = z.infer<ReturnType<typeof schemaFor>>;

interface PasswordPromptProps {
  submitLabel: string;
  onSubmit: (values: Values) => Promise<unknown>;
  onCancel: () => void;
  withCode?: boolean;
  danger?: boolean;
}

// ending sessions, turning the second factor off and deleting the account all ask for the
// password again: a laptop left open is signed in, and it should not be enough
export const PasswordPrompt = ({
  submitLabel,
  onSubmit,
  onCancel,
  withCode = false,
  danger = false,
}: PasswordPromptProps) => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schemaFor(withCode)),
    defaultValues: { password: '', code: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4 border-l-2 border-rule/25 pl-4">
      <Field label={t('profile.confirmPassword')} error={errors.password}>
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

      {withCode ? (
        <Field label={t('profile.confirmCode')} error={errors.code}>
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
      ) : null}

      {formError ? <Alert>{formError}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={buttonClass(danger ? 'danger' : 'secondary', 'sm')}
        >
          {submitLabel}
        </button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
};
