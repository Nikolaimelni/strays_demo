import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { api } from '../../shared/api/client.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { ButtonLink } from '../../shared/ui/button.tsx';
import { ConfirmButton } from '../../shared/ui/confirm-button.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { Reveal } from '../../shared/ui/reveal.tsx';
import { PageHeading } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { StatusBadge, TypeBadge } from './status-badge.tsx';

const myListingsKey = ['listings', 'mine'] as const;

export const MyListingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mine = useQuery({
    queryKey: myListingsKey,
    queryFn: async () => {
      const { data, error } = await api.GET('/listings/mine');
      if (error) throw error;
      return data.items;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/listings/{id}', { params: { path: { id } } });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myListingsKey }),
  });

  return (
    <div className="space-y-8">
      <PageMeta title={t('nav.mine')} />
      <PageHeading
        index="01"
        title={t('nav.mine')}
        aside={
          <ButtonLink to="/new" size="sm">
            {t('nav.post')}
          </ButtonLink>
        }
      />

      <div className="sm:pl-[4.625rem]">
        {mine.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}

        {mine.isPending ? (
          <ul className="divide-y divide-rule/10">
            {[0, 1].map((row) => (
              <li key={row} className="py-4">
                <ListingCardSkeleton />
              </li>
            ))}
          </ul>
        ) : null}

        {mine.data?.length === 0 ? (
          <EmptyState
            title={t('listing.noneYet')}
            action={<ButtonLink to="/new">{t('nav.post')}</ButtonLink>}
          />
        ) : null}

        <ul className="divide-y divide-rule/10">
          {mine.data?.map((listing, index) => (
            <Reveal
              as="li"
              key={listing.id}
              delay={Math.min(index, 5) * 60}
              className="flex flex-wrap items-start gap-x-4 gap-y-3 py-5 first:pt-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={listing.type} />
                  <StatusBadge status={listing.status} />
                </div>
                <h2 className="mt-2 font-display text-lg font-semibold leading-tight">
                  {t(`species.${listing.species}`)} · {listing.city}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                  {listing.description}
                </p>
                {listing.rejectionReason ? (
                  <p className="mt-2 border-l-2 border-lost py-0.5 pl-3 text-sm text-lost">
                    {listing.rejectionReason}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-4 text-sm">
                {listing.status === 'APPROVED' ? (
                  <Link
                    to={`/listings/${listing.id}`}
                    className="link-underline text-muted hover:text-ink"
                  >
                    {t('listing.view')}
                  </Link>
                ) : null}
                <Link
                  to={`/listings/${listing.id}/edit`}
                  className="link-underline text-muted hover:text-ink"
                >
                  {t('listing.edit')}
                </Link>
                <ConfirmButton
                  label={t('listing.delete')}
                  disabled={remove.isPending}
                  onConfirm={() => remove.mutate(listing.id)}
                />
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </div>
  );
};
