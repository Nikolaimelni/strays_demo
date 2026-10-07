import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { ChoiceGroup } from '../../shared/ui/choice-group.tsx';
import { Field, inputClass, textareaClass } from '../../shared/ui/field.tsx';
import { LocationPicker } from '../map/location-picker.tsx';
import { PhotoUpload } from './photo-upload.tsx';

// mirrors the backend createListingSchema. the server is still the authority,
// this only saves the round trip.
export const listingFormSchema = z.object({
  type: z.enum(['FOUND', 'LOST', 'ADOPTION']),
  species: z.enum(['DOG', 'CAT', 'OTHER']),
  description: z.string().trim().min(1).max(2000),
  city: z.string().trim().min(1).max(80),
  photoKeys: z.array(z.string()).min(1).max(6),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;

interface ListingFormProps {
  defaultValues?: Partial<ListingFormValues>;
  existingPhotoUrls?: Record<string, string>;
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => Promise<void>;
}

export const ListingForm = ({
  defaultValues,
  existingPhotoUrls = {},
  submitLabel,
  onSubmit,
}: ListingFormProps) => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: { type: 'FOUND', species: 'DOG', photoKeys: [], ...defaultValues },
  });

  // useWatch rather than watch(): the React Compiler refuses to memoize any
  // component that calls watch(), and it says so at build time
  const lat = useWatch({ control, name: 'lat' });
  const lng = useWatch({ control, name: 'lng' });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <ChoiceGroup
            legend={t('listing.type')}
            showLegend
            name={field.name}
            choices={[
              { value: 'FOUND', label: t('filters.found') },
              { value: 'LOST', label: t('filters.lost') },
              { value: 'ADOPTION', label: t('filters.adoption') },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="species"
        render={({ field }) => (
          <ChoiceGroup
            legend={t('filters.species')}
            showLegend
            name={field.name}
            choices={[
              { value: 'DOG', label: t('species.DOG') },
              { value: 'CAT', label: t('species.CAT') },
              { value: 'OTHER', label: t('species.OTHER') },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Field label={t('listing.description')} error={errors.description}>
        {(control_) => (
          <textarea
            rows={3}
            maxLength={2000}
            className={textareaClass}
            {...control_}
            {...register('description')}
          />
        )}
      </Field>

      <Field label={t('filters.city')} error={errors.city}>
        {(control_) => <input className={inputClass} {...control_} {...register('city')} />}
      </Field>

      {/* the account screen says this too, but by the time somebody is filling
          this in they have not been there for weeks */}
      <p className="border-l-2 border-rule/25 py-1 pl-3 text-sm leading-relaxed text-muted">
        {t('listing.publicNote')}
      </p>

      <Controller
        control={control}
        name="photoKeys"
        render={({ field }) => (
          <PhotoUpload
            photoKeys={field.value ?? []}
            onChange={field.onChange}
            existingUrls={existingPhotoUrls}
          />
        )}
      />
      {errors.photoKeys ? (
        <p role="alert" className="text-sm text-danger">
          {t('listing.photoRequired')}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.12em] text-muted">{t('listing.whereFound')}</p>
        <LocationPicker
          value={Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null}
          onChange={(position) => {
            setValue('lat', position.lat, { shouldValidate: true });
            setValue('lng', position.lng, { shouldValidate: true });
          }}
        />
        {errors.lat || errors.lng ? (
          <p role="alert" className="text-sm text-danger">
            {t('listing.pickSpot')}
          </p>
        ) : null}
      </div>

      {formError ? <Alert>{formError}</Alert> : null}

      <button type="submit" disabled={isSubmitting} className={buttonClass()}>
        {submitLabel}
      </button>
    </form>
  );
};
