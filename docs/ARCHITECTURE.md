# Architecture, data, and operations

A small read-only mapping product: cost/benefit decisions, source-data limits, license questions, and operational boundaries. See [docs index](README.md).

## Architecture and why the stack is this small

```text
        Overture Places cloud data (outside the app)
                          |
                  overturemaps CLI
                          |
       scripts/export_overture.py (Python, offline)
                validate / filter / sort
                          |
                 data/places.json (Git)
                          |
             Next.js/React/TypeScript
                |                  |
           Filter, compare       MapLibre
           Haversine distance    OpenFreeMap tiles
                |                  |
                 Vercel deployment
```

**Next.js / TypeScript.** It works with an existing Vercel deployment, supports a typed React UI and CI build, and leaves room for future product features. **Challenge:** Could Vite do this with fewer moving parts? Yes. Next.js is partly a deployment/familiarity choice, not a mathematical requirement. A reviewer should be allowed to ask what the framework has earned. The current app has one read-only health endpoint, so we have not needed most server framework features.

**Python, narrowly.** The official Overture tooling already supplies a convenient bounding-box GeoJSON extract. Python's standard library makes ingestion normalization, atomic replacement, and source ZIP generation simple. Python is **not deployed** and not in the request path. It is justified as a small build-time boundary, not a statement that two languages are inherently better. Costs: `.venv`, independent dependencies, extra CI tests. A future migration to a single-language pipeline is reasonable if it reduces net complexity; it is not necessary for 483 places.

**Static data.** 227 Lexington places and 256 Kernersville places in the uploaded snapshot (counts at review time). JSON is ~134 KB on disk. For this use, client-side filtering avoids backend traffic and API keys. The product is constrained to two pre-extracted regions; expansion would change the tradeoff. Ingestion can be refreshed offline and committed, rather than making every browser call Overture.

**MapLibre + OpenFreeMap.** The map is a presentation layer, not the source of truth. The actual result arrays come from pure distance/category functions. OpenFreeMap basemap availability and its third-party request implications are external dependencies, and MapLibre attribution should remain visible. The lists continue to function if tiles fail.

**No database or accounts.** There are no saved comparisons, user identities, or mutable server-side product state. Introducing managed persistence for two in-memory points would add operational/security burden without solving an observed user problem.

## Data correctness, provenance, and licensing

**Source fidelity.** We select only Point features, bounded by the configured city boxes; use a confidence threshold of 0.55; exclude known permanently-closed statuses; classify by **exact taxonomy tokens**, not substring; and keep one record per Overture ID. The extract is committed and updated atomically. The UI says “mapped matches” because empty results do not establish absence in real life.

**What isn't guaranteed:** category completeness, business hours, actual pedestrian access, whether a place is still open, whether a pin is at a building entrance, or whether multiple Overture IDs are duplicate businesses. An Overture confidence value is **not a calibrated probability of business existence**, and 0.55 is a heuristic, not empirically justified here.

**Two important edge cases:**

1. A selected circle near a bounding-box edge is only partially sampled, even though the whole circle is drawn. At this snapshot the app does not flag this. That's a correctness issue, not a preference.
2. `MAX_PER_CITY = 15_000` prevents runaway file size but slices *after alphabetic sorting*. That makes a larger-city snapshot systematically biased toward names near the start of the alphabet. Current city sizes don't trigger this; do not claim the approach scales unchanged.

**Licensing/provenance deserves more work.** Overture's [official attribution page](https://docs.overturemaps.org/attribution/) distinguishes Places providers (including CDLA Permissive 2.0, Apache 2.0 for Foursquare with an associated NOTICE, and CC0). Our exported JSON drops `sources[]`, preventing an exact source/license audit for individual records. Credit in the footer is a useful start but does not, by itself, demonstrate that redistribution notices have been handled correctly. Before treating the extract as a reusable data product, preserve source identifiers/licenses and determine which notices need to ship. Consult the [Foursquare notice linked by Overture](https://docs.overturemaps.org/attribution/) and applicable license terms, rather than assuming a blanket “open source = no attribution duties.” The basemap is a separate OpenFreeMap/OSM attribution question.

**Reproducibility limit:** Git pins the *resulting extract* via version control, but the Python `overturemaps` package is not version-pinned, and the CLI defaults to a source release that can change. For a long-lived product, pin tool version and record source release ID in `generatedAt` metadata. The current script does not do that.

## Operational behavior, performance, and deployment

**Operations now:** A checked-in data snapshot permits availability independent of the live Overture API. `/api/health` returns a signal that both city arrays contain entries and includes extract metadata. It does **not** verify basemap tiles, actual taxonomy validity, or user interaction. Browser failures are written to developer console; Vercel server logs cover the health endpoint, not arbitrary client error events.

**Data refresh:** Explicit, controlled command. The old JSON survives if any town's extract fails. That is a valuable transactional guarantee even for a tiny pipeline. A scheduled data-refresh bot adds failure modes, surprise diffs, and unnoticed taxonomy changes; manual refresh is acceptable for a take-home as long as freshness is stated.

**Performance assumptions (not measurements):** ~483 places across two cities and a ~134 KB JSON source file are small enough for in-memory filtering and client-side rendering on typical devices. This is a reason to *expect* reasonable performance, not a benchmark. 109 matching dots on a map can be unusable even if rendering them is fast. Test real mobile hardware and slow networks before promising performance; optimize only measured bottlenecks. No need for microservices or load testing of a nonexistent backend.

**Deployment:** Vercel can deploy the app. Do not confuse “it is live” with “it passed a release checklist.” Before submission, verify the exact production URL and commit, `/api/health` response, meaningful map interactions, browser console, small viewport, and source/attribution links.
