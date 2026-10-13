import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MARK_PATH } from '@/components/brand/Logo';
import { siteUrl } from '@/lib/site';

export const alt = 'Find My Doggo — reunite lost dogs with their families';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The notebook's stationery, as literal values: @vercel/og renders no CSS
// variables. Paper #f9f8f5, ink #1a1f23, muted #606976, hairline #e2dbd5,
// Terracotta #a34929 — the same tokens as globals.css.
const PAPER = '#f9f8f5';
const INK = '#1a1f23';
const INK_MUTED = '#606976';
const HAIRLINE = '#e2dbd5';
const TERRACOTTA = '#a34929';

export default async function Image() {
  // Satori needs a static TTF/WOFF, not the variable woff2 the pages use.
  const [displayFont, monoFont] = await Promise.all([
    readFile(join(process.cwd(), 'node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff')),
    readFile(join(process.cwd(), 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff')),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        backgroundColor: PAPER,
        color: INK,
      }}
    >
      {/* Wall label: the mono kicker above the title, with the collar tag. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          fontFamily: 'IBM Plex Mono',
          fontSize: 20,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: INK_MUTED,
        }}
      >
        <svg width={28} height={28} viewBox="0 0 24 24">
          <path fill={TERRACOTTA} fillRule="evenodd" d={MARK_PATH} />
        </svg>
        <span>The lost-dog noticeboard</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex', // Satori: any node with several children must be flex
            fontFamily: 'Fraunces',
            fontSize: 112,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: '-3px',
            color: INK,
          }}
        >
          Find My&nbsp;<span style={{ color: TERRACOTTA }}>Doggo</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.4, maxWidth: 900, color: INK_MUTED }}>
          Post a lost or found dog with a photo and a location. Anyone nearby can search, see the map, and reach you.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: 24,
          fontFamily: 'IBM Plex Mono',
          fontSize: 20,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: INK_MUTED,
        }}
      >
        <span>{siteUrl().replace(/^https?:\/\//, '')}</span>
        <span>Free · No account needed</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Fraunces', data: displayFont, weight: 700, style: 'normal' },
        { name: 'IBM Plex Mono', data: monoFont, weight: 500, style: 'normal' },
      ],
    },
  );
}
