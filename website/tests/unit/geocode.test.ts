import { describe, expect, it } from 'vitest';
import { parseGeocodeResponse } from '@/lib/geocode';

describe('parseGeocodeResponse', () => {
  it('reads lat/lon from the first Nominatim result', () => {
    expect(parseGeocodeResponse([{ lat: '40.785091', lon: '-73.968285' }])).toEqual({
      lat: 40.785091,
      lng: -73.968285,
    });
  });

  it('returns null for an empty result set', () => {
    expect(parseGeocodeResponse([])).toBeNull();
  });

  it('returns null for a non-array payload', () => {
    expect(parseGeocodeResponse({ error: 'rate limited' })).toBeNull();
    expect(parseGeocodeResponse(null)).toBeNull();
  });

  it('returns null when the coordinates are not numbers', () => {
    expect(parseGeocodeResponse([{ lat: 'north', lon: 'west' }])).toBeNull();
  });

  it('rejects coordinates outside the valid range', () => {
    expect(parseGeocodeResponse([{ lat: '95', lon: '0' }])).toBeNull();
    expect(parseGeocodeResponse([{ lat: '0', lon: '-200' }])).toBeNull();
  });
});
