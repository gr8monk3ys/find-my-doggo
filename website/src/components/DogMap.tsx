'use client';

import dynamic from 'next/dynamic';
import type { Dog } from '@/lib/types';

/**
 * Leaflet touches `window` at import time, so the canvas is loaded on the
 * client only. This wrapper exists because `ssr: false` is not permitted from a
 * server component.
 *
 * While the canvas loads, the map's square plate is already on the page so
 * the layout does not jump when the tiles arrive.
 */
const Canvas = dynamic(() => import('@/components/DogMapCanvas'), {
  ssr: false,
  loading: () => (
    <div role="status" className="plate flex h-[500px] w-full items-center justify-center">
      <span className="label-mono animate-pulse">Loading map</span>
    </div>
  ),
});

export default function DogMap({ dogs }: { dogs: Dog[] }) {
  return <Canvas dogs={dogs} />;
}
