import type { ReactNode } from 'react';
import { Reveal } from './reveal.tsx';

// the numbered band the whole site is built from: an index in the left margin,
// content in the measure. sticky, so the number stays beside its own section.
export const Band = ({ index, children }: { index: string; children: ReactNode }) => (
  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-[3.5rem_1fr] sm:gap-y-4">
    <p className="section-index text-xs font-medium text-muted sm:sticky sm:top-24 sm:self-start sm:pt-1">
      {index}
    </p>
    <div className="min-w-0">{children}</div>
  </div>
);

interface HeadProps {
  index: string;
  title: string;
  lead?: string;
  aside?: ReactNode;
  children?: ReactNode;
}

export const Section = ({ index, title, aside, children }: HeadProps) => (
  <section className="border-t border-rule/15 pt-5 sm:pt-7">
    <Band index={index}>
      <Reveal className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-title font-semibold text-balance">{title}</h2>
        {aside}
      </Reveal>
      {children}
    </Band>
  </section>
);

export const PageHeading = ({ index, title, lead, aside }: HeadProps) => (
  <header className="border-t border-rule/15 pt-5 sm:pt-7">
    <Band index={index}>
      <Reveal immediate>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="font-display text-title font-semibold text-balance">{title}</h1>
          {aside}
        </div>
        {lead ? <p className="mt-3 max-w-prose text-lead text-muted">{lead}</p> : null}
      </Reveal>
    </Band>
  </header>
);
