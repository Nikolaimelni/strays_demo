import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '../../shared/ui/alert.tsx';
import { EmptyState } from '../../shared/ui/empty-state.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { Reveal } from '../../shared/ui/reveal.tsx';
import { Section } from '../../shared/ui/section.tsx';
import { ListingCardSkeleton } from '../../shared/ui/skeleton.tsx';
import { ListingsMap } from '../map/listings-map.tsx';
import { useListingFilters } from './filters.ts';
import { FiltersBar } from './filters-bar.tsx';
import { Hero } from './hero.tsx';
import { ListingCard } from './listing-card.tsx';
import { Pagination } from './pagination.tsx';
import { type Bbox, useListings, usePins, useSiteStats } from './queries.ts';

const STEPS = ['One', 'Two', 'Three'] as const;

export const HomePage = () => {
  const { t } = useTranslation();
  const { filters, view, setFilters, setView } = useListingFilters();
  const [bbox, setBbox] = useState<Bbox | null>(null);

  const pins = usePins(filters, bbox);
  const listings = useListings(filters, bbox);
  const stats = useSiteStats();

  return (
    <div className="space-y-14 sm:space-y-20">
      <PageMeta title={t('feed.title')} description={t('hero.lead')} />

      <Hero
        total={stats.data?.total}
        found={stats.data?.found}
        lost={stats.data?.lost}
        adoption={stats.data?.adoption}
      />

      <Section
        index="02"
        title={t('sections.map')}
        aside={<FiltersBar filters={filters} onChange={setFilters} />}
      >
        <div id="map" className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          <Reveal className="lg:sticky lg:top-24 lg:self-start">
            <ListingsMap
              view={view}
              pins={pins.data ?? []}
              onViewChange={setView}
              onBboxChange={setBbox}
            />
            <p className="mt-2 text-xs text-muted">{t('feed.mapHint')}</p>
          </Reveal>

          <div className="min-w-0">
            {listings.isError ? <Alert>{t('errors.UNKNOWN')}</Alert> : null}

            {!listings.isError && (
              <>
                <p
                  className="border-b border-rule/15 pb-3 text-xs uppercase tracking-[0.14em] text-muted"
                  aria-live="polite"
                >
                  {listings.data ? t('feed.count', { count: listings.data.total }) : ''}
                </p>

                {listings.isPending ? (
                  <ul className="divide-y divide-rule/10">
                    {[0, 1, 2].map((row) => (
                      <li key={row} className="py-4">
                        <ListingCardSkeleton />
                      </li>
                    ))}
                  </ul>
                ) : null}

                {listings.data?.items.length === 0 ? (
                  <div className="pt-6">
                    <EmptyState title={t('feed.emptyTitle')} body={t('feed.emptyBody')} />
                  </div>
                ) : null}

                <ul className="divide-y divide-rule/10">
                  {listings.data?.items.map((listing, index) => (
                    <Reveal
                      as="li"
                      key={listing.id}
                      delay={Math.min(index, 5) * 60}
                      className="py-4 first:pt-5"
                    >
                      <ListingCard listing={listing} />
                    </Reveal>
                  ))}
                </ul>

                {listings.data ? (
                  <div className="pt-6">
                    <Pagination
                      page={listings.data.page}
                      limit={listings.data.limit}
                      total={listings.data.total}
                      onChange={(page) => {
                        setFilters({ page });
                        document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </Section>

      <Section index="03" title={t('sections.how')}>
        <Reveal className="max-w-prose text-lead text-muted">{t('sections.howLead')}</Reveal>

        <ol className="mt-8 grid gap-x-8 gap-y-9 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step} delay={index * 90} className="border-t border-rule/25 pt-4">
              <p className="section-index text-xs font-medium text-brand">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold">
                {t(`sections.step${step}Title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`sections.step${step}Body`)}
              </p>
            </Reveal>
          ))}
        </ol>
      </Section>
    </div>
  );
};
