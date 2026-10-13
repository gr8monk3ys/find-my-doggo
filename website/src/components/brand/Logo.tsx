import type { SVGProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * The collar tag.
 *
 * Find My Doggo is a noticeboard of lost and found dogs, and every listing
 * has a square photo plate. The mark is that plate — a square of Terracotta
 * ink with square corners, because squareness marks the work — with a dog
 * tag cut out of it in paper. The tag is bone-shaped: four lobes of radius
 * 2.9 around a bar 4.2 units tall on the 24-unit grid. It was chosen over
 * the round tag with a ring hole because it still reads at 16px; the round
 * tag's hole was a one-pixel smudge there and the hole-less disc read as a
 * map pin, not a tag (DESIGN.md → Components → Mark and Wordmark).
 *
 * One path, `fill-rule="evenodd"`: the plate is the first subpath and the
 * bone the second, so the bone is a true hole and whatever the mark sits on
 * shows through. The ink is `hsl(var(--primary))`, so the same element is
 * Terracotta on paper by day and the lifted Terracotta at night without a
 * `dark:` override. `scripts/generate-brand.mjs` carries the same path for
 * the static assets in `public/brand/`; `tests/unit/brand-assets.test.ts`
 * keeps the two equal.
 */
export const MARK_PATH =
  'M0 0H24V24H0ZM9.284 9.9L14.716 9.9A2.9 2.9 0 1 1 19.228 12A2.9 2.9 0 1 1 14.716 14.1L9.284 14.1A2.9 2.9 0 1 1 4.772 12A2.9 2.9 0 1 1 9.284 9.9Z';

/**
 * Fraunces 700's cap height as a fraction of the em (`sCapHeight` 1400 over
 * 2000 units per em). The mark's height equals the wordmark's cap height, so
 * a wordmark set beside a mark of `size` px is `size / WORDMARK_CAP_HEIGHT`
 * px of type.
 */
export const WORDMARK_CAP_HEIGHT = 0.7;

export interface LogoMarkProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Rendered width and height in px. A `size-*` class on `className` overrides it. */
  size?: number;
  /** An accessible name. Without one the mark is decorative (`aria-hidden`). */
  title?: string;
  className?: string;
}

export function LogoMark({ size = 24, title, className, ...rest }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      className={cn('shrink-0', className)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path fill="hsl(var(--primary))" fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

export interface LogoProps {
  /**
   * `horizontal`: mark, 12px gap, wordmark, with the mark as tall as the
   * wordmark's capitals. `stacked`: mark above, 12px gap, wordmark centred
   * beneath, the mark twice the wordmark's cap height. `mark`: the tag alone.
   */
  variant?: 'horizontal' | 'stacked' | 'mark';
  /** The mark's height in px. The wordmark is sized from it. */
  size?: number;
  className?: string;
}

/**
 * The signature: the tag beside the name. The wordmark is live text in
 * Fraunces 700, Ink, with "Doggo" in Terracotta — one word in ink, the house
 * device. Server-safe; no client hooks.
 */
export function Logo({ variant = 'horizontal', size = 24, className }: LogoProps) {
  if (variant === 'mark') {
    return <LogoMark size={size} title="Find My Doggo" className={className} />;
  }

  const stacked = variant === 'stacked';
  const capHeight = stacked ? size / 2 : size;
  const fontSize = capHeight / WORDMARK_CAP_HEIGHT;

  return (
    <span
      role="img"
      aria-label="Find My Doggo"
      className={cn('inline-flex items-center gap-3 text-foreground', stacked && 'flex-col justify-center', className)}
    >
      <LogoMark size={size} aria-hidden />
      {/* The wordmark is one of the Serif Speaks Rule's named exceptions. */}
      <span data-voice="display" className="font-display leading-none font-bold tracking-tight whitespace-nowrap" style={{ fontSize }}>
        Find My <span className="text-primary">Doggo</span>
      </span>
    </span>
  );
}
