import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'outline' | 'filled';

const VARIANTS: Record<BadgeVariant, string> = {
  // The house chip: Paper Card with a hairline, ink text.
  outline: 'border border-border bg-card text-foreground',
  // Reserve for a single status or count per view.
  filled: 'border border-transparent bg-primary text-primary-foreground',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant };

/**
 * A round chip. Tag lists are not chips (they are wall-label links), and a
 * dog's status is not a chip either: it is a `label-mono` in the matching
 * signal token (text-destructive / text-success / text-info).
 */
export function Badge({ variant = 'outline', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', VARIANTS[variant], className)}
      {...props}
    />
  );
}
