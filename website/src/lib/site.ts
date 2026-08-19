/**
 * Canonical origin, used for absolute URLs in metadata, robots, and the
 * sitemap. Vercel injects VERCEL_PROJECT_PRODUCTION_URL automatically, so a
 * deployment needs no configuration; set NEXT_PUBLIC_SITE_URL to override.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}
