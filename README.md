# Could I Live Here?

**Pitch:** Before you fall for the house, meet the neighborhood. Compare two points in Lexington or Kernersville, NC, by the actual places mapped near them.

A deliberately small take-home product: pick locations, choose six kinds of everyday essentials, set a radius, and compare counts and nearest examples on a map. No made-up "livability" score. The intended user is somebody deciding between places to live.

## Start

Requires **Node 22+**, **Corepack / pnpm**, and **Python 3** for the one-time map extraction.

```bash
corepack enable
corepack pnpm install
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install overturemaps
corepack pnpm data:refresh
corepack pnpm dev
```

Open http://localhost:3000. The generated `data/places.json` is what the website ships. **The download ZIP contains an intentionally empty snapshot, not invented Overture records: run the refresh before deploying or evaluating real places.** If the download fails, the old snapshot is preserved. Run `corepack pnpm check` before submitting.

## Why this product

Home listings describe the property, but not whether everyday routines are convenient. A small, inspectable comparison is more honest than an opaque neighborhood score.

## Design and trade-offs

- Next.js App Router + TypeScript + plain CSS; no component framework. MapLibre uses OpenFreeMap's public basemap. Built for Vercel; no server-side database.
- A Python script calls the **official Overture Maps CLI** to download bounded Places GeoJSON for two NC towns, filters exact taxonomy categories, omits unnamed/low-confidence entries, and writes one compact, versioned JSON snapshot. The app makes no runtime Overture API calls.
- The map is optional: tiles require network, but comparison controls and data still work without them.
- Selection is by map click or preset coordinates, not address search. Presets are **areas**, not verified home listings.
- Distances are great-circle miles. They are neither a route nor travel-time estimate.
- Overture may miss, misclassify, or duplicate places. "No mapped matches" means no matching records in the selected radius, **not** proof an amenity doesn't exist. Data freshness is displayed.
- No tracking, accounts, geocoding API keys, database, routing, home values, or automatic scheduled refresh. This slice does not earn those costs.

## Quality / operations

`corepack pnpm check` runs ESLint, TypeScript, Node's focused tests, and a production Next.js build. `python3 -m unittest discover -s scripts -p 'test_*.py' -v` covers the extraction filter. GitHub Actions runs both. `/api/health` returns 200 when both city snapshots contain supported places; 503 when setup is incomplete. The health endpoint logs a structured status; client map and render failures log structured error events without user coordinates.

Export a reviewable repo with `corepack pnpm repo:export`. It uses Git's ignore rules, includes untracked unignored files, and excludes `.git`, `.env*`, and installed dependencies. The agent instruction lives at `.agents/skills/repo-export/SKILL.md`.

## Data and attribution

Places: [Overture Maps Foundation](https://overturemaps.org/), Places theme (CDLA Permissive 2.0 / Apache 2.0, depending on source). [Schema and licensing](https://docs.overturemaps.org/guides/places/) · [Source access](https://docs.overturemaps.org/getting-data/). Basemap: [OpenFreeMap](https://openfreemap.org/) / OpenMapTiles / OpenStreetMap, credited by MapLibre.

For a deployment, commit `data/places.json` after running the extraction. It contains *mapped places*, not users' home addresses. Never upload credentials or customer location histories.
