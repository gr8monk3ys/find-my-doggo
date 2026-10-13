import localFont from 'next/font/local';

// Three voices, all self-hosted from the @fontsource packages so the build
// never fetches a font. Fraunces speaks (headings), Instrument Sans reads
// (body), IBM Plex Mono catalogues (the wall label). See DESIGN.md →
// Typography. tests/unit/fonts.test.ts checks the files exist and that
// nothing under src/ imports the Google Fonts loader.

export const fontDisplay = localFont({
  src: '../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  // Headings are not on the critical path the way body copy is; one preload
  // (the body) keeps the font budget small.
  preload: false,
  variable: '--font-fraunces',
  fallback: ['ui-serif', 'Georgia', 'serif'],
  adjustFontFallback: false,
});

export const fontBody = localFont({
  src: '../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-instrument-sans',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});

export const fontMono = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
      weight: '400',
    },
    {
      path: '../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
      weight: '500',
    },
    {
      path: '../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2',
      weight: '600',
    },
  ],
  style: 'normal',
  // `optional`, not `swap`: the mono voice only ever paints small uppercase
  // labels, and a swap there flips a metadata row between one line and two.
  // The sibling site measured 0.135 CLS from exactly that.
  display: 'optional',
  preload: false,
  variable: '--font-plex-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});
