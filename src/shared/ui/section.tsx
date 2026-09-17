import type { ReactNode } from 'react';
import { Reveal } from './reveal.tsx';

interface SectionProps {
  index: string;
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

// every section on the site is one of these, which is what stops the rhythm
// drifting from page to page
export const Section = ({ index, title, aside, children, className = '' }: SectionProps) => (
  <section className={`border-t border-rule/15 pt-5 sm:pt-7 ${className}`}>
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-[3.5rem_1fr] sm:gap-y-4">
      {/* sticky, so the number stays beside its own section */}
      <p className="section-index text-xs font-medium text-muted sm:sticky sm:top-24 sm:self-start sm:pt-1">
        {index}
      </p>

      <div className="min-w-0">
        {title || aside ? (
          <Reveal className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            {title ? (
              <h2 className="font-display text-title font-semibold text-balance">{title}</h2>
            ) : (
              <span />
            )}
            {aside}
          </Reveal>
        ) : null}
        {children}
      </div>
    </div>
  </section>
);
