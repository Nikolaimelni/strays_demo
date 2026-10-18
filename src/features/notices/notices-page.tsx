import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { api } from '../../shared/api/client.ts';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { i18next } from '../../shared/i18n/i18n.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { Checkbox } from '../../shared/ui/checkbox.tsx';
import { Field, inputClass, textareaClass } from '../../shared/ui/field.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { Band } from '../../shared/ui/section.tsx';

// whatever somebody pastes: the page address, a share link with tracking on the end, or the
// bare id. the id is the only part the server wants
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const schema = z.object({
  listing: z
    .string()
    .trim()
    .regex(UUID, { error: () => i18next.t('notices.listingInvalid') }),
  explanation: z.string().trim().min(20).max(4000),
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  goodFaith: z.literal(true, { error: () => i18next.t('notices.goodFaithRequired') }),
});

type Values = z.infer<typeof schema>;

// article 16 of the Digital Services Act: anybody, signed in or not, can say a listing is
// illegal and has to get an answer. the in-app report button is the quicker path for
// accounts, and this is the one that cannot require one
export const NoticesPage = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: async (values: Values) => {
      const { error } = await api.POST('/notices', {
        body: {
          listingId: values.listing.match(UUID)?.[0] ?? '',
          explanation: values.explanation,
          name: values.name,
          email: values.email,
          goodFaith: values.goodFaith,
        },
      });
      if (error) throw error;
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { listing: params.get('listing') ?? '', explanation: '', name: '', email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await send.mutateAsync(values);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  return (
    <div className="border-t border-rule/15 pt-5 sm:pt-7">
      <PageMeta title={t('notices.title')} description={t('notices.intro')} />
      <Band index="01">
        <div className="max-w-prose">
          <h1 className="font-display text-title font-semibold text-balance">
            {t('notices.title')}
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-muted">{t('notices.intro')}</p>

          {send.isSuccess ? (
            <p role="status" className="mt-8 text-lead">
              {t('notices.sent')}
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
              <Field label={t('notices.listing')} error={errors.listing}>
                {(control) => (
                  <input type="text" className={inputClass} {...control} {...register('listing')} />
                )}
              </Field>
              <Field label={t('notices.explanation')} error={errors.explanation}>
                {(control) => (
                  <textarea className={textareaClass} {...control} {...register('explanation')} />
                )}
              </Field>
              <Field label={t('notices.name')} error={errors.name}>
                {(control) => (
                  <input
                    type="text"
                    autoComplete="name"
                    className={inputClass}
                    {...control}
                    {...register('name')}
                  />
                )}
              </Field>
              <Field label={t('notices.email')} error={errors.email}>
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
              <Checkbox
                label={t('notices.goodFaith')}
                error={errors.goodFaith}
                {...register('goodFaith')}
              />

              {formError ? <Alert>{formError}</Alert> : null}

              <button type="submit" disabled={isSubmitting} className={buttonClass()}>
                {t('notices.submit')}
              </button>
            </form>
          )}
        </div>
      </Band>
    </div>
  );
};
