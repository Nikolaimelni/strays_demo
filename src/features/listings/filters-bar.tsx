import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChoiceGroup } from '../../shared/ui/choice-group.tsx';
import type { ListingFilters } from './filters.ts';

interface FiltersBarProps {
  filters: ListingFilters;
  onChange: (next: Partial<ListingFilters>) => void;
}

type TypeChoice = NonNullable<ListingFilters['type']> | 'ALL';

const SPECIES = ['DOG', 'CAT', 'OTHER'] as const;

const control =
  'min-h-9 rounded-full border border-rule/15 bg-transparent px-3.5 text-sm text-ink transition-colors hover:border-rule/45';

export const FiltersBar = ({ filters, onChange }: FiltersBarProps) => {
  const { t } = useTranslation();

  // typed rather than picked, so it cannot write to the url on every keystroke:
  // a draft, committed on blur. which means it also has to notice a url it did
  // not write itself, because back and a pasted link change it underneath.
  const [draftCity, setDraftCity] = useState(filters.city ?? '');
  const [lastCity, setLastCity] = useState(filters.city);
  if (filters.city !== lastCity) {
    setLastCity(filters.city);
    setDraftCity(filters.city ?? '');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ChoiceGroup
        legend={t('filters.type')}
        name="type"
        size="sm"
        value={filters.type ?? 'ALL'}
        onChange={(type: TypeChoice) => onChange({ type: type === 'ALL' ? undefined : type })}
        choices={[
          { value: 'ALL', label: t('filters.all') },
          { value: 'FOUND', label: t('filters.found') },
          { value: 'LOST', label: t('filters.lost') },
          { value: 'ADOPTION', label: t('filters.adoption') },
        ]}
      />

      <span className="relative inline-flex items-center">
        <select
          aria-label={t('filters.species')}
          value={filters.species ?? ''}
          onChange={(event) =>
            onChange({ species: SPECIES.find((option) => option === event.target.value) })
          }
          className={`${control} appearance-none pr-9`}
        >
          <option value="">{t('filters.species')}</option>
          {SPECIES.map((species) => (
            <option key={species} value={species}>
              {t(`species.${species}`)}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className="pointer-events-none absolute right-3.5 size-2.5 fill-none stroke-current stroke-[1.5] text-muted"
        >
          <title>open</title>
          <path d="M1 1l4 4 4-4" />
        </svg>
      </span>

      <input
        aria-label={t('filters.city')}
        placeholder={t('filters.city')}
        value={draftCity}
        onChange={(event) => setDraftCity(event.target.value)}
        onBlur={(event) => onChange({ city: event.target.value.trim() || undefined })}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className={`${control} w-32 placeholder:text-muted`}
      />
    </div>
  );
};
