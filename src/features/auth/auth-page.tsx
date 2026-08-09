import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Alert } from '../../shared/ui/alert.tsx';
import { buttonClass } from '../../shared/ui/button.tsx';
import { PageMeta } from '../../shared/ui/page-meta.tsx';
import { Reveal } from '../../shared/ui/reveal.tsx';

interface AuthPageProps {
  title: string;
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  error: string | null;
  footerTo: string;
  footerLabel: string;
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
  children,
}: AuthPageProps) => (
  <div className="border-t border-rule/15 pt-5 sm:pt-7">
    <PageMeta title={title} />
    <div className="grid gap-x-6 gap-y-6 sm:grid-cols-[3.5rem_1fr]">
      <p className="section-index text-xs font-medium text-muted sm:pt-1">01</p>

      <Reveal className="max-w-sm">
        <h1 className="font-display text-title font-semibold">{title}</h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          {children}

          {error ? <Alert>{error}</Alert> : null}

          <button type="submit" disabled={submitting} className={`${buttonClass()} w-full`}>
            {submitLabel}
          </button>
        </form>

        <p className="mt-6">
          <Link to={footerTo} className="link-underline text-sm text-muted hover:text-ink">
            {footerLabel}
          </Link>
        </p>
      </Reveal>
    </div>
  </div>
);
