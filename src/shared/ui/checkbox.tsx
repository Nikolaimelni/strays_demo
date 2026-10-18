import { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import type { FieldError } from 'react-hook-form';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: FieldError | undefined;
}

// never ticked in advance: what it stands for (an age, an agreement, a statement made in
// good faith) only counts if somebody ticked it themselves
export const Checkbox = ({ label, error, id, ...input }: CheckboxProps) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 size-4 shrink-0 accent-brand"
          {...input}
        />
        <label htmlFor={inputId} className="text-sm leading-relaxed text-muted">
          {label}
        </label>
      </div>
      {error ? (
        <span id={errorId} role="alert" className="block text-sm text-danger">
          {error.message}
        </span>
      ) : null}
    </div>
  );
};
