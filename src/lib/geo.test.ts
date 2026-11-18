import test from "node:test";
import assert from "node:assert/strict";
import { formatDistance, insideBBox, milesBetween } from "./geo.ts";
import { belongsToCategory, categoryForPlace } from "./categories.ts";
import { radiusRing, ringBounds } from "./circle.ts";
import { essentialsCount, nearbyByCategory } from "./derive.ts";
import type { Place } from "./types.ts";

const anchor = { lat: 35.824, lng: -80.253, label: "Test" };
const cafe: Place = { id: "c", name: "Cafe", lat: 35.826, lng: -80.252, category: "cafe", taxonomy: ["food_and_drink", "cafe"] };
const grocery: Place = { id: "g", name: "Market", lat: 35.830, lng: -80.251, category: "supermarket", taxonomy: ["shopping", "supermarket"] };
const parking: Place = { id: "p", name: "Parking garage", lat: 35.824, lng: -80.253, category: "parking_lot", taxonomy: ["transportation", "car_park"] };

test("great circle distance is zero for same point and symmetric", () => {
  assert.equal(milesBetween(anchor, anchor), 0);
  assert.ok(Math.abs(milesBetween(anchor, cafe) - milesBetween(cafe, anchor)) < 1e-10);
});

test("distance formatting does not overstate walking time", () => {
  assert.equal(formatDistance(0.03), "<0.1 mi");
  assert.equal(formatDistance(1.26), "1.3 mi");
  assert.equal(formatDistance(-2), "—");
});

test("bbox uses longitude latitude order, including edges", () => {
  const bbox = [-80.3, 35.8, -80.2, 35.9];
  assert.equal(insideBBox(anchor, bbox), true);
  assert.equal(insideBBox({ lat: 36, lng: -80.25 }, bbox), false);
  assert.equal(insideBBox({ lat: 35.8, lng: -80.3 }, bbox), true);
});

test("category matches exact hierarchy tokens, never substring-matches car parks", () => {
  assert.equal(belongsToCategory(parking, "parks"), false);
  assert.equal(belongsToCategory(cafe, "coffee"), true);
  assert.equal(belongsToCategory(grocery, "groceries"), true);
});

test("radius filters and nearest records are consistent", () => {
  const results = nearbyByCategory([cafe, grocery, parking], anchor, 0.5, ["coffee", "groceries", "parks"]);
  assert.equal(results[0].count, 1);
  assert.equal(results[1].count, 1);
  assert.equal(results[2].count, 0);
  assert.equal(essentialsCount(results), 2);
  assert.deepEqual(results[0].closest.map((r) => r.place.id), ["c"]);
});

test("fast food and coffee are distinct from restaurants", () => {
  const fastFood: Place = { ...cafe, id: "f", category: "fast_food_restaurant", taxonomy: ["food_and_drink", "casual_eatery", "fast_food_restaurant"] };
  const restaurant: Place = { ...cafe, id: "r", category: "restaurant", taxonomy: ["food_and_drink", "restaurant"] };
  const bakery: Place = { ...cafe, id: "b", category: "casual_eatery", taxonomy: ["food_and_drink", "casual_eatery", "bakery"] };
  assert.equal(categoryForPlace(fastFood), "fast_food");
  assert.equal(belongsToCategory(fastFood, "restaurants"), false);
  assert.equal(categoryForPlace(restaurant), "restaurants");
  assert.equal(categoryForPlace(bakery), null);
  assert.equal(categoryForPlace(cafe), "coffee");
});

test("nearby lists preserve all results, rather than an arbitrary first three", () => {
  const places = Array.from({ length: 12 }, (_, i) => ({ ...cafe, id: `c-${i}`, name: `Cafe ${i}` }));
  const results = nearbyByCategory(places, anchor, 0.5, ["coffee"]);
  assert.equal(results[0].closest.length, 12);
  assert.equal(results[0].count, 12);
});

test("radius polygon is closed and every vertex stays near the chosen distance", () => {
  const ring = radiusRing(anchor, 0.5);
  assert.deepEqual(ring[0], ring[ring.length - 1]);
  assert.equal(ring.length, 73);
  for (const [lng, lat] of ring) assert.ok(Math.abs(milesBetween(anchor, { lng, lat }) - 0.5) < 0.0002);
  const [[west, south], [east, north]] = ringBounds(ring);
  assert.ok(west < anchor.lng && east > anchor.lng && south < anchor.lat && north > anchor.lat);
});

test("invalid radius fails loudly", () => {
  assert.throws(() => nearbyByCategory([cafe], anchor, 0, ["coffee"]), RangeError);
});
