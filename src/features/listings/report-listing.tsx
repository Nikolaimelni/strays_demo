import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { errorTranslationKey, parseApiError } from '../../shared/api/errors.ts';
import type { components } from '../../shared/api/schema';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { ChoiceGroup } from '../../shared/ui/choice-group.tsx';
import { textareaClass } from '../../shared/ui/field.tsx';
import { useSession } from '../auth/session.ts';

type Reason = components['schemas']['CreateReportDto']['reason'];

const REASONS: readonly Reason[] = ['SPAM', 'SCAM', 'WRONG_INFO', 'ABUSE', 'OTHER'];

interface ReportListingProps {
  listingId: string;
}

// Approved means a moderator already read it once. This is the only thing left that says
// they should read it again, and it needs an account or it is a button for scripts.
export const ReportListing = ({ listingId }: ReportListingProps) => {
  const { t } = useTranslation();
  const { data: user } = useSession();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>('WRONG_INFO');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: async () => {
      const trimmed = note.trim();
      const { error: failed } = await api.POST('/listings/{id}/report', {
        params: { path: { id: listingId } },
        body: { reason, ...(trimmed ? { note: trimmed } : {}) },
      });
      if (failed) throw failed;
    },
    onSuccess: () => setOpen(false),
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
  });

  if (send.isSuccess) {
    return <p className="text-sm text-muted">{t('listing.reportSent')}</p>;
  }

  if (!open) {
    return user ? (
      <button
        type="button"
        className="link-underline text-sm text-muted hover:text-ink"
        onClick={() => setOpen(true)}
      >
        {t('listing.report')}
      </button>
    ) : (
      <p className="text-sm text-muted">
        <Link to="/login" state={{ from: location }} className="link-underline hover:text-ink">
          {t('auth.signIn')}
        </Link>{' '}
        {t('listing.reportSignedOut')}
      </p>
    );
  }

  return (
    <Card className="space-y-4 pt-4">
      <CardTitle>{t('listing.reportTitle')}</CardTitle>

      <ChoiceGroup
        legend={t('listing.reportReason')}
        showLegend
        name="report-reason"
        size="sm"
        value={reason}
        onChange={setReason}
        choices={REASONS.map((value) => ({ value, label: t(`reportReason.${value}`) }))}
      />

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-[0.12em] text-muted">
          {t('listing.reportNote')}
        </span>
        <textarea
          rows={2}
          maxLength={500}
          className={textareaClass}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {error ? <Alert>{error}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass('primary', 'sm')}
          disabled={send.isPending}
          onClick={() => {
            setError(null);
            send.mutate();
          }}
        >
          {t('listing.reportSubmit')}
        </button>
        <button
          type="button"
          className={buttonClass('secondary', 'sm')}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    </Card>
  );
};
