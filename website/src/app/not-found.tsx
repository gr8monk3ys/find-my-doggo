import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <p className="label-mono">404 · Not found</p>
      <h1 className="text-page-title mt-3">Page not found</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        This page has wandered off. The listing may have been removed, or the link may be wrong.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/dogs">Browse listings</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
