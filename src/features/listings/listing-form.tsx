import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { errorTranslationKey } from '../../shared/api/errors.ts';
import { applyServerErrors } from '../../shared/api/server-errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { Field, inputClass } from '../../shared/ui/field.tsx';
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
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: { type: 'FOUND', species: 'DOG', photoKeys: [], ...defaultValues },
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
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Field label={t('listing.type')} error={errors.type}>
        {(control_) => (
          <select className={inputClass} {...control_} {...register('type')}>
            <option value="FOUND">{t('filters.found')}</option>
            <option value="LOST">{t('filters.lost')}</option>
            <option value="ADOPTION">{t('filters.adoption')}</option>
          </select>
        )}
      </Field>

      <Field label={t('filters.species')} error={errors.species}>
        {(control_) => (
          <select className={inputClass} {...control_} {...register('species')}>
            <option value="DOG">{t('species.DOG')}</option>
            <option value="CAT">{t('species.CAT')}</option>
            <option value="OTHER">{t('species.OTHER')}</option>
          </select>
        )}
      </Field>

      <Field label={t('listing.description')} error={errors.description}>
        {(control_) => (
          <textarea rows={4} className={inputClass} {...control_} {...register('description')} />
        )}
      </Field>

      <Field label={t('filters.city')} error={errors.city}>
        {(control_) => <input className={inputClass} {...control_} {...register('city')} />}
      </Field>

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

      <div className="space-y-1">
        <p className="text-sm font-medium">{t('listing.whereFound')}</p>
        <Controller
          control={control}
          name="lat"
          render={({ field: latField }) => (
            <Controller
              control={control}
              name="lng"
              render={({ field: lngField }) => (
                <LocationPicker
                  value={
                    typeof latField.value === 'number' && typeof lngField.value === 'number'
                      ? { lat: latField.value, lng: lngField.value }
                      : null
                  }
                  onChange={(position) => {
                    latField.onChange(position.lat);
                    lngField.onChange(position.lng);
                  }}
                />
              )}
            />
          )}
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
