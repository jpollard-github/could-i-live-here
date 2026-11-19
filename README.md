# Could I Live Here?

**One-sentence pitch:** Compare what everyday life might look like around your current location and a possible new home, using nearby places from Overture Maps rather than an invented neighborhood score.

A small, usable neighborhood explorer for somebody considering a move. **The real story:** Jason is considering leaving Kernersville for Lexington and wants to compare the everyday places near his current neighborhood with several plausible Lexington areas. Sample areas are geographic starting points, **not listings or recommendations**.

**Reviewer / interview deep dive:** [Adversarial engineering review, decision record, security and accessibility limitations, and tough Q&A](docs/ENGINEERING-REVIEW.md). It distinguishes actual checks from aspirational tooling and documents the next highest-value fixes.

The site includes a short first-visit walkthrough (replay with **Take the tour**) and a **Why this exists** dialog explaining the product and implementation choices. The tour can be dismissed at any step; only its dismissed/seen state is remembered locally, not the map pins or filters.

By default, **A starts in the Smith Crossing area of Kernersville, NC** and **B is a downtown Lexington, NC candidate**. The A point represents the general apartment-complex area, not a verified unit/address geocode. Switch B among example areas or place either pin anywhere within the downloaded region. The supplied coordinates are **not home listings**. The user decides what matters.

## How to use it

1. Select **A** (where you live now) or **B** (where you might move). The map shows the selected location; the other location remains in the comparison below.
2. Choose a town and sample area to **reset the map and circle to that location**, or **click empty map space / drag the letter pin** to place A or B precisely. Use **Center map on A/B** if you have panned the map away. Clicking a colored dot *inspects that place* and does not move the pin.
3. Enable the amenity categories you care about. All are **off by default**. The dashed circle is **0.5 miles** by default. Change the straight-line radius if useful.
4. Compare the results for A and B. Click **any non-control part of a comparison card** to show it on the map (or use its View button); Browse buttons also switch the map as they expand. **Browse** any category to scroll through **all** matching mapped places; selecting a result highlights it on the map without losing focus.

Seven distinct filters: Groceries, Coffee & cafés, Pharmacy, Parks, Restaurants, Fast food, Hardware. Fast food is separate from restaurants, and cafés are separate from both. **“Restaurants” does not mean locally owned**; Overture cannot establish ownership consistently, so we make no such claim.

## Run locally

Needs Node 22+, Python 3, and pnpm 10.20.0 (version declared in `package.json`). **Corepack is optional** if you already have pnpm of the declared version; its purpose is to obtain/use the pinned package manager without installing a global pnpm manually. Corepack is a package-manager bootstrapper, *not a runtime dependency or a web framework*.

```bash
# One-time if pnpm isn't installed (with Node 22's bundled Corepack):
corepack enable
corepack pnpm install --frozen-lockfile

# Python extraction dependencies are isolated from Homebrew's Python:
python3 -m venv .venv
source .venv/bin/activate
python -m pip install overturemaps

# The ZIP already includes a real source extract; refresh it when desired:
corepack pnpm data:refresh
corepack pnpm dev
```

Open http://localhost:3000. If you installed the matching pnpm independently, replace `corepack pnpm` with `pnpm`. The environment must have internet access for the Overture CLI and basemap tiles. MapLibre v6 requires a separate module worker: `predev` and `prebuild` copy the version-matched worker into ignored `public/vendor/maplibre-gl/<version>/` and `MapPanel` explicitly selects its URL. A missing worker fails the build instead of silently shipping a blank map. `data:refresh` atomically updates `data/places.json`, preserving the previous snapshot if either town fails. `.venv/` is gitignored. Never use `--break-system-packages`.

## Engineering decisions and trade-offs

| Choice | Reason | Deliberate limitation |
| --- | --- | --- |
| **Next.js / React / TypeScript** | Familiar component model, straightforward Vercel deployment, strong types for the small data model; same stack can support future features | No need for a custom API server today |
| **pnpm + locked dependencies** | Efficient content-addressed package store, predictable installs, strict dependency graph; `packageManager` pins the CLI version | Corepack only activates the pinned pnpm; no runtime dependency |
| **Plain CSS** | Fast, distinctive field-guide design without a component library | A few hand-written responsive styles |
| **MapLibre + OpenFreeMap** | Interactive map, colored place dots, draggable anchors, real geographic radius polygon, no map API keys | Basemap tiles need a network connection |
| **Bounded static Overture Places JSON** | Actual open geodata; no API key, database, or runtime query costs; fast client-side filters for hundreds of places | Only the downloaded NC areas are searchable, and coverage/accuracy vary |
| **Python extraction (offline only)** | Overture's maintained `overturemaps` Python CLI downloads GeoJSON by bounding box; a short script validates, normalizes, and atomically replaces the snapshot | A second developer toolchain, kept out of the deployed app. Rewriting the extract in TypeScript would add code without a user benefit |
| **Great-circle distance** | Mathematically well-defined radius that can be rendered as a geographic circle | **Not walking distance, road access, or travel time** |
| **Two positions, one map view** | Useful Kernersville-versus-Lexington comparison without zooming so far out the 0.5-mile details disappear | Change A/B to switch the map; the result cards stay side by side |
| **No ranking/AI recommendation** | User chooses essentials, reads evidence, and makes the judgment | No invented quality or “livability” score |

