import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`border-t border-rule/20 ${className}`}>{children}</div>
);

export const CardTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-xs uppercase tracking-[0.14em] text-muted">{children}</h2>
);
