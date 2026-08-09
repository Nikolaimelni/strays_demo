import type { ReactNode } from 'react';

export interface Segment<T extends string> {
  value: T;
  label: ReactNode;
  lang?: string;
  /* when the label is an abbreviation: "PT button" tells a screen reader
     nothing, and two letters collide with any longer label containing them */
  name?: string;
}

interface SegmentedControlProps<T extends string> {
  legend: string;
  segments: readonly Segment<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  /* clicking the selected segment clears it. right for a filter, wrong for a
     language switch, so the caller says which it is. */
  clearable?: boolean;
  size?: 'sm' | 'md';
}

// the filter bar and the language switch were the same markup with different
// labels and slightly different padding. fieldset rather than role="group".
export const SegmentedControl = <T extends string>({
  legend,
  segments,
  value,
  onChange,
  clearable = false,
  size = 'md',
}: SegmentedControlProps<T>) => {
  const padding = size === 'sm' ? 'px-2 py-1 text-xs' : 'min-h-9 px-3.5 py-1.5 text-sm';

  return (
    <fieldset className="inline-flex items-center gap-0.5 rounded-full border border-rule/15 p-0.5">
      <legend className="sr-only">{legend}</legend>
      {segments.map((segment) => {
        const active = value === segment.value;
        return (
          <button
            key={segment.value}
            type="button"
            {...(segment.lang ? { lang: segment.lang } : {})}
            {...(segment.name ? { 'aria-label': segment.name } : {})}
            aria-pressed={active}
            onClick={() => onChange(active && clearable ? undefined : segment.value)}
            className={`rounded-full font-medium transition-colors ${padding} ${
              active ? 'bg-ink text-page' : 'text-muted hover:text-ink'
            }`}
          >
            {segment.label}
          </button>
        );
      })}
    </fieldset>
  );
};
