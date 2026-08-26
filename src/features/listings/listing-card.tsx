import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { ListingSummary } from './queries.ts';
import { ShelterBadge, TypeBadge } from './status-badge.tsx';

export const ListingCard = ({ listing }: { listing: ListingSummary }) => {
  const { t, i18n } = useTranslation();
  const photo = listing.photoUrls[0];

  return (
    <Link to={`/listings/${listing.id}`} className="group flex items-start gap-4 outline-offset-4">
      {photo ? (
        <div className="w-28 shrink-0 overflow-hidden rounded-sm sm:w-32">
          <img
            src={photo}
            alt=""
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="grid aspect-[4/3] w-28 shrink-0 place-items-center rounded-sm bg-sunken text-muted sm:w-32">
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
        <div className="flex items-center gap-2">
          <TypeBadge type={listing.type} />
          {listing.shelterId ? <ShelterBadge /> : null}
          <span className="text-xs uppercase tracking-[0.12em] text-muted">
            {[listing.city, relativeDate(listing.createdAt, i18n.language)]
              .filter(Boolean)
              .join(' \u00b7 ')}
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold leading-tight">
          <span className="link-underline">{t(`species.${listing.species}`)}</span>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
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
