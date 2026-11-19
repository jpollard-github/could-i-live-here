import type { Coordinate } from "./types.ts";
import { radiusRing } from "./circle.ts";

const EARTH_RADIUS_MI = 3958.7613;

/** Great-circle distance. This is not a route or an estimate of travel time. */
export function milesBetween(a: Coordinate, b: Coordinate): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(miles: number): string {
  if (!Number.isFinite(miles) || miles < 0) return "—";
  return miles < 0.1 ? "<0.1 mi" : `${miles.toFixed(1)} mi`;
}

/** Only offer map selection inside the downloaded area's bounding box. */
export function insideBBox(point: Coordinate, bbox: readonly number[]): boolean {
  return point.lng >= bbox[0] && point.lng <= bbox[2] &&
    point.lat >= bbox[1] && point.lat <= bbox[3];
}

/** True only when the entire search circle falls within the downloaded data box.
 * The radius may be valid while the underlying results are incomplete.
 */
export function circleWithinBBox(center: Coordinate, miles: number, bbox: readonly number[]): boolean {
  // Higher sampling density helps avoid missing a bbox edge at the narrowest margin.
  return radiusRing(center, miles, 360).every(([lng, lat]) => insideBBox({ lng, lat }, bbox));
}
