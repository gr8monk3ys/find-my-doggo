'use client';

import dynamic from 'next/dynamic';
import type { Dog } from '@/lib/types';

/**
 * Leaflet touches `window` at import time, so the canvas is loaded on the
 * client only. This wrapper exists because `ssr: false` is not permitted from a
 * server component.
 */
const Canvas = dynamic(() => import('@/components/DogMapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-xl bg-gray-100 dark:bg-[#1a1a2e] flex items-center justify-center text-gray-500">
      Loading map…
    </div>
  ),
});

export default function DogMap({ dogs }: { dogs: Dog[] }) {
  return <Canvas dogs={dogs} />;
}
