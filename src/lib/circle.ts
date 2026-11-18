import type { Coordinate } from "./types.ts";

const EARTH_RADIUS_MILES = 3958.7613;

/** Geographic radius rather than pixel circle: stays accurate as the map zooms. */
export function radiusRing(center: Coordinate, radiusMiles: number, segments = 72): [number, number][] {
  if (radiusMiles <= 0 || !Number.isFinite(radiusMiles) || segments < 8) throw new RangeError("Invalid radius ring");
  const phi1 = center.lat * Math.PI / 180;
  const lambda1 = center.lng * Math.PI / 180;
  const delta = radiusMiles / EARTH_RADIUS_MILES;
  const ring: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const bearing = (2 * Math.PI * i) / segments;
    const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(bearing));
    const lambda2 = lambda1 + Math.atan2(Math.sin(bearing) * Math.sin(delta) * Math.cos(phi1), Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));
    ring.push([lambda2 * 180 / Math.PI, phi2 * 180 / Math.PI]);
  }
  ring[ring.length - 1] = [...ring[0]];
  return ring;
}

export function ringBounds(ring: readonly [number, number][]): [[number, number], [number, number]] {
  return [
    [Math.min(...ring.map((point) => point[0])), Math.min(...ring.map((point) => point[1]))],
    [Math.max(...ring.map((point) => point[0])), Math.max(...ring.map((point) => point[1]))],
  ];
}
