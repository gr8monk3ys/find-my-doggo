'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] unhandled error', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <p className="label-mono text-destructive">Error</p>
      <h1 className="text-page-title mt-3">Something went wrong</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        We hit an unexpected problem loading this page. Trying again usually clears it.
      </p>
      <div className="mt-8">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
      {error.digest && <p className="label-mono mt-8">Reference {error.digest}</p>}
    </div>
  );
}
