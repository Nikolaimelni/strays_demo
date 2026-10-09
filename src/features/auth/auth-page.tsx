import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { Reveal } from '../../shared/ui/reveal.tsx';
import { Band } from '../../shared/ui/section.tsx';

interface AuthPageProps {
  title: string;
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  error: string | null;
  footerTo: string;
  footerLabel: string;
  note?: ReactNode;
  // replaces the form once there is nothing left to submit: a reset link is on
  // its way, a password has been changed
  done?: ReactNode;
  children: ReactNode;
}

export const AuthPage = ({
  title,
  submitLabel,
  onSubmit,
  submitting,
  error,
  footerTo,
  footerLabel,
  note,
  done,
  children,
}: AuthPageProps) => (
  <div className="border-t border-rule/15 pt-5 sm:pt-7">
    <PageMeta title={title} />
    <Band index="01">
      <Reveal className="max-w-sm">
        <h1 className="font-display text-title font-semibold">{title}</h1>

        {done ? (
          <div className="mt-8">{done}</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
            {children}

            {error ? <Alert>{error}</Alert> : null}

            <button type="submit" disabled={submitting} className={`${buttonClass()} w-full`}>
              {submitLabel}
            </button>
          </form>
        )}

        <p className="mt-6">
          <Link to={footerTo} className="link-underline text-sm text-muted hover:text-ink">
            {footerLabel}
          </Link>
        </p>

        {note}
      </Reveal>
    </Band>
  </div>
);
