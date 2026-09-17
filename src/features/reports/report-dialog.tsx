import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button } from '../../shared/ui/button.tsx';
import { inputClass, textareaClass } from '../../shared/ui/field.tsx';

const REASONS = ['INAPPROPRIATE', 'SPAM', 'WRONG_INFO', 'ALREADY_RESOLVED', 'OTHER'] as const;
type Reason = (typeof REASONS)[number];

export const ReportDialog = ({ listingId }: { listingId: string }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<Reason>('INAPPROPRIATE');
  const [note, setNote] = useState('');
  const reasonId = useId();
  const noteId = useId();

  const report = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST('/listings/{id}/reports', {
        params: { path: { id: listingId } },
        body: { reason, ...(note.trim() ? { note: note.trim() } : {}) },
      });
      if (error) throw error;
    },
  });

  if (report.isSuccess) {
    return (
      <p className="border-l-2 border-found py-1 pl-3 text-sm text-found">{t('report.thanks')}</p>
    );
  }

  return (
    <details className="group border-t border-rule/20">
      <summary className="cursor-pointer list-none py-4 text-xs uppercase tracking-[0.14em] text-muted hover:text-ink">
        {t('report.open')}
      </summary>

      <div className="space-y-4 pb-5">
        <p className="text-sm text-muted">{t('report.blurb')}</p>

        <label htmlFor={reasonId} className="block text-sm font-medium">
          {t('report.reason')}
        </label>
        <select
          id={reasonId}
          value={reason}
          onChange={(event) => setReason(event.target.value as Reason)}
          className={inputClass}
        >
          {REASONS.map((option) => (
            <option key={option} value={option}>
              {t(`report.reasons.${option}`)}
            </option>
          ))}
        </select>

        <label htmlFor={noteId} className="block text-sm font-medium">
          {t('report.note')}
        </label>
        <textarea
          id={noteId}
          rows={2}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={textareaClass}
        />

        {report.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}

        <Button variant="secondary" disabled={report.isPending} onClick={() => report.mutate()}>
          {t('report.submit')}
        </Button>
      </div>
    </details>
  );
};
