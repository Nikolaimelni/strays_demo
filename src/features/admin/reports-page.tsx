import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { errorTranslationKey, parseApiError } from '../../shared/api/errors.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button } from '../../shared/ui/button.tsx';
import { ChoiceGroup } from '../../shared/ui/choice-group.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { Pagination } from '../listings/pagination.tsx';
import { StatusBadge } from '../listings/status-badge.tsx';
import { AdminNav } from './admin-nav.tsx';

const LIMIT = 20;

type Status = 'OPEN' | 'ACTIONED' | 'DISMISSED';

export const ReportsPage = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('OPEN');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const reports = useQuery({
    queryKey: ['admin', 'reports', status, page],
    queryFn: async () => {
      const { data, error: failed } = await api.GET('/admin/reports', {
        params: { query: { status, page, limit: LIMIT } },
      });
      if (failed) throw failed;
      return data;
    },
  });

  // rejecting a listing closes its reports on the server, so the queue and the log can
  // both be stale after either kind of decision
  const close = useMutation({
    mutationFn: async ({ id, outcome }: { id: string; outcome: 'ACTIONED' | 'DISMISSED' }) => {
      const { error: failed } = await api.POST('/admin/reports/{id}/close', {
        params: { path: { id } },
        body: { outcome },
      });
      if (failed) throw failed;
    },
    onMutate: () => setError(null),
    onError: (failed) => setError(t(errorTranslationKey(parseApiError(failed)))),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const when = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(iso));

  return (
    <div className="space-y-8">
      <PageMeta title={t('admin.reports')} />
      <PageHeading index="01" title={t('admin.reports')} aside={<AdminNav />} />

      <div className="space-y-5 sm:pl-[4.625rem]">
        <ChoiceGroup
          legend={t('admin.reportsStatus')}
          name="report-status"
          size="sm"
          value={status}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
          choices={[
            { value: 'OPEN', label: t('admin.reportsOpen') },
            { value: 'ACTIONED', label: t('admin.reportsActioned') },
            { value: 'DISMISSED', label: t('admin.reportsDismissed') },
          ]}
        />

        {reports.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}
        {error ? <Alert>{error}</Alert> : null}
        {reports.isPending ? <ListingCardSkeleton /> : null}

        <ul className="divide-y divide-rule/10 border-t border-rule/15">
          {/* a notice comes from outside, often from somebody affected, and the law expects it
              handled diligently, so it goes to the top of whatever page it is on */}
          {[...(reports.data?.items ?? [])]
            .sort((a, b) => Number(b.notice) - Number(a.notice))
            .map((report) => (
              <li key={report.id} className="space-y-2 py-5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-lost-soft px-2 py-0.5 text-xs font-medium text-lost">
                    {t(`reportReason.${report.reason}`)}
                  </span>
                  <StatusBadge status={report.listingStatus} />
                  {report.notice ? (
                    <span className="rounded-full bg-neutral-soft px-2 py-0.5 text-xs text-ink">
                      {t('admin.reportNotice')}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted">{when(report.createdAt)}</span>
                  {report.openReportsOnListing > 1 ? (
                    <span className="text-xs text-lost">
                      {t('admin.reportOpenCount', { count: report.openReportsOnListing })}
                    </span>
                  ) : null}
                </div>

                <p className="line-clamp-2 text-muted">{report.listingDescription}</p>
                {report.note ? (
                  <p className="border-l-2 border-rule/25 py-0.5 pl-3 text-muted">{report.note}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* a pending or rejected listing has no public page to open */}
                  {report.listingStatus === 'APPROVED' ? (
                    <Link
                      to={`/listings/${report.listingId}`}
                      className="link-underline inline-block text-muted hover:text-ink"
                    >
                      {t('listing.view')}
                    </Link>
                  ) : null}

                  {report.status === 'OPEN' ? (
                    <span className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={close.isPending}
                        onClick={() => close.mutate({ id: report.id, outcome: 'ACTIONED' })}
                      >
                        {t('admin.reportAction')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={close.isPending}
                        onClick={() => close.mutate({ id: report.id, outcome: 'DISMISSED' })}
                      >
                        {t('admin.reportDismiss')}
                      </Button>
                    </span>
                  ) : report.closedAt ? (
                    <span className="text-xs text-muted">
                      {t('admin.reportClosed', { date: when(report.closedAt) })}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
        </ul>

        {reports.data ? (
          <Pagination
            page={reports.data.page}
            limit={reports.data.limit}
            total={reports.data.total}
            onChange={setPage}
          />
        ) : null}

        {reports.isSuccess && reports.data.items.length === 0 ? (
          <EmptyState title={t(status === 'OPEN' ? 'admin.reportsEmpty' : 'admin.empty')} />
        ) : null}
      </div>
    </div>
  );
};
