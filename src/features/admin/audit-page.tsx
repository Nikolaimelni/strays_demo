import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { api } from '../../shared/api/client.ts';
import type { components } from '../../shared/api/schema';
import { Alert } from '../../shared/ui/alert.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { Pagination } from '../listings/pagination.tsx';
import { AdminNav } from './admin-nav.tsx';

type Action = components['schemas']['AuditListResponseDto']['items'][number]['action'];

const LIMIT = 20;

const GOOD = 'bg-found-soft text-found';
const BAD = 'bg-lost-soft text-lost';
const PLAIN = 'bg-neutral-soft text-muted';

const ACTION_STYLES: Record<Action, string> = {
  LISTING_APPROVE: GOOD,
  LISTING_REJECT: BAD,
  LISTING_UPDATE: PLAIN,
  LISTING_DELETE: PLAIN,
  REPORT_ACTION: BAD,
  REPORT_DISMISS: PLAIN,
  USER_PROMOTE: GOOD,
  USER_DEMOTE: PLAIN,
  USER_BLOCK: BAD,
  USER_UNBLOCK: GOOD,
  USER_SESSIONS_END: PLAIN,
  USER_MFA_RESET: BAD,
  SHELTER_CONSENT_RECORD: GOOD,
  SHELTER_CONSENT_WITHDRAW: BAD,
  SHELTER_IMPORT: PLAIN,
};

// The record outlives the moderator's account on purpose, so it holds an id and never a
// name. Eight characters is enough to tell two moderators apart while reading a page.
const shortId = (id: string) => id.slice(0, 8);

const FILTERS = ['userId', 'listingId', 'shelterId'] as const;
const FILTER_LABELS = {
  userId: 'admin.auditFilterUser',
  listingId: 'admin.auditFilterListing',
  shelterId: 'admin.auditFilterShelter',
} as const;

// keyed by the filter, so following a link from one account's history to another starts
// again at page one instead of keeping a page number that may not exist there
export const AuditPage = () => {
  const [params] = useSearchParams();
  return <AuditLog key={params.toString()} params={params} />;
};

const AuditLog = ({ params }: { params: URLSearchParams }) => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);

  const filter = FILTERS.flatMap((name) => {
    const value = params.get(name);
    return value ? [{ name, value }] : [];
  })[0];

  const audit = useQuery({
    queryKey: ['admin', 'audit', filter?.name, filter?.value, page],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/audit', {
        params: {
          query: { page, limit: LIMIT, ...(filter ? { [filter.name]: filter.value } : {}) },
        },
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
      <PageHeading index="01" title={t('admin.audit')} aside={<AdminNav />} />

      <div className="space-y-5 sm:pl-[4.625rem]">
        {filter ? (
          <p className="flex flex-wrap gap-x-4 text-sm">
            <span className="text-muted">
              {t(FILTER_LABELS[filter.name], { id: shortId(filter.value) })}
            </span>
            <Link to="/admin/audit" className="link-underline text-muted hover:text-ink">
              {t('admin.auditClear')}
            </Link>
          </p>
        ) : null}

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

              <p className="flex flex-wrap gap-x-4 gap-y-1">
                {/* a deleted listing has no page left to open, and the id is the only thing
                    the record kept of it */}
                {entry.listingId && entry.action === 'LISTING_DELETE' ? (
                  <span className="section-index text-xs text-muted">
                    {shortId(entry.listingId)}
                  </span>
                ) : null}
                {entry.listingId && entry.action !== 'LISTING_DELETE' ? (
                  <Link
                    to={`/listings/${entry.listingId}`}
                    className="link-underline text-muted hover:text-ink"
                  >
                    {t('listing.view')}
                  </Link>
                ) : null}
                {entry.userId ? (
                  <Link
                    to={`/admin/audit?userId=${entry.userId}`}
                    className="link-underline text-muted hover:text-ink"
                  >
                    {t('admin.auditUser', { id: shortId(entry.userId) })}
                  </Link>
                ) : null}
                {entry.shelterId ? (
                  <Link
                    to={`/admin/audit?shelterId=${entry.shelterId}`}
                    className="link-underline text-muted hover:text-ink"
                  >
                    {t('admin.auditShelter', { id: shortId(entry.shelterId) })}
                  </Link>
                ) : null}
              </p>
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
