# Using this repository

[Documentation index](README.md) · [Short assignment README](../README.md)

A few commands cover ordinary development. Python is needed **only** for Overture extraction and Python-based browser tests. From the repo root on macOS:

## First-time setup

```sh
# Node.js 22+ and pnpm 10.20.0; Corepack is optional if pnpm is already installed.
pnpm install --frozen-lockfile

# Create the isolated Python environment if you want data refreshes or E2E tests.
python3 -m venv .venv
source .venv/bin/activate
python -m pip install overturemaps
python -m pip install -r requirements-e2e.txt
python -m playwright install chromium
```

Homebrew-managed Python disallows system-wide pip installs (PEP 668). Use `.venv` rather than `--break-system-packages`. React/Next.js never require this Python environment to serve the committed data.

## Everyday work

```sh
pnpm dev                         # Local Next.js dev server: http://localhost:3000
pnpm check                       # Lint + types + Node/data tests + production build
pnpm audit --prod                # Production dependency advisories
pnpm build                       # Standalone production build
pnpm start                       # Start the production build (after pnpm build)
```

Corepack is a package-manager version shim, not a required build tool. Run `corepack pnpm ...` if you want it to honor the repo's pinned `packageManager`; `pnpm ...` is fine with the matching installed version.

## Browser checks (Chromium)

After `pnpm build`, start `pnpm start` in one terminal. In a second terminal:

```sh
source .venv/bin/activate
pnpm test:e2e                     # Deterministic basemap; real MapLibre worker
pnpm test:e2e:live                # Optional live tile provider check (network-dependent)
```

Python extraction/export unit tests:

```sh
python -m unittest discover -s scripts -p 'test_*.py' -v
```

## Refresh the Overture places

```sh
source .venv/bin/activate
pnpm data:refresh
```

This **downloads more than the app displays, deliberately**. The Overture CLI downloads **all `place` features** inside each city's bounding box as temporary GeoJSON, then `scripts/export_overture.py` keeps only records meeting the app's selection criteria: Point geometry, valid in-box coordinates, an ID and name, selected place categories, non-permanently-closed status, and confidence at least 0.55 when present. It also deduplicates by Overture ID and caps each city at 15,000 after sorting. Places not matching the current seven app categories are dropped; the discarded records are **not** secretly rendered or retained in the app. The temporary download and its CLI `.state` progress file live in the OS temp directory and are removed when extraction finishes normally. The only committed output is `data/places.json`, changed atomically after *both* towns succeed.

In the November 19 refresh: **2,669 Lexington + 3,332 Kernersville features downloaded; 204 + 220 (424 total) retained**, around 7.1% of the raw records. That is category/product filtering, not a silent failure to download the others. The dataset's `sources` property is also retained for provenance checks; see [Data attribution](DATA-ATTRIBUTION.md).

## Verify F-05: data coverage near the boundary

1. Open the app and select **A · Your current area**, which defaults to Smith Crossing in Kernersville.
2. Leave the sample area unchanged and click **3 mi** in the radius selector.
3. A **Partial map-data coverage** warning should appear by the map, plus a note in A's comparison card. The circle crosses the southern edge of the Kernersville extract.
4. Click **0.5 mi**. Both warnings should disappear.

This verifies **geographic boundary detection only**. Even entirely within the downloaded box, Overture may omit businesses or include outdated or duplicate entries. The Chromium suite also checks this boundary transition.

## Export a repo snapshot for AI review

```sh
pnpm repo:export
```

The exporter collects non-ignored repository files and screens for common secret patterns. **Inspect the resulting ZIP yourself before sharing**; automated checks cannot guarantee that every sensitive item is detected. Git metadata, `.venv`, build artifacts, and ignored local files are excluded.

## GitHub Actions

- `ci.yml`: lint, types, tests, production build, and Chromium browser checks on pull requests/pushes.
- `security.yml`: production dependency audit and CodeQL on relevant branches and weekly schedule.
- PRs and branch protection are optional for this solo project; GitHub CI is not automatically a Vercel deployment gate.
