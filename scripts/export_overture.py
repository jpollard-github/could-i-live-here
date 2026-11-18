#!/usr/bin/env python3
"""Extract small, verified Overture Places slices for the shipped static app.

No authentication and no app runtime data API. Requires the official Overture CLI
only when downloading; --input-dir allows independently testing an existing extract.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "places.json"

# Keep categories readable and explicit; changes should be reflected in
# src/lib/categories.ts. Exact token comparisons prevent 'car_park' -> 'park'.
CATEGORY_TOKENS = {
    "grocery_store", "supermarket", "grocery", "food_market", "farmers_market",
    "coffee_shop", "coffeehouse", "cafe", "tea_house",
    "pharmacy", "drugstore",
    "park", "public_park", "playground", "botanical_garden", "nature_reserve",
    "restaurant", "casual_eatery", "fast_food_restaurant", "diner", "bistro",
    "hardware_store", "home_improvement_store", "building_materials_store", "tool_store",
}
MAX_PER_CITY = 15_000
CONFIDENCE_FLOOR = 0.55  # Tunable; the Overture confidence scale is not a guaranteed probability.


def normalize(feature: dict[str, Any], bbox: list[float]) -> dict[str, Any] | None:
    if feature.get("geometry", {}).get("type") != "Point":
        return None
    point = feature["geometry"].get("coordinates", [])
    if len(point) < 2 or not all(isinstance(value, (float, int)) for value in point[:2]):
        return None
    lon, lat = point[:2]
    if not (bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]):
        return None
    props = feature.get("properties") or {}
    name = (props.get("names") or {}).get("primary")
    if not isinstance(name, str) or not name.strip():
        return None
    confidence = props.get("confidence")
    if isinstance(confidence, (int, float)) and confidence < CONFIDENCE_FLOOR:
        return None
    status = str(props.get("operating_status") or "").lower()
    if status in {"permanently_closed", "closed_permanently"}:
        return None
    taxonomy = props.get("taxonomy") or {}
    hierarchy = taxonomy.get("hierarchy") or []
    primary = taxonomy.get("primary")
    raw_tokens = hierarchy + ([primary] if isinstance(primary, str) else [])
    tokens = [value for value in raw_tokens if isinstance(value, str)]
    basic = props.get("basic_category") or ""
    if not CATEGORY_TOKENS.intersection({basic, *tokens}):
        return None
    identifier = feature.get("id") or props.get("id")
    if not isinstance(identifier, str) or not identifier:
        return None
    addresses = props.get("addresses") or []
    address = addresses[0].get("freeform") if addresses and isinstance(addresses[0], dict) else None
    result = {
        "id": identifier,
        "name": name.strip()[:160],
        "lng": round(float(lon), 7),
        "lat": round(float(lat), 7),
        "category": basic if isinstance(basic, str) else "",
        "taxonomy": tokens,
    }
    if isinstance(address, str) and address.strip():
        result["address"] = address.strip()[:200]
    if isinstance(confidence, (int, float)):
        result["confidence"] = round(float(confidence), 3)
    return result


def parse_geojson(path: Path, bbox: list[float]) -> list[dict[str, Any]]:
    content = json.loads(path.read_text(encoding="utf-8"))
    if content.get("type") != "FeatureCollection" or not isinstance(content.get("features"), list):
        raise ValueError(f"{path} must be a GeoJSON FeatureCollection")
    dedup: dict[str, dict[str, Any]] = {}
    for feature in content["features"]:
        if not isinstance(feature, dict):
            continue
        place = normalize(feature, bbox)
        if place is not None:
            dedup[place["id"]] = place
    if not dedup:
        raise ValueError(f"No supported places from {path}; check bbox, taxonomy, and source data")
    return sorted(dedup.values(), key=lambda place: (place["name"].lower(), place["id"]))[:MAX_PER_CITY]


def download(name: str, bbox: list[float], destination: Path) -> None:
    print(f"Downloading {name} from Overture Maps: {','.join(str(v) for v in bbox)}", flush=True)
    subprocess.run([
        "overturemaps", "download", "--type=place", f"--bbox={','.join(map(str, bbox))}",
        "-f", "geojson", "-o", str(destination),
    ], check=True)


def run(input_dir: Path | None) -> None:
    current = json.loads(OUTPUT.read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory(prefix="overture-places-") as temp:
        working = Path(temp)
        result = []
        for city in current["cities"]:
            source = input_dir / f"{city['id']}.geojson" if input_dir else working / f"{city['id']}.geojson"
            if not input_dir:
                download(city["id"], city["bbox"], source)
            if not source.is_file():
                raise FileNotFoundError(f"Missing required source file: {source}")
            places = parse_geojson(source, city["bbox"])
            result.append({**{key: city[key] for key in ["id", "name", "region", "center", "bbox"]}, "places": places})
            counts = Counter(place["category"] for place in places)
            print(f"  {city['name']}: {len(places):,} mapped essentials; most frequent: {counts.most_common(5)}")
    output = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Overture Maps Places",
        "cities": result,
    }
    # Only publish after both city extracts succeeded, preserving the old snapshot on failure.
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=OUTPUT.parent, delete=False, suffix=".json") as tmp:
        json.dump(output, tmp, ensure_ascii=False, separators=(",", ":"))
        tmp.write("\n")
        temp_path = Path(tmp.name)
    temp_path.replace(OUTPUT)
    print(f"Updated {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size / 1024:.1f} KiB)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, help="Use existing city GeoJSON files instead of network downloads")
    args = parser.parse_args()
    try:
        run(args.input_dir)
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError, OSError) as exc:
        print(f"Data refresh failed (original snapshot preserved): {exc}", file=sys.stderr)
        sys.exit(1)
