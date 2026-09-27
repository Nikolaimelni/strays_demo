import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { z } from 'zod';
import { api } from '../../shared/api/client.ts';
import { applyServerErrors, errorTranslationKey } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { Field, inputClass, textareaClass } from '../../shared/ui/field.tsx';
import { Skeleton } from '../../shared/ui/skeleton.tsx';
import { type SessionUser, useSession } from '../auth/session.ts';

const schema = z.object({
  message: z.string().trim().min(10).max(2000),
  email: z.email(),
});

type Values = z.infer<typeof schema>;

interface ListingMessageProps {
  listingId: string;
}

// a listing carries no name and no number. somebody who recognises the animal writes here,
// the server mails it to the owner with this address to reply to, and keeps no copy. so the
// only address anybody learns is the one the writer chose to hand over
export const ListingMessage = ({ listingId }: ListingMessageProps) => {
  const { t } = useTranslation();
  const { data: user, isPending } = useSession();
  const location = useLocation();

  return (
    <Card className="pt-4">
      <CardTitle>{t('listing.messageTitle')}</CardTitle>

      {isPending ? <Skeleton className="mt-3 h-24 w-full" /> : null}

      {!isPending && !user ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted">{t('listing.messageSignedOut')}</p>
          <Link to="/login" state={{ from: location }} className={buttonClass('secondary', 'sm')}>
            {t('auth.signIn')}
          </Link>
        </div>
      ) : null}

      {user && !user.emailVerified ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted">{t('listing.messageNeedsEmail')}</p>
          <Link to="/profile" className={buttonClass('secondary', 'sm')}>
            {t('verifyEmail.toAccount')}
          </Link>
        </div>
      ) : null}

      {user?.emailVerified ? <MessageForm listingId={listingId} user={user} /> : null}
    </Card>
  );
};

const MessageForm = ({ listingId, user }: { listingId: string; user: SessionUser }) => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: async (body: Values) => {
      const { error } = await api.POST('/listings/{id}/message', {
        params: { path: { id: listingId } },
        body,
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
    defaultValues: { message: '', email: user.email },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await send.mutateAsync(values);
    } catch (error) {
      setFormError(t(errorTranslationKey(applyServerErrors(error, setError))));
    }
  });

  if (send.isSuccess) {
    return (
      <p role="status" className="mt-3 text-sm text-found">
        {t('listing.messageSent')}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-3 space-y-4">
      <Field label={t('listing.messageBody')} error={errors.message}>
        {(control) => <textarea className={textareaClass} {...control} {...register('message')} />}
      </Field>
      <Field label={t('listing.messageEmail')} error={errors.email}>
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
      <p className="text-xs text-muted">{t('listing.messageNote')}</p>
      {formError ? <Alert>{formError}</Alert> : null}
      <button type="submit" disabled={isSubmitting} className={buttonClass('secondary', 'sm')}>
        {t('listing.messageSend')}
      </button>
    </form>
  );
};
