import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../shared/api/client.ts';
import type { components } from '../../shared/api/schema';
import { Alert } from '../../shared/ui/alert.tsx';
import { Button } from '../../shared/ui/button.tsx';
import { ChoiceGroup } from '../../shared/ui/choice-group.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { inputClass } from '../../shared/ui/field.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PhotoLightbox } from '../../shared/ui/photo-lightbox.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { Pagination } from '../listings/pagination.tsx';
import { ShelterBadge, TypeBadge } from '../listings/status-badge.tsx';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';
type ListingRow = components['schemas']['ListingDetailListResponseDto']['items'][number];

const LIMIT = 20;

const daysWaiting = (createdAt: string) =>
  Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);

export const ModerationPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('PENDING');
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState<string[] | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  // a set of ids rather than a snapshot of the list: two decisions in a row
  // snapshotted each other, so one failing put the other's row back and undid
  // a removal that had worked
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());

  const listings = useQuery({
    queryKey: ['admin', 'listings', status, page],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/listings', {
        params: { query: { status, page, limit: LIMIT } },
      });
      if (error) throw error;
      return data;
    },
  });

  const forget = (id: string) =>
    setRemoved((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });

  const review = useMutation({
    mutationFn: async ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: 'approve' | 'reject';
      note?: string;
    }) => {
      if (decision === 'approve') {
        const { error } = await api.POST('/admin/listings/{id}/approve', {
          params: { path: { id } },
        });
        if (error) throw error;
        return;
      }
      const { error } = await api.POST('/admin/listings/{id}/reject', {
        params: { path: { id } },
        body: note ? { reason: note } : {},
      });
      if (error) throw error;
    },
    onMutate: ({ id }) => setRemoved((current) => new Set(current).add(id)),
    onError: (_error, { id }) => forget(id),
    onSettled: async (_data, _error, { id }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
      forget(id);
    },
  });

  const switchBucket = (next: Status) => {
    setStatus(next);
    setPage(1);
  };

  const rows = (listings.data?.items ?? []).filter((row) => !removed.has(row.id));

  return (
    <div className="space-y-8">
      <PageMeta title={t('nav.admin')} />
      <PageHeading index="01" title={t('nav.admin')} />

      <div className="space-y-5 sm:pl-[4.625rem]">
        <ChoiceGroup
          legend={t('nav.admin')}
          name="bucket"
          size="sm"
          value={status}
          onChange={switchBucket}
          choices={[
            { value: 'PENDING', label: t('listing.pending') },
            { value: 'APPROVED', label: t('listing.approved') },
            { value: 'REJECTED', label: t('listing.rejected') },
          ]}
        />

        {listings.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}
        {listings.isPending ? (
          <div className="grid gap-2">
            {[0, 1].map((row) => (
              <ListingCardSkeleton key={row} />
            ))}
          </div>
        ) : null}

        <ul className="divide-y divide-rule/10 border-t border-rule/15">
          {rows.map((listing: ListingRow) => (
            <li key={listing.id} className="py-5">
              <div className="flex gap-3">
                {listing.photoUrls[0] ? (
                  <button
                    type="button"
                    onClick={() => setLightbox(listing.photoUrls)}
                    aria-label={t('admin.viewPhotos')}
                    className="relative w-24 shrink-0 overflow-hidden rounded-sm focus-visible:outline-2"
                  >
                    <img
                      src={listing.photoUrls[0]}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                    {listing.photoUrls.length > 1 ? (
                      <span className="absolute bottom-1 right-1 rounded bg-ink/70 px-1 text-xs text-page">
                        {listing.photoUrls.length}
                      </span>
                    ) : null}
                  </button>
                ) : (
                  <div className="aspect-[4/3] w-24 shrink-0 rounded-sm bg-sunken" />
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={listing.type} />
                    {listing.shelterId ? <ShelterBadge /> : null}
                    <span className="font-medium">{t(`species.${listing.species}`)}</span>
                    <span className="text-muted">{listing.city}</span>
                    {status === 'PENDING' ? (
                      <span className="text-xs text-muted">
                        {t('admin.waiting', { days: daysWaiting(listing.createdAt) })}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-muted">{listing.description}</p>
                  <p className="mt-2 text-xs text-muted">{listing.source}</p>
                  {listing.rejectionReason ? (
                    <p className="mt-1 text-xs text-muted">{listing.rejectionReason}</p>
                  ) : null}
                </div>
              </div>

              {status === 'PENDING' ? (
                <div className="mt-3 space-y-2">
                  {rejecting === listing.id ? (
                    <div className="space-y-2">
                      <label className="block text-xs text-muted" htmlFor={`reason-${listing.id}`}>
                        {t('admin.rejectReason')}
                      </label>
                      <input
                        id={`reason-${listing.id}`}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        className={inputClass}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            review.mutate({ id: listing.id, decision: 'reject', note: reason });
                            setRejecting(null);
                            setReason('');
                          }}
                        >
                          {t('admin.rejectConfirm')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setRejecting(null);
                            setReason('');
                          }}
                        >
                          {t('admin.rejectCancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => review.mutate({ id: listing.id, decision: 'approve' })}
                      >
                        {t('admin.approve')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRejecting(listing.id);
                          setReason('');
                        }}
                      >
                        {t('admin.reject')}
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        {listings.data ? (
          <Pagination
            page={page}
            limit={LIMIT}
            total={listings.data.total}
            onChange={(next) => setPage(next)}
          />
        ) : null}

        {listings.isSuccess && rows.length === 0 ? <EmptyState title={t('admin.empty')} /> : null}

        {lightbox ? <PhotoLightbox urls={lightbox} onClose={() => setLightbox(null)} /> : null}
      </div>
    </div>
  );
};
