'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { FeedbackTrigger } from '@/components/FeedbackDialog';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/cn';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dogs', label: 'Lost & found' },
  { href: '/map', label: 'Map' },
  { href: '/report', label: 'Report a dog' },
  { href: '/contact', label: 'Contact' },
];

/**
 * The sticky header sheet: 72px of 90% paper with a 12px blur, a 40% hairline
 * beneath, and the one structural shadow. DESIGN.md → Elevation → The Two
 * Sheets Rule and → Shapes: this is the one glass surface and one of the two
 * sanctioned shadows; both are allowlisted in scripts/check-design-system.mjs.
 *
 * One <nav> landmark on the page: the mobile menu lives inside it.
 */
export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCurrent = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <nav aria-label="Primary" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center rounded-md">
            <Logo size={20} />
          </Link>

          {/* Desktop navigation */}
          <ul className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isCurrent(link.href) ? 'page' : undefined}
                  className={cn(
                    'ink-underline label-link text-sm font-medium transition-colors duration-150 hover:text-primary',
                    isCurrent(link.href) ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {/* The beta's one header mention: a small link that opens the feedback dialog. */}
            <FeedbackTrigger className="ink-underline label-link mr-3 hidden text-sm font-medium text-foreground transition-colors duration-150 hover:text-primary md:inline-flex" />
            {/* Below md the pill would not fit beside the lockup; it moves into the menu.
                A wrapper rather than a `hidden` on the pill itself, which carries its own
                display utility. */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-transparent text-foreground transition-colors duration-150 hover:border-border hover:bg-card hover:text-primary md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile navigation: a hairline-topped list of rows, then the theme pill. */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="border-t border-border/60 pb-4 pt-2 md:hidden">
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isCurrent(link.href) ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center border-b border-border/40 py-2 text-base font-medium transition-colors duration-150 hover:text-primary',
                      isCurrent(link.href) ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <FeedbackTrigger
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 w-full items-center border-b border-border/40 py-2 text-left text-base font-medium text-foreground transition-colors duration-150 hover:text-primary"
                />
              </li>
            </ul>
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="label-mono">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
