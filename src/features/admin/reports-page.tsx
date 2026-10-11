import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { Pagination } from '../listings/pagination.tsx';
import { StatusBadge } from '../listings/status-badge.tsx';

const LIMIT = 20;

export const ReportsPage = () => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);

  const reports = useQuery({
    queryKey: ['admin', 'reports', page],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/reports', {
        params: { query: { page, limit: LIMIT } },
      });
      if (error) throw error;
      return data;
    },
  });

  const when = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(iso));

  return (
    <div className="space-y-8">
      <PageMeta title={t('admin.reports')} />
      <PageHeading
        index="01"
        title={t('admin.reports')}
        aside={
          <Link to="/admin" className="link-underline text-sm text-muted hover:text-ink">
            {t('admin.backToQueue')}
          </Link>
        }
      />

      <div className="space-y-5 sm:pl-[4.625rem]">
        {reports.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}
        {reports.isPending ? <ListingCardSkeleton /> : null}

        <ul className="divide-y divide-rule/10 border-t border-rule/15">
          {reports.data?.items.map((report) => (
            <li key={report.id} className="space-y-2 py-5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-lost-soft px-2 py-0.5 text-xs font-medium text-lost">
                  {t(`reportReason.${report.reason}`)}
                </span>
                <StatusBadge status={report.listingStatus} />
                <span className="text-xs text-muted">{when(report.createdAt)}</span>
              </div>

              <p className="line-clamp-2 text-muted">{report.listingDescription}</p>
              {report.note ? (
                <p className="border-l-2 border-rule/25 py-0.5 pl-3 text-muted">{report.note}</p>
              ) : null}

              {/* a pending or rejected listing has no public page to open */}
              {report.listingStatus === 'APPROVED' ? (
                <Link
                  to={`/listings/${report.listingId}`}
                  className="link-underline inline-block text-muted hover:text-ink"
                >
                  {t('listing.view')}
                </Link>
              ) : null}
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
          <EmptyState title={t('admin.reportsEmpty')} />
        ) : null}
      </div>
    </div>
  );
};
