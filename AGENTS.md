# Working in this repo

The product promise: compare a Kernersville reference (A) against Lexington candidates (B), or any two downloaded NC areas, against real mapped amenities nearby. The user makes the judgment; we do not invent quality scores or travel times.

## Guardrails
- Keep the architecture small: Next.js App Router, client-side MapLibre, one checked-in JSON snapshot, Python extraction, and no database, login, server-side geocoding, or AI integration.
- **Do not fabricate Overture records.** `data/places.json` must come from `python3 scripts/export_overture.py`; an empty snapshot is an honest setup state, not permission to add pretend place names. Preserve IDs and extraction metadata.
- Keep a 0.5-mile initial radius, no categories preselected, and explain map interactions (select A/B, click empty map or drag pin; click place dots to inspect, not move the pin). Never impose a first-three-results cap: use scrollable lists.
- Fast food and restaurants are separate filters; the seven category colors must agree between filters, map, and lists. Do not label restaurants locally owned without ownership data.
- Use exact Overture `basic_category`/`taxonomy` tokens. The old `categories` field was removed in September 2026. Avoid substring-based classifiers (`car_park` is not `park`). Keep `src/lib/categories.ts` and `scripts/export_overture.py` in sync.
- Every distance is straight-line, not road network, drive time, or walk time.
- Keep no personal location histories, cookies, localStorage preferences, user accounts, API keys, or third-party analytics. The tour opens **only on user request**, not on the first visit. In operational logs, never include a user's clicked coordinates or names.
- Simple keyboard-usable controls, clear empty/error states, responsive layout, and readable contrast take priority over animation. The optional tour must always be dismissible and replayable; the rationale dialog must remain readable on narrow screens.
- Sample-area selection must recenter the map and circle even while tiles are loading. Do not gate camera movement on `map.isStyleLoaded()`. Keep direct place inspection separate from A/B pin placement.
- Prefer small pure functions with focused tests. Do not add dependencies just for a helper.

## Commands
- `corepack pnpm install`
- `corepack pnpm data:refresh` (requires an activated `.venv` with `pip install overturemaps`, plus internet)
- `corepack pnpm dev`
- `corepack pnpm check` (lint/typecheck/tests/build)
- `python3 -m unittest discover -s scripts -p 'test_*.py' -v`
- `corepack pnpm repo:export` (Git-based review ZIP, ignores local secrets)
- `corepack pnpm test:e2e` (with app running and Playwright Python installed; deterministic browser checks)

MapLibre 6 needs a module worker served from the same origin. `predev`/`prebuild` prepare it; do not remove `setWorkerUrl()` or bypass the browser tests when upgrading MapLibre.

## What was intentionally cut
No address geocoder, third-party home-listing integration, route engine, "livability score," account storage, analytics service, scheduled ETL, GIS database, or backend place-search API. Add one only if a real user need pays for its cost.

## Project context and AI collaboration

The app was motivated by a real Kernersville-to-Lexington comparison, not a listing service. Keep the app and tutorial user-centric and second-person; identify the author only in the byline, not as a character in the comparison. Keep the rationale dialog compact.

Python is deliberately limited to offline Overture CLI extraction and the optional review-export script. TypeScript handles the deployed app; no Python service or database is warranted. Keep the short rationale in README; depth belongs in `docs/ARCHITECTURE.md`.

Developer workflow is selective: in-editor Codex/AI for code tasks; ChatGPT/general AI for product direction, larger changes and review via the repo-export skill. The engineer chooses what to delegate and reviews changes; never imply a completely automated coding or submission process.

## Engineering review / unverified claims

Read [`docs/README.md`](docs/README.md) and [`docs/REVIEW-FINDINGS.md`](docs/REVIEW-FINDINGS.md) before asserting production readiness, security clearance, or accessibility conformance. Prefer a concrete failure mode and a verified test over generic CI tooling. Do not say that CI success gates Vercel production deployments without checking branch protection/deployment settings. Do not claim `pnpm repo:export` is secret scanning; inspect its ZIP before uploading.

## Lightweight review and security workflow

For this educational trial, put the next meaningful change on a short-lived branch and consider a PR to main. CI, dependency auditing and CodeQL run on PRs; no branch-protection gate is enforced. See `docs/QUALITY.md` and `docs/REVIEW-FINDINGS.md`. Before exporting a ZIP for AI review, check its contents: filename and content scanning are best-effort, not permission to share private keys or credentials.
