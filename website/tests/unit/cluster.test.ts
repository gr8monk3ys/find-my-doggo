import { describe, expect, it } from 'vitest';
import { clusterPoints } from '@/lib/cluster';

describe('clusterPoints', () => {
  it('returns one cluster per point when nothing is within radius', () => {
    const points = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 500, y: 500 },
    ];
    const clusters = clusterPoints(points, 40);
    expect(clusters).toHaveLength(2);
    expect(clusters.map((c) => c.points.map((p) => p.id))).toEqual([['a'], ['b']]);
  });

  it('groups points within radius into a single cluster centred on their mean', () => {
    const points = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 10, y: 0 },
      { id: 'c', x: 0, y: 10 },
    ];
    const clusters = clusterPoints(points, 40);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].points.map((p) => p.id).sort()).toEqual(['a', 'b', 'c']);
    expect(clusters[0].x).toBeCloseTo(10 / 3);
    expect(clusters[0].y).toBeCloseTo(10 / 3);
  });

  it('keeps points outside the radius in separate clusters', () => {
    const points = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 20, y: 0 },
      { id: 'c', x: 1000, y: 1000 },
    ];
    const clusters = clusterPoints(points, 40);
    expect(clusters).toHaveLength(2);
    const sizes = clusters.map((c) => c.points.length).sort();
    expect(sizes).toEqual([1, 2]);
  });

  it('returns an empty array for no points', () => {
    expect(clusterPoints([], 40)).toEqual([]);
  });

  it('does not merge two points exactly at the radius boundary twice over', () => {
    // a-b distance is exactly the radius; c is just outside a's radius but
    // within reach only via b — single-pass clustering does not chain.
    const points = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 40, y: 0 },
      { id: 'c', x: 80, y: 0 },
    ];
    const clusters = clusterPoints(points, 40);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].points.map((p) => p.id)).toEqual(['a', 'b']);
    expect(clusters[1].points.map((p) => p.id)).toEqual(['c']);
  });
});
