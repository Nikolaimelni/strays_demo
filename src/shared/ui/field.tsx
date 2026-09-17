import { type ReactNode, useId } from 'react';
import type { FieldError } from 'react-hook-form';

interface ControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

interface FieldProps {
  label: string;
  error?: FieldError | undefined;
  children: (control: ControlProps) => ReactNode;
}

// the error sits outside the <label>, tied to the control by aria-describedby.
// inside it, the message folds into the accessible name and breaks both screen
// readers and getByLabelText.
export const Field = ({ label, error, children }: FieldProps) => {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs uppercase tracking-[0.12em] text-muted">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error ? (
        <span id={errorId} role="alert" className="block text-sm text-danger">
          {error.message}
        </span>
      ) : null}
    </div>
  );
};

export const inputClass =
  'min-h-11 w-full rounded-none border-0 border-b border-rule/25 bg-transparent px-0 py-2 text-base text-ink transition-colors placeholder:text-muted focus:border-brand focus:outline-none aria-[invalid=true]:border-danger sm:text-sm';

// field-sizing grows the box with what is typed. the alternative is a resize
// handle nobody drags or a hidden clone of the text being measured on input.
export const textareaClass = `${inputClass} field-sizing-content min-h-24 resize-none`;
