# Verification, security, and operations

What is tested, what remains unverified, the threat model, and how to reproduce checks. See [docs index](README.md) and [living findings](REVIEW-FINDINGS.md).

## Security and privacy: threat model

**Assets and exposure:** Public source code, public map dataset, and a read-only website. No credentials, sessions, accounts, payment details, database mutations, or personal histories are intended. The primary threats are a vulnerable dependency, malicious/incorrect third-party source data, unsafe rendering, inadvertent disclosure through exported archives, and browser network requests to the basemap provider.

| Concern | What the code currently does | Residual risk / action |
| --- | --- | --- |
| Untrusted place names and addresses | React renders text; hover popup calls MapLibre `setText()` rather than `setHTML()` | Strong default against HTML injection in these paths; still inspect new rendering paths before adding them |
| Network/API attack surface | No app write API. Only `/api/health` returns extract metadata | Low app-level input exposure, not zero framework/supply-chain exposure |
| Secret handling | No app keys; exporter respects ignore rules and now excludes common key-file formats | **Not a secret scanner.** Audit Git history and exported contents manually; future automation could use gitleaks |
| Dependencies | Frozen pnpm lockfile for Node builds | A prior `pnpm audit --prod` reported the vulnerable MapLibre range and prompted the upgrade. Re-run the audit on the current lockfile before claiming a clean dependency state |
| Basemap and privacy | Map tiles load from OpenFreeMap | Third party receives network requests for visible areas plus ordinary request metadata; don't claim “the browser contacts nobody” |
| Browser headers | `poweredByHeader: false`; no explicit CSP or customized security header policy | Good follow-up if exposed beyond a demo; CSP must be tested with MapLibre workers/styles/tiles before enabling |
| Data provenance | Committed normalized snapshot and source name | Per-feature origin and license data currently stripped; see [architecture and data](ARCHITECTURE.md) |
| Client-side errors | `console.error` structured event with broad type, no coordinates | Not centralized monitoring; errors may go unnoticed |

**What I actually reviewed:** `src/components/explorer.tsx`, `map-panel.tsx`, `walkthrough.tsx`, `about-dialog.tsx`, geographic/category functions, health route, scripts, package/lock files, GitHub Actions, Vercel config, and the extracted dataset structure. This was manual static inspection plus the checks described below. **Not performed:** authenticated penetration test (not applicable to this app), DAST, browser runtime fuzzing, third-party dependency audit, deployment-header inspection, or Git-history secret scan. No claim of full “secure” status is warranted.

## Verification: what CI does and does not establish

The local `pnpm check` runs ESLint, TypeScript checks, Node unit/data tests, and a Next.js production build. GitHub Actions also runs Python unit tests and real Chromium/Playwright tests against a running production build. Browser tests use a deterministic basemap fixture so third-party tile outages do not randomly fail CI; they still instantiate the actual MapLibre worker. A separate optional **live** provider smoke test is available.

| Layer | Implemented evidence | Still not established |
| --- | --- | --- |
| Syntax, types, build | ESLint, TypeScript, Next.js production build | Visual behavior, accessibility, vulnerability-free dependencies |
| Geographic and category logic | Node tests and checked-in data integrity tests | Source completeness, accurate business classification on the ground |
| Offline extraction and review archive | Python `unittest` for normalization, constraints, exporter safeguards | Remote Overture release drift; archive-wide secret-content scanning |
| Browser interactions | Chromium E2E: MapLibre worker/source readiness, sample reset, A/B switch, filters, tour | Full screen-reader support, mobile device matrix, actual tile-provider uptime |
| Dependency security | `pnpm audit --prod` is a **manual** command; previously flagged MapLibre version was upgraded | Independent current zero-advisory result and continuous automated audit gate |
| Deployment | Vercel Git integration; CI runs on push/PR | Branch-protection / required check gating of Vercel production not verified |
| Monitoring | `/api/health` for source presence; console errors | Client error aggregation or continuous third-party tile availability |

This is a risk-driven menu, **not a mandatory enterprise checklist**. No database means no Postgres integration test; no container means no image registry. Code coverage percentages would be unhelpful without meaningful browser and data-quality assertions. Add verification for observed failure modes, then document what is still unverified.

