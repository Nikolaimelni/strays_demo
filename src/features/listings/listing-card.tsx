import { useTranslation } from 'react-i18next';
import { Link, useViewTransitionState } from 'react-router';
import type { ListingSummary } from './queries.ts';
import { ShelterBadge, TypeBadge } from './status-badge.tsx';

interface ListingCardProps {
  listing: ListingSummary;
  active?: boolean;
  onActivate?: (id: string | null) => void;
}

export const ListingCard = ({ listing, active = false, onActivate }: ListingCardProps) => {
  const { t, i18n } = useTranslation();
  const to = `/listings/${listing.id}`;
  // true only while the router is animating into this listing, which is the
  // only moment the photo needs a name to be matched on
  const morphing = useViewTransitionState(to);
  const photo = listing.photoUrls[0];

  return (
    <Link
      to={to}
      viewTransition
      onMouseEnter={() => onActivate?.(listing.id)}
      onMouseLeave={() => onActivate?.(null)}
      onFocus={() => onActivate?.(listing.id)}
      onBlur={() => onActivate?.(null)}
      className={`group @container -mx-3 flex items-start gap-4 rounded-sm px-3 py-2 outline-offset-2 transition-colors duration-300 ${
        active ? 'bg-sunken' : ''
      }`}
    >
      {photo ? (
        <div className="w-28 shrink-0 overflow-hidden rounded-sm @md:w-40">
          <img
            src={photo}
            alt={t('listing.photoAlt', {
              species: t(`species.${listing.species}`),
              city: listing.city,
            })}
            style={morphing ? { viewTransitionName: 'listing-photo' } : undefined}
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="grid aspect-[4/3] w-28 shrink-0 place-items-center rounded-sm bg-sunken text-muted @md:w-40">
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
            <title>no photo</title>
            <ellipse cx="7" cy="9" rx="2.1" ry="2.7" />
            <ellipse cx="12" cy="7" rx="2.1" ry="2.9" />
            <ellipse cx="17" cy="9" rx="2.1" ry="2.7" />
            <path d="M12 12c3 0 5.5 2.2 5.5 4.6 0 1.7-1.4 2.7-3.2 2.7-1 0-1.7-.4-2.3-.4s-1.3.4-2.3.4c-1.8 0-3.2-1-3.2-2.7C6.5 14.2 9 12 12 12Z" />
          </svg>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={listing.type} />
          {listing.shelterId ? <ShelterBadge /> : null}
          <span className="text-xs uppercase tracking-[0.12em] text-muted">
            {[listing.city, relativeDate(listing.createdAt, i18n.language)]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold leading-tight @md:text-xl">
          <span className="link-underline">{t(`species.${listing.species}`)}</span>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted @md:line-clamp-3">
          {listing.description}
        </p>
      </div>
    </Link>
  );
};

const relativeDate = (iso: string, locale: string): string => {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return '';
  const days = Math.round((parsed - Date.now()) / 86_400_000);
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day');
};
