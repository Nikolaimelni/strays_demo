import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'li' | 'section' | 'article';
}

export const Reveal = ({ children, className = '', delay = 0, as: Tag = 'div' }: RevealProps) => (
  <Tag
    style={delay ? { animationDelay: `${delay}ms` } : undefined}
    className={`reveal ${className}`}
  >
    {children}
  </Tag>
);
