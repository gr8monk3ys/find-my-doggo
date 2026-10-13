'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';

type Choice = 'light' | 'dark' | 'system';

const CHOICES: { value: Choice; label: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Light theme',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark theme',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'Follow the system theme',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
];

const subscribeNoop = () => () => {};

/**
 * Light / dark / system as a round hairline pill of three icon buttons. The
 * pressed state is only known on the client (next-themes reads localStorage),
 * so before hydration no button is pressed; useSyncExternalStore gives a
 * server/client-consistent "mounted" flag without a setState-in-effect.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const current: Choice | undefined = mounted ? ((theme as Choice | undefined) ?? 'system') : undefined;

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn('inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-card p-0.5', className)}
    >
      {CHOICES.map((choice) => {
        const pressed = current === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            aria-label={choice.label}
            title={choice.label}
            aria-pressed={pressed}
            onClick={() => setTheme(choice.value)}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-full transition-colors duration-150 [&_svg]:size-4',
              pressed ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent hover:text-primary',
            )}
          >
            {choice.icon}
          </button>
        );
      })}
    </div>
  );
}
