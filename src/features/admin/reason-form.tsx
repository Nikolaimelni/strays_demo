import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button, buttonClass } from '../../shared/ui/button.tsx';
import { Field, inputClass } from '../../shared/ui/field.tsx';

const schemaFor = (min: number) => z.object({ reason: z.string().trim().min(min).max(500) });

type Values = z.infer<ReturnType<typeof schemaFor>>;

interface ReasonFormProps {
  label: string;
  min?: number;
  submitLabel: string;
  onSubmit: (reason: string) => Promise<unknown>;
  onCancel: () => void;
}

// a rejection, a takedown, a block, a reset second factor and a shelter's consent all go
// into the decision log with the words typed here, and most of them go out by email to the
// person they are about. none of them is optional.
export const ReasonForm = ({
  label,
  min = 3,
  submitLabel,
  onSubmit,
  onCancel,
}: ReasonFormProps) => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schemaFor(min)) });

  const submit = handleSubmit(async ({ reason }) => {
    setFormError(null);
    try {
      await onSubmit(reason);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-3 border-l-2 border-rule/25 pl-4">
      <Field label={label} error={errors.reason}>
        {(control) => (
          <input type="text" className={inputClass} {...control} {...register('reason')} />
        )}
      </Field>
      {formError ? <Alert>{formError}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSubmitting} className={buttonClass('secondary', 'sm')}>
          {submitLabel}
        </button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
};
