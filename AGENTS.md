# Working in this repo

The product promise: compare a Kernersville reference (A) against Lexington candidates (B), or any two downloaded NC areas, against real mapped amenities nearby. The user makes the judgment; we do not invent quality scores or travel times.

## Guardrails
- Keep the architecture small: Next.js App Router, client-side MapLibre, one checked-in JSON snapshot, Python extraction, and no database, login, server-side geocoding, or AI integration.
- **Do not fabricate Overture records.** `data/places.json` must come from `python3 scripts/export_overture.py`; an empty snapshot is an honest setup state, not permission to add pretend place names. Preserve IDs and extraction metadata.
- Keep a 0.5-mile initial radius, no categories preselected, and explain map interactions (select A/B, click empty map or drag pin; click place dots to inspect, not move the pin). Never impose a first-three-results cap: use scrollable lists.
- Fast food and restaurants are separate filters; the seven category colors must agree between filters, map, and lists. Do not label restaurants locally owned without ownership data.
- Use exact Overture `basic_category`/`taxonomy` tokens. The old `categories` field was removed in September 2026. Avoid substring-based classifiers (`car_park` is not `park`). Keep `src/lib/categories.ts` and `scripts/export_overture.py` in sync.
- Every distance is straight-line, not road network, drive time, or walk time.
- Keep no personal location histories, cookies, user accounts, API keys, or third-party analytics. In operational logs, never include a user's clicked coordinates or names.
- Simple keyboard-usable controls, clear empty/error states, responsive layout, and readable contrast take priority over animation.
- Prefer small pure functions with focused tests. Do not add dependencies just for a helper.

## Commands
- `corepack pnpm install`
- `corepack pnpm data:refresh` (requires an activated `.venv` with `pip install overturemaps`, plus internet)
- `corepack pnpm dev`
- `corepack pnpm check` (lint/typecheck/tests/build)
- `python3 -m unittest discover -s scripts -p 'test_*.py' -v`
- `corepack pnpm repo:export` (Git-based review ZIP, ignores local secrets)

## What was intentionally cut
No address geocoder, third-party home-listing integration, route engine, "livability score," account storage, analytics service, scheduled ETL, GIS database, or backend place-search API. Add one only if a real user need pays for its cost.
