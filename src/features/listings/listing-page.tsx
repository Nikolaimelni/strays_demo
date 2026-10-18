import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { safeHttpUrl } from '../../shared/safe-http-url.ts';
import { Alert } from '../../shared/ui/alert.tsx';
import { Card, CardTitle } from '../../shared/ui/card.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { PhotoLightbox } from '../../shared/ui/photo-lightbox.tsx';
import { Reveal } from '../../shared/ui/reveal.tsx';
import { Skeleton } from '../../shared/ui/skeleton.tsx';
import { SinglePinMap } from '../map/single-pin-map.tsx';
import { useShelters } from '../shelters/queries.ts';
import { ListingMessage } from './listing-message.tsx';
import { useListing } from './queries.ts';
import { ReportListing } from './report-listing.tsx';
import { ShelterBadge, TypeBadge } from './status-badge.tsx';

export const ListingPage = () => {
  const { t, i18n } = useTranslation();
  const { id = '' } = useParams();
  const listing = useListing(id);
  const shelters = useShelters();
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (listing.isPending) {
    return (
      <div className="grid gap-6 border-t border-rule/15 pt-5 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
        <div className="space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="aspect-[4/3] w-60" />
          <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (listing.isError || !listing.data) {
    return <Alert>{t('errors.NOT_FOUND')}</Alert>;
  }

  const item = listing.data;
  const shelter = shelters.data?.find((candidate) => candidate.id === item.shelterId);
  const shelterSite = safeHttpUrl(shelter?.sourceUrl ?? null);
  // a feed listing links back to the animal's own page, which is part of what the shelter
  // agreed to when it handed over the feed
  const animalPage = item.source === 'FEED' ? safeHttpUrl(item.sourceUrl) : null;
  const photoAlt = t('listing.photoAlt', {
    species: t(`species.${item.species}`),
    city: item.city,
  });
  const posted = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(
    new Date(item.createdAt),
  );

  return (
    <article className="grid gap-8 border-t border-rule/15 pt-5 sm:pt-7 lg:grid-cols-[1.4fr_1fr]">
      <PageMeta
        title={`${t(`species.${item.species}`)} · ${item.city}`}
        description={item.description.slice(0, 150)}
      />
      <Reveal immediate className="min-w-0 space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <TypeBadge type={item.type} />
            {item.shelterId ? <ShelterBadge /> : null}
            <span className="text-xs uppercase tracking-[0.14em] text-muted">{posted}</span>
          </div>
          <h1 className="font-display text-title font-semibold text-balance">
            {t(`species.${item.species}`)} · {item.city}
          </h1>
        </header>

        {item.photoUrls.length > 0 ? (
          <ul className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
            {item.photoUrls.map((url, index) => (
              <li key={url} className="w-[15rem] shrink-0 snap-start sm:w-72">
                <button
                  type="button"
                  onClick={() => setLightbox(index)}
                  aria-label={t('admin.photoOf', {
                    index: index + 1,
                    total: item.photoUrls.length,
                  })}
                  className="block w-full overflow-hidden rounded-sm"
                >
                  <img
                    src={url}
                    alt={photoAlt}
                    style={index === 0 ? { viewTransitionName: 'listing-photo' } : undefined}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-105"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="max-w-prose whitespace-pre-line text-lead leading-relaxed">
          {item.description}
        </p>
      </Reveal>

      <aside className="min-w-0 space-y-7 lg:sticky lg:top-24 lg:self-start">
        {/* a shelter's animals are reached through the shelter, linked further down */}
        {item.source === 'FEED' ? null : <ListingMessage listingId={item.id} />}

        <div className="space-y-2">
          <SinglePinMap lat={item.lat} lng={item.lng} />
          <p className="text-xs text-muted">{t('listing.spotApprox')}</p>
        </div>

        <div className="space-y-2">
          <ReportListing listingId={item.id} />
          {/* for somebody without an account, or a listing that is illegal rather than
              just wrong: the notice form needs neither a sign in nor a reason list */}
          <Link
            to={`/notices?listing=${item.id}`}
            className="link-underline inline-block text-xs text-muted hover:text-ink"
          >
            {t('listing.noticeLink')}
          </Link>
        </div>

        {shelter ? (
          <Card className="pt-4">
            <CardTitle>{t('listing.fromShelter')}</CardTitle>
            <p className="mt-3 text-sm">{shelter.name}</p>
            {animalPage ? (
              <a
                className="link-underline mt-1 block text-sm text-brand"
                href={animalPage}
                target="_blank"
                rel="noreferrer"
              >
                {t('listing.sourceLink')}
              </a>
            ) : null}
            {shelterSite ? (
              <a
                className="link-underline mt-1 inline-block text-sm text-brand"
                href={shelterSite}
                target="_blank"
                rel="noreferrer"
              >
                {t('listing.shelterSite')}
              </a>
            ) : null}
          </Card>
        ) : null}
      </aside>

      {lightbox !== null ? (
        <PhotoLightbox urls={item.photoUrls} startAt={lightbox} onClose={() => setLightbox(null)} />
      ) : null}
    </article>
  );
};
