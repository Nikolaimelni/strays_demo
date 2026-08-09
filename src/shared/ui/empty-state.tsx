import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, body, action }: EmptyStateProps) => (
  <div className="border-t border-rule/20 py-10">
    <p className="font-display text-lg font-semibold">{title}</p>
    {body ? <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{body}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
