'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import Link from 'next/link';
import { clusterPoints } from '@/lib/cluster';
import type { Dog, DogStatus } from '@/lib/types';

/** Dogs without coordinates cannot be pinned; the page lists them separately. */
type PinnedDog = Dog & { location: { address: string; lat: number; lng: number } };

/** Pins within this many screen pixels of each other collapse into a cluster. */
const CLUSTER_RADIUS_PX = 44;

function buildClusterIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: 'dog-pin-cluster',
    html: `<span class="dog-pin-cluster__dot">${count}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

/**
 * CSS-drawn markers rather than Leaflet's default PNG: Leaflet resolves its
 * bundled icon images by relative URL, which breaks under bundlers.
 *
 * `divIcon` takes a raw HTML string, so nothing dynamic is interpolated into
 * it — the three variants are constants and the colour lives in a stylesheet
 * class. Built once at module load rather than per marker per render.
 */
const PIN_ICONS: Record<DogStatus, L.DivIcon> = {
  lost: buildPin('dog-pin__dot--lost'),
  found: buildPin('dog-pin__dot--found'),
  reunited: buildPin('dog-pin__dot--reunited'),
};

function buildPin(modifier: 'dog-pin__dot--lost' | 'dog-pin__dot--found' | 'dog-pin__dot--reunited'): L.DivIcon {
  return L.divIcon({
    className: 'dog-pin',
    html: `<span class="dog-pin__dot ${modifier}">🐕</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

/** Re-frames the viewport whenever the filtered set of dogs changes. */
function FitBounds({ dogs }: { dogs: PinnedDog[] }) {
  const map = useMap();

  useEffect(() => {
    if (dogs.length === 0) return;
    const bounds = L.latLngBounds(dogs.map((dog) => [dog.location.lat, dog.location.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [dogs, map]);

  return null;
}

type PinPoint = { id: string; x: number; y: number; dog: PinnedDog };

/**
 * Projects pins to screen space and collapses ones that would overlap into a
 * single clickable cluster (README "Known limitations": "Overlapping map pins
 * ... marker clustering would fix this"). Re-clusters on pan/zoom, since two
 * pins that overlap at zoom 4 may be clickable apart at zoom 13.
 */
function ClusteredMarkers({ dogs }: { dogs: PinnedDog[] }) {
  const map = useMap();
  const [tick, setTick] = useState(0);

  useMapEvents({
    zoomend: () => setTick((t) => t + 1),
    moveend: () => setTick((t) => t + 1),
  });

  const clusters = useMemo(() => {
    const points: PinPoint[] = dogs.map((dog) => {
      const { x, y } = map.latLngToContainerPoint([dog.location.lat, dog.location.lng]);
      return { id: dog.id, x, y, dog };
    });
    return clusterPoints(points, CLUSTER_RADIUS_PX);
    // `tick` exists only to force a recompute on pan/zoom, when the map's
    // projection changes but `dogs` does not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogs, map, tick]);

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.points.length === 1) {
          const dog = cluster.points[0].dog;
          return (
            <Marker key={dog.id} position={[dog.location.lat, dog.location.lng]} icon={PIN_ICONS[dog.status]}>
              <Popup>
                <strong className="block text-base">{dog.name}</strong>
                <span className="block text-orange-600">{dog.breed}</span>
                <span className="block text-gray-600">{dog.location.address}</span>
                <Link href={`/dogs/${dog.id}`} className="mt-2 inline-block font-medium text-orange-600 underline">
                  View details
                </Link>
              </Popup>
            </Marker>
          );
        }

        const bounds = L.latLngBounds(
          cluster.points.map((p) => [p.dog.location.lat, p.dog.location.lng] as [number, number]),
        );
        return (
          <Marker
            key={`cluster-${cluster.points.map((p) => p.id).sort().join('-')}`}
            position={bounds.getCenter()}
            icon={buildClusterIcon(cluster.points.length)}
            eventHandlers={{
              click: () => map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 }),
            }}
          />
        );
      })}
    </>
  );
}

export default function DogMapCanvas({ dogs }: { dogs: Dog[] }) {
  const pinned = useMemo(
    () => dogs.filter((dog): dog is PinnedDog => dog.location.lat !== null && dog.location.lng !== null),
    [dogs],
  );

  return (
    <MapContainer
      // Continental-US default view, replaced by FitBounds as soon as there are pins.
      center={[39.8283, -98.5795]}
      zoom={4}
      scrollWheelZoom
      className="h-[500px] w-full rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FitBounds dogs={pinned} />
      <ClusteredMarkers dogs={pinned} />
    </MapContainer>
  );
}