**MapLibre regression:** MapLibre v6 changed module worker loading. The upgrade resolved an audited vulnerable range but caused a blank map despite a passing build. The code now prepares a version-matched same-origin worker and the browser suite verifies the actual worker and geographic source readiness. See [incident below](#maplibre-6-worker-incident-and-browser-regression-tests).

**Release nuance:** `push`/`pull_request` CI checks do not by themselves prove Vercel blocks deploying a failing commit. Require checks in repository/deployment settings before making a release-gating claim.

## Reproduce the checks

```bash
# From the repo root. Node 22+, pinned pnpm, and Python 3 are expected.
corepack pnpm install --frozen-lockfile
corepack pnpm check
python3 -m unittest discover -s scripts -p 'test_*.py' -v

# Review the actual committed snapshot (also included in `pnpm test`):
node --experimental-strip-types --test src/lib/data.test.ts

# Dependency audit is manual, not part of CI:
corepack pnpm audit --prod

# Export; inspect ZIP file list and contents before sharing anywhere:
corepack pnpm repo:export

# Check the deployed data service:
curl -i https://could-i-live-here.vercel.app/api/health
```

**Manual browser smoke (in addition to automated tests; not claimed passed by this document):** Fresh/private browser session: tour stays closed until requested, Escape closes, replay works; both A/B cards activate; choosing another Lexington sample area recenters the circle and pin; choose coffee + pharmacy and compare A/B counts; select an individual result, verify map focus and no pin move; change radius; drag a pin outside the loaded box and check the warning; test 360px width and 200% zoom; repeat key actions without mouse; inspect console and map-tile fallback. Note defects; do not substitute “seems okay” for the list.

**Review basis:** Source inspection of the uploaded 2026-11-18 snapshot and the checks documented in this repository. Browser tests have since been added in source and CI; no claim is made here that an independent production browser run, accessibility audit, or current dependency audit was completed during this documentation-only change.

## Sources and review limitations

- [Overture Maps, Places documentation](https://docs.overturemaps.org/guides/places/)
- [Overture Maps, attribution and licensing](https://docs.overturemaps.org/attribution/)
- [OpenFreeMap terms](https://openfreemap.org/tos/) and [attribution guidance](https://openfreemap.org/)
- [Next.js security advisories / official updates](https://nextjs.org/blog) (review the version actually resolved by the lockfile)
- [WCAG 2.2 text contrast success criterion](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- This repository's `README.md`, `AGENTS.md`, `data/places.json`, `.github/workflows/ci.yml`, `scripts/`, and `src/` tree.

These documents are a **living review and preparation aid**, not a compliance statement. Findings, including addressed items and outstanding verification, are maintained in [REVIEW-FINDINGS.md](REVIEW-FINDINGS.md). Re-review after meaningful changes to dependencies, data sources, map interactions, or deployment controls.


## MapLibre 6 worker incident and browser regression tests

**Incident.** Upgrading MapLibre past 6.4.0 to 6.19.0 addressed the audited
dependency range but resulted in a blank map on the Next.js 16 deployment,
while lint, typecheck, unit tests, and production build still passed. The map
container, attribution, and anchor marker rendered, but the geographic layers
did not. This is a known failure mode when Next/Turbopack cannot determine
the separate MapLibre 6 module worker URL from `import.meta.url`. See the
[MapLibre migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/)
and the [Next.js 16 failure analysis](https://tech.ldas.jp/en/posts/maplibre-gl-6-turbopack-worker-url/).
The evidence strongly points to the worker URL, though browser console/network
output from the affected deployment was not captured for an independent
confirmation of the exact exception.

**Fix.** `scripts/prepare-maplibre-worker.mjs` runs before local development
and production builds, copies the installed version's worker to a same-origin
URL, and fails if the file is absent. MapPanel calls `setWorkerUrl` **before**
constructing the map. The URL incorporates `maplibre.getVersion()` to prevent
a cached worker from an older version being reused.

**Regression coverage.** `tests/e2e` uses actual Chromium, Next production
output, and MapLibre. The deterministic CI fixture substitutes only the
remote basemap style with a small GeoJSON layer: it still depends on an
operational MapLibre worker, and explicitly checks for the correct worker URL
and successful source loading. It also exercises location selection, camera
recentering, category toggles, and the optional tour. Run
`pnpm test:e2e:live` with external network access to test OpenFreeMap itself.
No browser test alone guarantees visual correctness, all browser/device
combinations, accessibility conformance, or continuous provider availability.

**Why not roll back MapLibre?** The original issue was triggered by upgrading
out of a vulnerable dependency range; downgrading to restore visuals would
reintroduce the reported security exposure. Why not Docker/SonarQube? Neither
would have caught this runtime integration bug. This is a good example of
adding *specific verification* in response to a real failure, not checkbox
engineering.
