# Could I Live Here? — Engineering review and interview defense

**Review basis:** repository export dated 2026-11-18 22:59 ET; this document and the accompanying small hardening changes were prepared against that export. This is an **adversarial, source-based review**, not a certificate of security, accessibility, or production fitness. Findings describe what was inspected and what remains unverified.

**Read first:** A reviewer can disagree with a tradeoff. The point is to show that it was made deliberately, that its downside is understood, and that there is a sensible next step if the product earns one.

## Table of contents

1. [The 30-second answer](#1-the-30-second-answer)
2. [What the assignment actually tests](#2-what-the-assignment-actually-tests)
3. [Review verdict and prioritized findings](#3-review-verdict-and-prioritized-findings)
4. [Architecture and why the stack is this small](#4-architecture-and-why-the-stack-is-this-small)
5. [Data correctness, provenance, and licensing](#5-data-correctness-provenance-and-licensing)
6. [UX, accessibility, and product honesty](#6-ux-accessibility-and-product-honesty)
7. [Security and privacy: threat model](#7-security-and-privacy-threat-model)
8. [Verification: what CI does and does not establish](#8-verification-what-ci-does-and-does-not-establish)
9. [Operational behavior, performance, and deployment](#9-operational-behavior-performance-and-deployment)
10. [AI-assisted development and accountability](#10-ai-assisted-development-and-accountability)
11. [My biases and possible blind spots](#11-my-biases-and-possible-blind-spots)
12. [Hostile interviewer questions and defensible answers](#12-hostile-interviewer-questions-and-defensible-answers)
13. [What I'd do next, and what I would refuse to add](#13-what-id-do-next-and-what-i-would-refuse-to-add)
14. [Reproduce the review](#14-reproduce-the-review)
15. [Sources and review limitations](#15-sources-and-review-limitations)

## 1. The 30-second answer

> **Problem:** Comparing two houses by price or listing photos says almost nothing about the practical places nearby. I wanted to compare the area where I currently live in Kernersville with candidate neighborhoods in Lexington. **Solution:** Two selectable points, a genuinely geographic radius, user-selected amenity categories, a map, and complete browsable result lists backed by a small Overture Maps extract. **Judgment:** No pretend livability score or invented walking time. The app uses static data because this use case does not yet justify an API, database, authentication, or continuous ingestion. **Evidence:** Tests and CI cover the geographic and data-transformation logic; the UI is deployed and still needs documented end-to-end and accessibility testing.

Why consider this work? It is an end-to-end, inspectable product with a real motivating decision, source data, explainable behavior, deliberate exclusions, and a reproducible build. The claim is **good judgment relative to scope**, not that 500 mapped records require enterprise infrastructure.

Why consider the engineer? The interesting part is neither framework choice nor typing speed. It is the process of recognizing what the user actually needs, simplifying the architecture, inspecting the result, responding to observed UX failures, and taking responsibility for what is and isn't verified. The code and revision history should support this claim; prose alone does not.

## 2. What the assignment actually tests

Valid asks for a **deployed, useful application** using Overture data and a repo that demonstrates product sense, UX, functioning software, and judgment. An elaborate CI matrix is not the deliverable. Quality practices matter only insofar as they make the deliverable more trustworthy or maintainable.

| Assignment criterion | Evidence here | Honest caveat |
| --- | --- | --- |
| Product sense | Real Kernersville-to-Lexington use case; comparison is the main interaction | We have not validated demand beyond the initial user |
| UX and craft | Simple selectable A/B model, presets, colored filters, radius, browsable results, first-visit guide | Accessibility, small-screen usability, and comprehension lack formal user testing |
| Engineering quality | Typed client, deterministic distance calculations, ingestion validation, bounded data, health endpoint, CI | No browser E2E suite; client errors are not remotely collected |
| Judgment | Static extract and explicit limitations; no accounts, routing, or score | Some shortcuts have consequences (data coverage, freshness, geocoding) |

**Anti-pattern to avoid:** adding tooling solely to make a table of green checks longer. A check without a defined failure mode or an owner is not engineering rigor.

## 3. Review verdict and prioritized findings

This is a credible **small product demonstration**, not a fully hardened public mapping service. It is not overengineered. The more immediate risk is **under-verifying the user-facing interactions** while relying on unit-test success to suggest production readiness. Ratings below concern this submission, not universal enterprise requirements.

| Priority | Finding | Concrete evidence | Response / status |
| --- | --- | --- | --- |
| **High — before claiming accessibility** | The custom map is mostly pointer driven | `src/components/map-panel.tsx` uses map clicks, hover, and draggable marker; no equivalent keyboard method for arbitrary new points | Keep the select/preset and result-list keyboard alternatives; document the limitation; consider accessible coordinate entry if genuine keyboard users need arbitrary placement |
| **High — before claiming end-to-end reliability** | No automated browser flow tests | `pnpm test` executes only `src/lib/*.test.ts`; Python tests cover scripts | Add a short Playwright happy-path and keyboard smoke test **if** we choose one more dependency; manual browser script now is mandatory |
| **High — supply chain** | No verified dependency vulnerability audit or history-wide secret scan | CI executes lint, typecheck, tests, build, Python tests; not `pnpm audit`/gitleaks/CodeQL | Run `pnpm audit --prod` locally and fix findings; add an owned automated check if this app continues |
| **Medium — review export** | Git-ignore compliance doesn't guarantee a safe ZIP | `scripts/export_repo.py` selected all unignored tracked files | **Improved in this patch:** exclude common private-key/credential filenames and test it; content and Git-history scanning remain manual/unverified |
| **Medium — shipped data integrity** | Previously only synthetic data examples were tested | Tests exercised geometry and extraction fixture data, not the committed JSON | **Improved in this patch:** validate actual snapshot schema, uniqueness, bounds, and category mapping in CI |
| **Medium — data coverage** | Radius can extend beyond the extracted bounding box | User may place the pin near an area's edge while `nearbyByCategory` only sees downloaded records | State uncertainty; ideally disallow or warn when a chosen radius crosses the data boundary; expand extract if needed |
| **Medium — attribution/provenance** | The pipeline discards record-level `sources` metadata | `normalize()` retains ID, name, coordinates, category, taxonomy, address, confidence | Review Overture's source-specific licenses and notices before distributing extracts more broadly; preserve provenance on the next ETL revision |
| **Medium — delivery** | CI passing does not necessarily gate production | GitHub Actions runs on push/PR; Vercel deploy config is separate | Require the check on the protected main branch and define deployment promotion if correctness matters operationally |
| **Medium — small-text contrast** | Several 10–11px secondary text colors fell below 4.5:1 against their backgrounds | Computed examples before patch: `#718076` on `#fcf9f1` ≈3.95:1; `#7f847d` on `#fffdf7` ≈3.75:1 | **Improved in this patch:** darkened four secondary CSS colors to ~5:1 or better in their checked contexts; full rendered contrast/accessibility audit still pending |
| **Low — monitoring** | Browser errors are logged to browser console, not centralized monitoring | `reportClientError` calls `console.error` in client code | For real use, add an error-reporting provider only if troubleshooting demands it |
| **Low — result interpretation** | “3/3 categories found” could read like a quality score | `ResultsCard` displays count of nonempty categories | Clarify “3 of 3 selected categories have mapped matches”; never portray this as a livability judgment |
| **Low — importer capacity** | Above 15,000 places, alphabetic truncation creates bias | `parse_geojson` sorts by name, then slices `MAX_PER_CITY` | Fine for current counts (227 and 256); replace with an explicit scale policy before expanding geography |

**Not observed in source review:** custom auth, cookies for tracking, payment handling, server-side user input persistence, unsafe HTML insertion, shell commands built from HTTP input, or an application database. Those omissions reduce the attack surface. **Not observed is not proof of absence of all vulnerabilities.**

## 4. Architecture and why the stack is this small

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

## 5. Data correctness, provenance, and licensing

**Source fidelity.** We select only Point features, bounded by the configured city boxes; use a confidence threshold of 0.55; exclude known permanently-closed statuses; classify by **exact taxonomy tokens**, not substring; and keep one record per Overture ID. The extract is committed and updated atomically. The UI says “mapped matches” because empty results do not establish absence in real life.

**What isn't guaranteed:** category completeness, business hours, actual pedestrian access, whether a place is still open, whether a pin is at a building entrance, or whether multiple Overture IDs are duplicate businesses. An Overture confidence value is **not a calibrated probability of business existence**, and 0.55 is a heuristic, not empirically justified here.

**Two important edge cases:**

1. A selected circle near a bounding-box edge is only partially sampled, even though the whole circle is drawn. Currently the app does not flag this. That's a correctness issue, not a preference.
2. `MAX_PER_CITY = 15_000` prevents runaway file size but slices *after alphabetic sorting*. That makes a larger-city snapshot systematically biased toward names near the start of the alphabet. Current city sizes don't trigger this; do not claim the approach scales unchanged.

**Licensing/provenance deserves more work.** Overture's [official attribution page](https://docs.overturemaps.org/attribution/) distinguishes Places providers (including CDLA Permissive 2.0, Apache 2.0 for Foursquare with an associated NOTICE, and CC0). Our exported JSON drops `sources[]`, preventing an exact source/license audit for individual records. Credit in the footer is a useful start but does not, by itself, demonstrate that redistribution notices have been handled correctly. Before treating the extract as a reusable data product, preserve source identifiers/licenses and determine which notices need to ship. Consult the [Foursquare notice linked by Overture](https://docs.overturemaps.org/attribution/) and applicable license terms, rather than assuming a blanket “open source = no attribution duties.” The basemap is a separate OpenFreeMap/OSM attribution question.

**Reproducibility limit:** Git pins the *resulting extract* via version control, but the Python `overturemaps` package is not version-pinned, and the CLI defaults to a source release that can change. For a long-lived product, pin tool version and record source release ID in `generatedAt` metadata. The current script does not do that.

## 6. UX, accessibility, and product honesty

**Core journey:** Select A/B, choose a sample area or a pin, select a couple of categories, compare mapped places, inspect one. The interface's *first-job* is legibility, not quantity of pins. Avoid expanding the app into a gallery of every Overture feature type just because it is available.

**What works in the design:** An explicit A/B metaphor, 0.5-mile default, empty filters to prevent dot overload, distinct category colors *plus* text/icons, complete scrollable result lists, focused-place highlighting, transparent distance language, and an optional first-visit guide. We discovered and fixed genuine interaction problems through manual use (sample-area camera sync and click targets). That's more meaningful than blindly defending the first implementation.

**Accessibility needs a reality check, not a checkbox.** Positives in source: semantic headings, buttons and selects, `aria-pressed`, list regions, visible focus styles, a native `<dialog>` for the rationale, Escape/dismiss for the walkthrough, and reduced-motion CSS. Gaps requiring testing: keyboard-only custom pin placement, actual screen-reader reading order in the custom tour, focus restoration on tour/dialog close, mobile screen height and zoom, overly small secondary labels, text contrast, and touch targets. The comparison card itself is clickable by pointer but has a separate actual button for keyboard activation. That preserves functionality but doesn't make “click anywhere” literally true for keyboard users.

**Contrast review:** The original stylesheet used `#718076` on `#fcf9f1` (≈3.95:1), `#6c7a6f` on `#f5f1e8` (≈4.01:1), and `#7f847d` on `#fffdf7` (≈3.75:1) for small text. This patch darkens those colors, plus a tour label color, to achieve about 5:1 or better for these specific pairs. WCAG AA normal text generally calls for 4.5:1. **This is color-pair checking, not a complete accessibility audit**; interactive states, type sizes, and actual rendered backgrounds need review.

**Public narrative / privacy:** A named developer, a tour about a personal relocation, and an approximate current apartment-complex area create a public association between a person and a location. The coordinates are approximate but still revealing. It is the creator's choice; it should be an intentional choice. For an eventual public-facing consumer product, rewrite the tutorial around an anonymous illustrative mover.

**UX reviewer probes:** What does 0/3 really mean? Why don't categories begin selected? Are business counts duplicate-safe? Does the circle mean walking distance? What happens at 200% zoom, offline tiles, very narrow mobile viewport, or a radius crossing the box? Could a user accomplish the same flow without using a mouse? These are questions we should be glad to get before a broader rollout.

## 7. Security and privacy: threat model

**Assets and exposure:** Public source code, public map dataset, and a read-only website. No credentials, sessions, accounts, payment details, database mutations, or personal histories are intended. The primary threats are a vulnerable dependency, malicious/incorrect third-party source data, unsafe rendering, inadvertent disclosure through exported archives, and browser network requests to the basemap provider.

| Concern | What the code currently does | Residual risk / action |
| --- | --- | --- |
| Untrusted place names and addresses | React renders text; hover popup calls MapLibre `setText()` rather than `setHTML()` | Strong default against HTML injection in these paths; still inspect new rendering paths before adding them |
| Network/API attack surface | No app write API. Only `/api/health` returns extract metadata | Low app-level input exposure, not zero framework/supply-chain exposure |
| Secret handling | No app keys; exporter respects ignore rules and now excludes common key-file formats | **Not a secret scanner.** Audit Git history and exported contents manually; future automation could use gitleaks |
| Dependencies | Frozen pnpm lockfile for Node builds | No vulnerability scan was completed in this review; `pnpm audit --prod` is still required before claiming a clean dependency state |
| Basemap and privacy | Map tiles load from OpenFreeMap | Third party receives network requests for visible areas plus ordinary request metadata; don't claim “the browser contacts nobody” |
| Browser headers | `poweredByHeader: false`; no explicit CSP or customized security header policy | Good follow-up if exposed beyond a demo; CSP must be tested with MapLibre workers/styles/tiles before enabling |
| Data provenance | Committed normalized snapshot and source name | Per-feature origin and license data currently stripped; see §5 |
| Client-side errors | `console.error` structured event with broad type, no coordinates | Not centralized monitoring; errors may go unnoticed |

**What I actually reviewed:** `src/components/explorer.tsx`, `map-panel.tsx`, `walkthrough.tsx`, `about-dialog.tsx`, geographic/category functions, health route, scripts, package/lock files, GitHub Actions, Vercel config, and the extracted dataset structure. This was manual static inspection plus the tests listed in §14. **Not performed:** authenticated penetration test (not applicable to this app), DAST, browser runtime fuzzing, third-party dependency audit, deployment-header inspection, or Git-history secret scan. No claim of full “secure” status is warranted.

## 8. Verification: what CI does and does not establish

| Layer | Existing or added check | Value | What it misses |
| --- | --- | --- | --- |
| Formatting/style | ESLint (`pnpm lint`) | Common mistakes and consistent lint rules | A design can be perfectly linted and unusable |
| Types | TypeScript strict checks | Catch many integration/type errors | JSON casts, runtime data shape, and interactions beyond compile time |
| Pure logic | Node built-in tests | Distances, circles, category assignments, sorting/full lists | UI integration, stale state, DOM/focus behavior |
| Export and ETL | Python `unittest` | Bbox, taxonomy, confidence, atomic extraction invariants through fixtures | Live CLI/schema drift and actual Overture correctness |
| **Committed data** | **New `src/lib/data.test.ts`** | Actual snapshot has expected towns, plausible records, bounded/unique IDs and classifications | Semantic accuracy of source records and missing POIs |
| **Review ZIP safety** | **New exporter filename tests** | Common credential-file types skipped even if tracked | Content scanner/secret history audit |
| Build | Next.js production build | Build compatibility on clean CI runner | Browser functioning after deployment |
| Deployment | Vercel Git integration | Automated hosting and preview behavior | No proved dependency on a *passing* CI check before production promotion |
| Dependency SCA | **Not implemented** | Would catch known advisories | No scan is currently available to substantiate “clean dependencies” |
| Browser E2E / a11y | **Not implemented** | Would catch most costly user journeys | Needs browser tooling, meaningful assertions, maintenance |
| Performance budgets | **Not implemented** | Useful after establishing targets | A number without a product scenario is noise |

The long checklist of every possible CI technique is **a menu, not a mandate**. A repo with no database doesn't need ephemeral Postgres or Docker Compose; a static UI demo doesn't need semantic release and container registry publication. If the app becomes a durable public service, grow the checks around actual regressions. **Suggested next incremental gate:** one browser test covering sample-area reset, A/B switch, category selection, focus, tour dismissal/replay, and no console errors. It's the missing test whose payoff most closely matches observed bugs.

An important operational nuance: GitHub Actions `push`/`pull_request` checks and Vercel's Git-triggered deploy are distinct. A green CI badge is evidence that a particular commit built and its tests passed, not proof that a failed commit cannot deploy. Required checks / protected branches / preview promotion are policy decisions outside this source snapshot.

## 9. Operational behavior, performance, and deployment

**Operations now:** A checked-in data snapshot permits availability independent of the live Overture API. `/api/health` returns a signal that both city arrays contain entries and includes extract metadata. It does **not** verify basemap tiles, actual taxonomy validity, or user interaction. Browser failures are written to developer console; Vercel server logs cover the health endpoint, not arbitrary client error events.

**Data refresh:** Explicit, controlled command. The old JSON survives if any town's extract fails. That is a valuable transactional guarantee even for a tiny pipeline. A scheduled data-refresh bot adds failure modes, surprise diffs, and unnoticed taxonomy changes; manual refresh is acceptable for a take-home as long as freshness is stated.

**Performance assumptions (not measurements):** ~483 places across two cities and a ~134 KB JSON source file are small enough for in-memory filtering and client-side rendering on typical devices. This is a reason to *expect* reasonable performance, not a benchmark. 109 matching dots on a map can be unusable even if rendering them is fast. Test real mobile hardware and slow networks before promising performance; optimize only measured bottlenecks. No need for microservices or load testing of a nonexistent backend.

**Deployment:** Vercel can deploy the app. Do not confuse “it is live” with “it passed a release checklist.” Before submission, verify the exact production URL and commit, `/api/health` response, meaningful map interactions, browser console, small viewport, and source/attribution links.

## 10. AI-assisted development and accountability

The engineering workflow is intentionally **human-selected delegation**: small tasks in editor AI (e.g., Codex), broader product/architecture/review discussions in ChatGPT or another general AI, a Git-ignore-aware review ZIP exported by `pnpm repo:export`, and human inspection before accepting patches. A model drafting code does not approve it; passing lint does not approve it either.

A convincing account in an interview contains *examples of disagreement and revision*: restaurant categories had to be split; default selections overwhelmed the map; the A/B model needed explicit instruction; map camera updates needed correction; the need for source attribution and accessibility emerged in review. The skill is not asking AI to build a site. It is repeatedly rejecting unnecessary complexity and inspecting actual behavior.

**Avoid claiming:** AI-review automation is secure by default, that an uploaded repository cannot contain secrets, or that code authored with AI has been “independently audited” unless an actual audit occurred. This document is deliberately candid about its own limits. Automating repo uploads would be possible; adding that before a clear benefit would remove a useful consent/review checkpoint.

## 11. My biases and possible blind spots

1. **Simplicity bias.** Strong preference for static data and avoiding backend ceremony. Usually right at this scale; can underweight observability, release controls, privacy, and future expansion costs.
2. **Developer-as-user bias.** The first user understands the local geography and can navigate maps. Someone who doesn't know Kernersville or Lexington may misinterpret presets, distances, 0/3 category counts, or the unlabeled lack of routes.
3. **Aesthetic bias.** A distinctive field-guide UI is pleasant but tiny muted labels and custom tour mechanics can harm contrast and accessibility. Attractive ≠ inclusive.
4. **Data-availability bias.** Hundreds of mapped places feel abundant, but density and correctness vary by category and location. Counts aren't evidence of completeness.
5. **Technical-test bias.** Geometry and taxonomy tests are easy to write, pass, and celebrate; the bug that actually reached the user was map synchronization. The next test should reflect that reality.
6. **No-score bias.** Refusing a black-box score prevents false authority, but could force the user to do too much comparison work. A future transparent, user-defined weighting system might be justified by actual demand.
7. **AI confidence bias.** Generated explanations can sound more authoritative than verification warrants. Every statement about security, compliance, accessibility, or deployment needs an observable basis.
8. **Personal-story bias.** A real move makes the pitch compelling, but the hard-coded two-town narrative limits general reuse and exposes private geographic context.

## 12. Hostile interviewer questions and defensible answers

**“Why should I care? Google Maps already exists.”**

Google Maps is excellent for finding individual places. This product is a deliberately narrow comparison between two candidate residential areas: the same categories and radius, two result sets, no invented score. That's useful for a specific decision, not an attempt to replace Google Maps. If people prefer Google Maps after trying it, that's valid evidence to stop.

**“Why Next.js for a static app?”**

The deployment platform and my working familiarity made it cheap to ship. It provides typed React, routing and production builds. Vite would also be valid and possibly simpler; I would migrate only if the framework's ongoing costs justify it. I have not invented a server architecture to make Next.js seem necessary.

**“You used two languages for 483 records?”**

One language runs the browser application; Python only prepares and reviews data offline. The Overture CLI eliminates building and maintaining my own data download path. The additional Python toolchain is a cost, documented and tested. It's not automatically the right choice at every future scale.

**“Isn't 0/3 a fake livability score?”**

It counts selected categories with at least one mapped match, not neighborhood quality. The label could explain that more clearly. No weights, ratings, or travel-time claims are inferred. The user makes the decision.

**“If the circle overlaps the boundary of your downloaded data, aren't the results misleading?”**

Yes, potentially. The app currently checks that the center lies in the downloaded bounding box but doesn't warn if the circle crosses it. I'd add an edge-coverage warning or restrict valid pin centers. It's a known, bounded correctness gap.

**“Can a keyboard-only user move the pin?”**

They can use the A/B selectors and named sample areas, but arbitrary pin placement is primarily pointer-driven. That is not equivalent functionality. I would not claim full keyboard accessibility; accessible coordinate fields or keyboard map interactions would be the next fix if broad use is the goal.

**“How did you verify the app, not just your math?”**

There are unit tests for geography/classification and offline extraction, a snapshot validation test added after review, and CI build checks. We also manually iterated on real map behavior. What is missing is an automated browser regression and accessibility suite. That's my highest-value next test.

**“Can I trust a green CI badge to mean this commit was safe to ship?”**

No. It proves the configured checks succeeded for that commit. It doesn't establish dependency safety, UX accessibility, production smoke tests, or protected deployment promotion. Vercel deployment is a separate mechanism.

**“Did you review security, or just sprinkle security vocabulary into the README?”**

I inspected untrusted-text rendering, external calls, API surface, export tooling, dependencies declared, and config. React text rendering and MapLibre `setText()` avoid obvious injected-HTML paths; there's no app write API or secrets. I fixed the exporter's common-credential filename risk. I did *not* run an end-to-end vulnerability audit or secret-history scan, so I won't claim clearance.

**“Why no Docker, SonarQube, database, IaC, microservices, or elaborate pre-commit hooks?”**

None is required to solve the demonstrated user problem. I would add a tool when it prevents an actual expected failure or reduces real maintenance cost. I have a better near-term use for time: keyboard/accessibility testing and a browser happy path.

**“What would you do if you had another afternoon?”**

First, fix the accessible map path and document coverage at bounding-box edges; second, add one browser smoke test and run a dependency audit; third, inspect release licensing and provenance. I wouldn't add features before those reliability gaps are understood.

**“What's your evidence that people want this?”**

One authentic user need, one implemented prototype, and observed interaction changes from direct use. Not product-market fit. The next step is putting it in front of a few people who are actually evaluating neighborhoods, not claiming a market from my own enthusiasm.

**“What did AI do? What did *you* do?”**

AI supported implementation and design review. The product definition, user-specific feedback, rejection of wrong defaults, scope decisions, evaluation of the result, and acceptance of code changes remain human responsibilities. The artifacts, tests, and tradeoffs are inspectable. Authorship of every individual line is less relevant than whether I can explain, verify, and change it.

## 13. What I'd do next, and what I would refuse to add

**Before submission (proportionate):**

1. Run the full local CI equivalent and verify the production deploy after the patch; check that data integrity test runs in CI.
2. Perform and document a real keyboard + mobile walkthrough; confirm the adjusted secondary text contrast against actual rendered backgrounds.
3. Manually run the core browser flows (A/B switches, sample-area camera reset, radius, focus, tour replay/escape, map offline fallback). If time permits, automate one happy-path browser test.
4. Run `pnpm audit --prod` against the installed lockfile and triage actual advisories; audit the exported ZIP for secrets. Don't claim these were already done.
5. Review per-source Overture licensing/NOTICE and ensure the attribution we distribute is sufficient for the actual data.
6. Verify CI and Vercel are showing the same release commit and that required checks govern the intended promotion path.

**If useful after user feedback:** allow multiple saved B candidates, clarify matched-category counts, warn of partial data radius, improve map keyboard controls, and perhaps show user-defined priorities. Measure whether users really need these first.

**Not now:** full GIS backend, distributed jobs, multi-region database, OAuth, AI recommendations, LLM agents, Kubernetes, container registry, SonarQube server, synthetic 80% coverage targets, load-test dashboard, release train, or automatic daily ingestion. These would be engineering outputs without evidence they improve this small product.

## 14. Reproduce the review

```bash
# From the repo root. Node 22+, pinned pnpm, and Python 3 are expected.
corepack pnpm install --frozen-lockfile
corepack pnpm check
python3 -m unittest discover -s scripts -p 'test_*.py' -v

# Review the actual snapshot (included in pnpm test after this patch):
node --experimental-strip-types --test src/lib/data.test.ts

# A separate, *not yet automated in this repo* dependency-audit check:
corepack pnpm audit --prod

# Export; inspect ZIP file list and contents before sharing anywhere:
corepack pnpm repo:export

# Check the deployed data service:
curl -i https://could-i-live-here.vercel.app/api/health
```

**Manual browser smoke (not automated or claimed passed here):** Fresh/private browser session: tour appears, Escape closes, replay works; both A/B cards activate; choosing another Lexington sample area recenters the circle and pin; choose coffee + pharmacy and compare A/B counts; select an individual result, verify map focus and no pin move; change radius; drag a pin outside the loaded box and check the warning; test 360px width and 200% zoom; repeat key actions without mouse; inspect console and map-tile fallback. Note defects; do not substitute “seems okay” for the list.

**Static review checks performed for this assessment:** Manually read the files named in §7, inspected the workflow and package declarations, ran existing JavaScript and Python logic tests, and computed representative CSS contrast ratios. The added test source and exporter hardening were subsequently tested; representative small-text colors were darkened after contrast calculations. **Not performed in this environment:** full `pnpm check` / production browser run / pnpm audit, because npm dependencies were not available here. There is no claim to have verified these.

## 15. Sources and review limitations

- [Overture Maps, Places documentation](https://docs.overturemaps.org/guides/places/)
- [Overture Maps, attribution and licensing](https://docs.overturemaps.org/attribution/)
- [OpenFreeMap terms](https://openfreemap.org/tos/) and [attribution guidance](https://openfreemap.org/)
- [Next.js security advisories / official updates](https://nextjs.org/blog) (review the version actually resolved by the lockfile)
- [WCAG 2.2 text contrast success criterion](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- This repository's `README.md`, `AGENTS.md`, `data/places.json`, `.github/workflows/ci.yml`, `scripts/`, and `src/` tree.

This document is **a living review and a preparation aid**, not a compliance statement. Its factual claims refer to the 2026-11-18 uploaded snapshot plus the changes named here. Re-review after meaningful changes to dependencies, data sources, map interactions, or deployment controls.


## Update: MapLibre 6 worker incident and browser regression tests

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
