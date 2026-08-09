import type { ReactNode } from 'react';
import { Reveal } from './reveal.tsx';

interface PageHeadingProps {
  index: string;
  title: string;
  lead?: string;
  aside?: ReactNode;
}

export const PageHeading = ({ index, title, lead, aside }: PageHeadingProps) => (
  <header className="border-t border-rule/15 pt-5 sm:pt-7">
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-[3.5rem_1fr] sm:gap-y-4">
      <p className="section-index text-xs font-medium text-muted sm:pt-1">{index}</p>
      <Reveal className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="font-display text-title font-semibold text-balance">{title}</h1>
          {aside}
        </div>
        {lead ? <p className="mt-3 max-w-prose text-lead text-muted">{lead}</p> : null}
      </Reveal>
    </div>
  </header>
);
