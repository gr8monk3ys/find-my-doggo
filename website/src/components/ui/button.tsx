import Link, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

// The notebook has one filled button (cta-primary, one per view) and paper-card
// buttons for everything else. Focus is the global :focus-visible outline in
// globals.css, so no ring stack here. See DESIGN.md → Components → Buttons.

export type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'link' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0';

const VARIANTS: Record<ButtonVariant, string> = {
  default: 'cta-primary',
  secondary: 'cta-secondary',
  destructive: 'cta-secondary text-destructive hover:text-destructive',
  ghost: 'border border-transparent text-foreground hover:border-border hover:bg-card hover:text-primary',
  link: 'ink-underline h-auto px-0 text-primary',
};

const SIZES: Record<ButtonSize, string> = {
  default: 'h-10 rounded-lg px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-12 rounded-lg px-8 text-base',
  icon: 'size-10 rounded-lg',
};

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** The class list for a button or a link styled as one. */
export function buttonClasses({ variant = 'default', size = 'default', className }: ButtonStyleProps = {}): string {
  return cn(BASE, VARIANTS[variant], variant === 'link' ? undefined : SIZES[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps;

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & LinkProps & ButtonStyleProps;

/** A next/link that looks like a button; the primary variant is the page's one CTA. */
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
