'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Light and dark are the same notebook read by day or by night. next-themes
 * sets the `dark` class on <html> before first paint (attribute="class"),
 * follows the OS by default (enableSystem) and remembers an explicit choice
 * in localStorage. disableTransitionOnChange keeps a theme switch from
 * animating every colour transition on the page at once.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  );
}
