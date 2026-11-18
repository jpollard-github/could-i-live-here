import test from "node:test";
import assert from "node:assert/strict";
import { formatDistance, insideBBox, milesBetween } from "./geo.ts";
import { belongsToCategory } from "./categories.ts";
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

test("invalid radius fails loudly", () => {
  assert.throws(() => nearbyByCategory([cafe], anchor, 0, ["coffee"]), RangeError);
});
