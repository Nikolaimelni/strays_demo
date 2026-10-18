import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'li' | 'section' | 'article';
  // for what is on screen when the page opens: a scroll-driven entrance there only plays as
  // far as the element has come into view, and the top of a page never scrolls in
  immediate?: boolean;
}

export const Reveal = ({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
  immediate = false,
}: RevealProps) => (
  <Tag
    style={delay ? { animationDelay: `${delay}ms` } : undefined}
    className={`reveal ${immediate ? 'reveal-now ' : ''}${className}`}
  >
    {children}
  </Tag>
);
