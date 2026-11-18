import { categoryForPlace } from "./categories.ts";
import { milesBetween } from "./geo.ts";
import type { Anchor, CategoryId, Place } from "./types.ts";

export type NearbyPlace = { place: Place; miles: number };
export type CategoryResult = {
  id: CategoryId;
  count: number;
  nearest: NearbyPlace | null;
  /** All matches in distance order. The interface handles scrolling. */
  closest: NearbyPlace[];
};

export function nearbyByCategory(
  places: readonly Place[],
  anchor: Anchor,
  radiusMiles: number,
  categories: readonly CategoryId[],
): CategoryResult[] {
  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0) throw new RangeError("Radius must be positive");
  const active = new Set<CategoryId>(categories);
  const grouped = new Map<CategoryId, NearbyPlace[]>();
  for (const id of categories) grouped.set(id, []);
  for (const place of places) {
    const id = categoryForPlace(place);
    if (id === null || !active.has(id)) continue;
    const miles = milesBetween(anchor, place);
    if (miles <= radiusMiles) grouped.get(id)!.push({ place, miles });
  }
  return categories.map((id) => {
    const closest = grouped.get(id)!;
    closest.sort((a, b) => a.miles - b.miles || a.place.name.localeCompare(b.place.name));
    return { id, count: closest.length, nearest: closest[0] ?? null, closest };
  });
}

export function essentialsCount(results: readonly CategoryResult[]): number {
  return results.filter((result) => result.count > 0).length;
}
