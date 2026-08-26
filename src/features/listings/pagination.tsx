import { useTranslation } from 'react-i18next';
import { Button } from '../../shared/ui/button.tsx';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, limit, total, onChange }: PaginationProps) => {
  const { t } = useTranslation();
  const lastPage = Math.max(1, Math.ceil(total / limit));

  if (lastPage <= 1) return null;

  return (
    <nav className="flex items-center gap-3 text-sm" aria-label={t('feed.pagination')}>
      <Button variant="secondary" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        {t('feed.previous')}
      </Button>
      <span className="text-muted">{t('feed.pageOf', { page, lastPage })}</span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= lastPage}
      >
        {t('feed.next')}
      </Button>
    </nav>
  );
};
