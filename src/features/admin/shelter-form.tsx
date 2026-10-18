import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button, buttonClass } from '../../shared/ui/button.tsx';
import { Field, inputClass } from '../../shared/ui/field.tsx';

// the feed is fetched by the server, which only ever goes out over https; the site is a
// link for people and can be whatever the shelter has
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(80),
  sourceUrl: z.union([z.literal(''), z.url({ protocol: /^https?$/ })]),
  feedUrl: z.union([z.literal(''), z.url({ protocol: /^https$/ })]),
});

export type ShelterValues = z.infer<typeof schema>;

interface ShelterFormProps {
  defaultValues?: ShelterValues;
  onSubmit: (values: ShelterValues) => Promise<unknown>;
  onCancel?: () => void;
}

export const ShelterForm = ({ defaultValues, onSubmit, onCancel }: ShelterFormProps) => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShelterValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { name: '', city: '', sourceUrl: '', feedUrl: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
      if (!defaultValues) reset();
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid max-w-xl gap-4 sm:grid-cols-2">
      <Field label={t('admin.shelterName')} error={errors.name}>
        {(control) => (
          <input type="text" className={inputClass} {...control} {...register('name')} />
        )}
      </Field>
      <Field label={t('admin.shelterCity')} error={errors.city}>
        {(control) => (
          <input type="text" className={inputClass} {...control} {...register('city')} />
        )}
      </Field>
      <Field label={t('admin.shelterSite')} error={errors.sourceUrl}>
        {(control) => (
          <input type="url" className={inputClass} {...control} {...register('sourceUrl')} />
        )}
      </Field>
      <Field label={t('admin.shelterFeed')} error={errors.feedUrl}>
        {(control) => (
          <input type="url" className={inputClass} {...control} {...register('feedUrl')} />
        )}
      </Field>

      {formError ? (
        <div className="sm:col-span-2">
          <Alert>{formError}</Alert>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" disabled={isSubmitting} className={buttonClass('secondary', 'sm')}>
          {t('admin.shelterSave')}
        </button>
        {onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        ) : null}
      </div>
    </form>
  );
};
