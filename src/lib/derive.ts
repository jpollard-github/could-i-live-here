import { belongsToCategory } from "./categories.ts";
import { milesBetween } from "./geo.ts";
import type { Anchor, CategoryId, Place } from "./types.ts";

export type NearbyPlace = { place: Place; miles: number };
export type CategoryResult = {
  id: CategoryId;
  count: number;
  nearest: NearbyPlace | null;
  closest: NearbyPlace[];
};

export function nearbyByCategory(
  places: readonly Place[],
  anchor: Anchor,
  radiusMiles: number,
  categories: readonly CategoryId[],
): CategoryResult[] {
  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0) throw new RangeError("Radius must be positive");
  const distances = places.map((place) => ({ place, miles: milesBetween(anchor, place) }));
  return categories.map((id) => {
    const closest = distances
      .filter(({ place, miles }) => miles <= radiusMiles && belongsToCategory(place, id))
      .sort((a, b) => a.miles - b.miles || a.place.name.localeCompare(b.place.name));
    return { id, count: closest.length, nearest: closest[0] ?? null, closest: closest.slice(0, 3) };
  });
}

export function essentialsCount(results: readonly CategoryResult[]): number {
  return results.filter((result) => result.count > 0).length;
}
