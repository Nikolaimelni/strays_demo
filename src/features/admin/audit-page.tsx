import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { api } from '../../shared/api/client.ts';
import type { components } from '../../shared/api/schema';
import { Alert } from '../../shared/ui/alert.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { Pagination } from '../listings/pagination.tsx';

type Action = components['schemas']['AuditListResponseDto']['items'][number]['action'];

const LIMIT = 20;

const ACTION_STYLES: Record<Action, string> = {
  LISTING_APPROVE: 'bg-found-soft text-found',
  LISTING_REJECT: 'bg-lost-soft text-lost',
  LISTING_UPDATE: 'bg-neutral-soft text-muted',
  LISTING_DELETE: 'bg-neutral-soft text-muted',
};

// The record outlives the moderator's account on purpose, so it holds an id and never a
// name. Eight characters is enough to tell two moderators apart while reading a page.
const shortId = (id: string) => id.slice(0, 8);

export const AuditPage = () => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);

  const audit = useQuery({
    queryKey: ['admin', 'audit', page],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/audit', {
        params: { query: { page, limit: LIMIT } },
      });
      if (error) throw error;
      return data;
    },
  });

  const when = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );

  return (
    <div className="space-y-8">
      <PageMeta title={t('admin.audit')} />
      <PageHeading
        index="01"
        title={t('admin.audit')}
        aside={
          <Link to="/admin" className="link-underline text-sm text-muted hover:text-ink">
            {t('admin.backToQueue')}
          </Link>
        }
      />

      <div className="space-y-5 sm:pl-[4.625rem]">
        {audit.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}
        {audit.isPending ? <ListingCardSkeleton /> : null}

        <ul className="divide-y divide-rule/10 border-t border-rule/15">
          {audit.data?.items.map((entry) => (
            <li key={entry.id} className="space-y-2 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[entry.action]}`}
                >
                  {t(`auditAction.${entry.action}`)}
                </span>
                <span className="section-index text-xs text-muted">
                  {t('admin.auditActor', { id: shortId(entry.actorId) })}
                </span>
                <span className="text-xs text-muted">{when(entry.createdAt)}</span>
              </div>

              {entry.reason ? (
                <p className="border-l-2 border-rule/25 py-0.5 pl-3 text-muted">{entry.reason}</p>
              ) : null}

              {/* a deleted listing has no page left to open, and the id is the only thing
                  the record kept of it */}
              {entry.action === 'LISTING_DELETE' ? (
                <p className="section-index text-xs text-muted">{shortId(entry.listingId)}</p>
              ) : (
                <Link
                  to={`/listings/${entry.listingId}`}
                  className="link-underline inline-block text-muted hover:text-ink"
                >
                  {t('listing.view')}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {audit.data ? (
          <Pagination
            page={audit.data.page}
            limit={audit.data.limit}
            total={audit.data.total}
            onChange={setPage}
          />
        ) : null}

        {audit.isSuccess && audit.data.items.length === 0 ? (
          <EmptyState title={t('admin.auditEmpty')} />
        ) : null}
      </div>
    </div>
  );
};
