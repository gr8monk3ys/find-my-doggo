'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import Link from 'next/link';
import type { Dog } from '@/lib/types';

/** Dogs without coordinates cannot be pinned; the page lists them separately. */
type PinnedDog = Dog & { location: { address: string; lat: number; lng: number } };

const MARKER_COLORS: Record<string, string> = {
  lost: '#ef4444',
  found: '#22c55e',
  reunited: '#3b82f6',
};

/**
 * A CSS-drawn marker rather than Leaflet's default PNG. Leaflet resolves its
 * bundled icon images by relative URL, which breaks under bundlers; drawing the
 * pin ourselves sidesteps that and keeps the status colour in one place.
 */
function pinIcon(status: string): L.DivIcon {
  const color = MARKER_COLORS[status] ?? MARKER_COLORS.lost;
  return L.divIcon({
    className: 'dog-pin',
    html: `<span style="background:${color}" class="dog-pin__dot">🐕</span>`,
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
      {pinned.map((dog) => (
        <Marker key={dog.id} position={[dog.location.lat, dog.location.lng]} icon={pinIcon(dog.status)}>
          <Popup>
            <strong className="block text-base">{dog.name}</strong>
            <span className="block text-orange-600">{dog.breed}</span>
            <span className="block text-gray-600">{dog.location.address}</span>
            <Link href={`/dogs/${dog.id}`} className="mt-2 inline-block font-medium text-orange-600 underline">
              View details
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
