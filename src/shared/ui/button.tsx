import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:bg-brand-hover',
  secondary: 'border border-rule/20 text-ink hover:border-rule/50',
  ghost: 'text-muted hover:text-ink',
  danger: 'text-danger hover:bg-lost-soft',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 py-1.5 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-sm',
};

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md') =>
  `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = ({ variant, size, className = '', ...props }: ButtonProps) => (
  <button type="button" className={`${buttonClass(variant, size)} ${className}`} {...props} />
);

interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export const ButtonLink = ({ to, variant, size, className = '', children }: ButtonLinkProps) => (
  <Link to={to} className={`${buttonClass(variant, size)} ${className}`}>
    {children}
  </Link>
);
