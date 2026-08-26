import { useTranslation } from 'react-i18next';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';
type ListingType = 'FOUND' | 'LOST' | 'ADOPTION';

const STATUS_STYLES: Record<Status, string> = {
  PENDING: 'bg-lost-soft text-lost',
  APPROVED: 'bg-found-soft text-found',
  REJECTED: 'bg-neutral-soft text-muted',
};

const STATUS_KEYS: Record<Status, string> = {
  PENDING: 'listing.pending',
  APPROVED: 'listing.approved',
  REJECTED: 'listing.rejected',
};

const chip = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

export const StatusBadge = ({ status }: { status: Status }) => {
  const { t } = useTranslation();
  return <span className={`${chip} ${STATUS_STYLES[status]}`}>{t(STATUS_KEYS[status])}</span>;
};

const TYPE_STYLES: Record<ListingType, string> = {
  FOUND: 'bg-found-soft text-found',
  LOST: 'bg-lost-soft text-lost',
  ADOPTION: 'bg-adopt-soft text-adopt',
};

export const TypeBadge = ({ type }: { type: ListingType }) => {
  const { t } = useTranslation();
  return (
    <span className={`${chip} ${TYPE_STYLES[type]}`}>{t(`filters.${type.toLowerCase()}`)}</span>
  );
};

export const ShelterBadge = () => {
  const { t } = useTranslation();
  return (
    <span className={`${chip} border border-rule/30 text-muted`}>{t('listing.fromShelter')}</span>
  );
};