Overture classifications are derived from exact `basic_category` and taxonomy tokens. We exclude broad `casual_eatery` from restaurants so bakeries and dessert shops do not inflate restaurant counts, and `fast_food_restaurant` is classified separately. We deliberately do not infer independent vs chain ownership. A place may still be duplicated, stale, misclassified, or missing; the UI calls results **mapped matches**, never an exhaustive census. Only places within the active radius are drawn, reducing dot overload.

## Quality / operations

```bash
corepack pnpm lint               # ESLint
corepack pnpm typecheck          # TypeScript
corepack pnpm test               # Node's built-in test runner
python3 -m unittest discover -s scripts -p 'test_*.py' -v
corepack pnpm build              # production Next.js build
corepack pnpm check              # all four JavaScript checks, including build
# In another terminal, run corepack pnpm start after building.
# Then, from the Python .venv with playwright installed:
corepack pnpm test:e2e           # real Chromium, deterministic basemap fixture
corepack pnpm test:e2e:live      # optional live OpenFreeMap smoke test
corepack pnpm repo:export        # review ZIP using Git ignore rules
```

GitHub Actions runs lint, types, tests (including validation of the committed source snapshot), build, Python extraction/export tests, and **Chromium/Playwright browser tests** against the built Next.js app. The browser suite stubs only the remote basemap style, leaving MapLibre's Web Worker and the application controls real. It verifies the map worker actually starts, the geography sources reach idle, selecting a new sample area moves the map, filtering shows comparisons, and the tour dismisses. An optional live-style smoke test is available locally. See [browser test rationale](tests/e2e/README.md). The committed `pnpm-lock.yaml` is installed with `--frozen-lockfile`. `/api/health` returns 200 when the snapshots exist, and 503 if incomplete. Errors are logged in structured form, without user pin coordinates or search history. No cookies, accounts, analytics, API keys, user data store, or external geocoder. One `localStorage` flag remembers whether the visitor has seen/dismissed the optional walkthrough; it does **not** store chosen places, coordinates or preferences.

GitHub Actions is **automated on pushes and pull requests**, not a recurring task: it tests and builds the same code that Vercel deploys, plus Python extraction unit tests. The existing Node built-in test runner and Python `unittest` cover pure data/geometry and ETL logic without a testing framework dependency. Browser automation does not replace human review of visual details, accessibility, real tile-provider outages, responsive layout, or keyboard map navigation.

### Why two languages, and how I work with AI

**Python is a build-time data preparation tool, not an application runtime.** The official Overture Python tooling provides the straightforward bounding-box GeoJSON download we need. Our script verifies locations, keeps useful taxonomy and confidence metadata, excludes irrelevant records, and writes a compact versioned JSON snapshot. Next.js/TypeScript and MapLibre are responsible for every deployed interaction. Both towns can be served entirely as static data; no request reaches a Python process in Vercel. The separate review-ZIP script also uses Python's standard library, avoiding another Node dependency just to archive source files. If the project became a larger live-data platform, that separation would deserve reconsideration.

My AI-assisted workflow is intentionally selective:

1. **Editor-level AI (such as Codex)** for contained programming tasks and local code iteration.
2. **ChatGPT/general AI** for product framing, architectural evaluations, broader refactors, and independent review.
3. **A deliberate manual checkpoint:** `pnpm repo:export` generates a review ZIP using Git's ignore rules. I upload that ZIP to ChatGPT when I want a complete repository review. I inspect proposed changes, run checks, and decide what to merge or ship.

More of this handoff could be automated. I don't currently want an AI agent independently sending repository content, rewriting broad areas, or merging changes without my choice and review. This process is a conscious tradeoff favoring accountable decisions over automation for its own sake.

The exporter lives in `scripts/export_repo.py`; its skill documentation lives in `.agents/skills/repo-export/SKILL.md`. It includes unignored tracked/untracked source except known sensitive filename formats, and omits `.git`, `.venv`, installed packages, environment files and other ignored data. **This is not credential-content scanning:** manually inspect the archive before sharing. See the [engineering review](docs/ENGINEERING-REVIEW.md) for unresolved checks, including browser accessibility, dependency audits, deployment gating, and per-record data provenance.

## Source, attribution, and cuts

Places: [Overture Maps Foundation](https://overturemaps.org/) Places theme; check [schema/licensing](https://docs.overturemaps.org/guides/places/) and [data access](https://docs.overturemaps.org/getting-data/). Basemap: [OpenFreeMap](https://openfreemap.org/), OpenMapTiles and OpenStreetMap contributors (MapLibre attribution control). `data/places.json` is a checked-in extract with generation time and source metadata; update it via `scripts/export_overture.py`, not manual additions.

**Not built:** embedded resume or a portfolio landing page (this is a product demo, not a personal homepage), address geocoding, Zillow integration, routing, live opening hours, ownership determination, quality ranking, accounts, database, deployment jobs, scheduled data updates, or map analytics. Each would add cost or claim more than the data supports.
