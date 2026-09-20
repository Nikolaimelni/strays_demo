import type { ReactNode } from 'react';

interface Choice<T extends string> {
  value: T;
  label: ReactNode;
  name?: string;
  lang?: string;
}

interface ChoiceGroupProps<T extends string> {
  legend: string;
  showLegend?: boolean;
  name: string;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

// real radios under the chips, not buttons with aria-pressed: arrow keys, the
// grouping and the one-of-many rule are then the browser's problem, not ours
export const ChoiceGroup = <T extends string>({
  legend,
  showLegend = false,
  name,
  choices,
  value,
  onChange,
  size = 'md',
}: ChoiceGroupProps<T>) => (
  <fieldset className="min-w-0">
    <legend className={showLegend ? 'text-xs uppercase tracking-[0.12em] text-muted' : 'sr-only'}>
      {legend}
    </legend>
    <div className={`flex flex-wrap gap-1.5 ${showLegend ? 'mt-2' : ''}`}>
      {choices.map((choice) => (
        <label key={choice.value} className="relative inline-flex">
          {/* the input is the chip's own hit area rather than sr-only: a
              zero-size control is one a pointer never lands on, which is also
              why playwright could not check it */}
          <input
            type="radio"
            name={name}
            value={choice.value}
            checked={value === choice.value}
            onChange={() => onChange(choice.value)}
            {...(choice.name ? { 'aria-label': choice.name } : {})}
            {...(choice.lang ? { lang: choice.lang } : {})}
            className="peer absolute inset-0 z-10 cursor-pointer appearance-none rounded-full opacity-0"
          />
          <span
            className={`inline-flex items-center rounded-full border border-rule/15 transition-colors peer-hover:border-rule/45 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-page peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-brand ${
              size === 'sm' ? 'min-h-9 px-3.5 text-sm' : 'min-h-11 px-4 text-sm'
            }`}
          >
            {choice.label}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);
