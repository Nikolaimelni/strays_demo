interface Choice<T extends string> {
  value: T;
  label: string;
}

interface ChoiceGroupProps<T extends string> {
  legend: string;
  name: string;
  choices: readonly Choice<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
}

// real radios under the chips, not buttons with aria-checked: arrow-key
// navigation and the grouping are then the browser problem, not ours
export const ChoiceGroup = <T extends string>({
  legend,
  name,
  choices,
  value,
  onChange,
}: ChoiceGroupProps<T>) => (
  <fieldset>
    <legend className="text-xs uppercase tracking-[0.12em] text-muted">{legend}</legend>
    <div className="mt-2 flex flex-wrap gap-2">
      {choices.map((choice) => (
        <label key={choice.value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={choice.value}
            checked={value === choice.value}
            onChange={() => onChange(choice.value)}
            className="peer sr-only"
          />
          <span className="inline-flex min-h-11 items-center rounded-full border border-rule/20 px-4 text-sm transition-colors peer-hover:border-rule/50 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-page peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-brand">
            {choice.label}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);
