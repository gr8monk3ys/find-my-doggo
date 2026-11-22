/**
 * Groups nearby map pins so overlapping markers become a single clickable
 * cluster instead of a stack of unreachable pins. Pure and framework-free so
 * it can be unit tested without a DOM or a Leaflet map instance; the map
 * component feeds it points already projected to screen pixels (via
 * `map.latLngToContainerPoint`) and a pixel radius.
 */
export interface ClusterPoint {
  id: string;
  x: number;
  y: number;
}

export interface Cluster<T extends ClusterPoint> {
  /** Centroid of the member points, in the same coordinate space as the input. */
  x: number;
  y: number;
  points: T[];
}

/**
 * Greedy single-pass clustering: walk the points in order, and fold any
 * not-yet-claimed point within `radius` of the current point into its group.
 * Not globally optimal (a point can end up in whichever group reaches it
 * first) but deterministic, O(n^2) on the small counts a lost-and-found
 * board has, and exactly what "stop pins from overlapping" needs.
 */
export function clusterPoints<T extends ClusterPoint>(points: T[], radius: number): Cluster<T>[] {
  const clusters: Cluster<T>[] = [];
  const claimed = new Array<boolean>(points.length).fill(false);

  for (const [i, anchor] of points.entries()) {
    if (claimed[i]) continue;
    claimed[i] = true;
    const group: T[] = [anchor];

    for (let j = i + 1; j < points.length; j++) {
      const other = points[j];
      if (other === undefined || claimed[j]) continue;
      const dx = anchor.x - other.x;
      const dy = anchor.y - other.y;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        claimed[j] = true;
        group.push(other);
      }
    }

    const x = group.reduce((sum, p) => sum + p.x, 0) / group.length;
    const y = group.reduce((sum, p) => sum + p.y, 0) / group.length;
    clusters.push({ x, y, points: group });
  }

  return clusters;
}
