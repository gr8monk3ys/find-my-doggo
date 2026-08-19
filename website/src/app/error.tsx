'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] unhandled error', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          We hit an unexpected problem loading this page. Trying again usually clears it.
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Try again
        </button>
        {error.digest && <p className="mt-6 text-xs text-gray-500">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
