import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button } from '../../shared/ui/button.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { TypeBadge } from '../listings/status-badge.tsx';

const reportsKey = ['admin', 'reports'] as const;

export const ReportsPanel = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const reported = useQuery({
    queryKey: reportsKey,
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/reports');
      if (error) throw error;
      return data.items;
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) => {
      if (decision === 'approve') {
        const { error } = await api.POST('/admin/listings/{id}/approve', {
          params: { path: { id } },
        });
        if (error) throw error;
        return;
      }
      const { error } = await api.POST('/admin/listings/{id}/reject', {
        params: { path: { id } },
        body: {},
      });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  if (reported.isError) return <Alert>{t('errors.UNKNOWN')}</Alert>;
  if (reported.isPending) {
    return (
      <div className="grid gap-2">
        {[0, 1].map((row) => (
          <ListingCardSkeleton key={row} />
        ))}
      </div>
    );
  }
  if (reported.data.length === 0) return <EmptyState title={t('report.noneOpen')} />;

  return (
    <ul className="space-y-2">
      {reported.data.map(({ listing, reports }) => (
        <li key={listing.id} className="py-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <TypeBadge type={listing.type} />
            <span className="font-medium">{t(`species.${listing.species}`)}</span>
            <span className="text-muted">{listing.city}</span>
            <span className="rounded-full bg-lost-soft px-2 py-0.5 text-xs font-medium text-lost">
              {t('report.count', { count: reports.length })}
            </span>
            <Link to={`/listings/${listing.id}`} className="ml-auto text-sm underline">
              {t('listing.view')}
            </Link>
          </div>

          <p className="mt-1 text-sm text-muted">{listing.description}</p>

          <ul className="mt-2 space-y-1">
            {reports.map((report) => (
              <li key={report.id} className="text-xs text-muted">
                <span className="font-medium text-ink">{t(`report.reasons.${report.reason}`)}</span>
                {report.note ? ` — ${report.note}` : null}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => review.mutate({ id: listing.id, decision: 'approve' })}
            >
              {t('report.keep')}
            </Button>
            <Button size="sm" onClick={() => review.mutate({ id: listing.id, decision: 'reject' })}>
              {t('report.takeDown')}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};
