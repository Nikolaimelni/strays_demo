import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '../../shared/ui/segmented-control.tsx';
import type { ListingFilters } from './filters.ts';

interface FiltersBarProps {
  filters: ListingFilters;
  onChange: (next: Partial<ListingFilters>) => void;
}

const SPECIES = ['DOG', 'CAT', 'OTHER'] as const;

const control =
  'min-h-9 rounded-full border border-rule/15 bg-transparent px-3.5 text-sm text-ink transition-colors hover:border-rule/40';

export const FiltersBar = ({ filters, onChange }: FiltersBarProps) => {
  const { t } = useTranslation();

  // typed rather than picked, so it cannot write to the url on every
  // keystroke: a draft, committed on blur. which means it also has to notice a
  // url it did not write itself, because back, forward and a pasted link all
  // change the filter under it.
  const [draftCity, setDraftCity] = useState(filters.city ?? '');
  const [lastCity, setLastCity] = useState(filters.city);
  if (filters.city !== lastCity) {
    setLastCity(filters.city);
    setDraftCity(filters.city ?? '');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        legend={t('filters.type')}
        segments={[
          { value: 'FOUND', label: t('filters.found') },
          { value: 'LOST', label: t('filters.lost') },
          { value: 'ADOPTION', label: t('filters.adoption') },
        ]}
        value={filters.type}
        onChange={(type) => onChange({ type })}
        clearable
      />

      <select
        aria-label={t('filters.species')}
        value={filters.species ?? ''}
        // matched against the list rather than cast to it, so an unknown
        // value clears the filter instead of being waved through as a
        // species the API has never heard of
        onChange={(event) =>
          onChange({ species: SPECIES.find((option) => option === event.target.value) })
        }
        className={control}
      >
        <option value="">{t('filters.species')}</option>
        {SPECIES.map((species) => (
          <option key={species} value={species}>
            {t(`species.${species}`)}
          </option>
        ))}
      </select>

      <input
        aria-label={t('filters.city')}
        placeholder={t('filters.city')}
        value={draftCity}
        onChange={(event) => setDraftCity(event.target.value)}
        onBlur={(event) => onChange({ city: event.target.value.trim() || undefined })}
        // enter commits without hunting for somewhere else to click
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className={`${control} w-32 placeholder:text-muted`}
      />
    </div>
  );
};
