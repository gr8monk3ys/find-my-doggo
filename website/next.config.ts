import type { NextConfig } from 'next';

/**
 * Security headers. The CSP allows OpenStreetMap tiles (the map), Unsplash and
 * Vercel Blob images (seed data and uploads), and inline styles, which both
 * Next's streaming runtime and Leaflet require.
 */
const IMAGE_SOURCES = "'self' data: blob: https://*.tile.openstreetmap.org https://images.unsplash.com https://*.public.blob.vercel-storage.com";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `img-src ${IMAGE_SOURCES}`,
  "style-src 'self' 'unsafe-inline'",
  // Next's App Router bootstraps hydration from inline scripts.
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.tile.openstreetmap.org",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Sample listings created by `npm run seed`.
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      // Photos uploaded through the report form once Vercel Blob is configured.
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com', pathname: '/**' },
    ],
  },
  // Don't advertise the framework version to anyone scanning for known CVEs.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
