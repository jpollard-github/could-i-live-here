import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { categoryForPlace } from "./categories.ts";
import { insideBBox } from "./geo.ts";
import type { PlacesDataset } from "./types.ts";

/** Validate the committed release artifact, not a hand-made sample fixture. */
test("the shipped Overture snapshot has usable, internally consistent records", () => {
  const path = resolve(process.cwd(), "data/places.json");
  const data = JSON.parse(readFileSync(path, "utf8")) as PlacesDataset;
  assert.equal(data.schemaVersion, 1);
  assert.ok(data.generatedAt && Number.isFinite(Date.parse(data.generatedAt)));
  assert.equal(data.source, "Overture Maps Places");
  assert.deepEqual(new Set(data.cities.map((city) => city.id)), new Set(["lexington", "kernersville"]));

  for (const city of data.cities) {
    assert.equal(city.bbox.length, 4);
    assert.ok(city.bbox.every(Number.isFinite));
    assert.ok(city.bbox[0] < city.bbox[2] && city.bbox[1] < city.bbox[3]);
    assert.ok(city.places.length > 0, `${city.name}: empty release data`);
    const ids = new Set<string>();
    let classified = 0;
    for (const place of city.places) {
      assert.ok(place.id && place.id.trim(), `${city.name}: missing place ID`);
      assert.ok(!ids.has(place.id), `${city.name}: duplicate place ID ${place.id}`);
      ids.add(place.id);
      assert.ok(place.name.trim(), `${city.name}: missing name`);
      assert.ok(Number.isFinite(place.lat) && Number.isFinite(place.lng), `${city.name}: invalid coordinates`);
      assert.ok(insideBBox(place, city.bbox), `${city.name}: place outside extract bounds`);
      assert.ok(Array.isArray(place.taxonomy), `${city.name}: invalid taxonomy`);
      if (categoryForPlace(place)) classified++;
    }
    assert.ok(classified > 0, `${city.name}: none of the records match a visible category`);
  }
});
