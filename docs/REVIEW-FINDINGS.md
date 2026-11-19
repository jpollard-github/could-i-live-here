# Review findings register

[Documentation index](README.md) · [Verification and threat model](QUALITY.md) · [Product and accessibility](PRODUCT.md)

A living record of concrete review observations, not a one-time green-check list. A finding moves to **Addressed** only with a source change and a verification method. **Source present** means the fix exists in this snapshot; it does *not* mean the latest deployed revision was independently inspected. When you commit a fix, add its real Git hash (for example `git log -1 --oneline -- <path>`) instead of inventing one. Do not use a commit hash from a ZIP that contains no `.git` history.

| ID | Priority | Finding / impact | Status in uploaded snapshot | Evidence / next action | Commit |
| --- | --- | --- | --- | --- | --- |
| F-01 | High | Browser-only regression left MapLibre 6 map blank after security upgrade | **Addressed in source** | Worker prepared by `scripts/prepare-maplibre-worker.mjs`; `MapPanel` sets worker URL; `tests/e2e/test_explorer.py` verifies actual worker/source readiness. Confirm locally and on Vercel | _Fill after commit_ |
| F-02 | High | Map interactions lacked browser-level checks | **Addressed in source; ongoing coverage** | Python Playwright E2E added to CI for samples, A/B, category filtering and tour. Extend when a new real-world regression is found | _Fill after commit_ |
| F-03 | High | Arbitrary pin placement not fully keyboard-operable | **Open** | Presets and A/B selection work with keyboard; support coordinate entry or another equivalent map-placement path and test with keyboard/screen reader | — |
| F-04 | High | Dependency security check is not automated | **Open / manual** | Run `pnpm audit --prod`, triage findings, decide on an owned CI gate. MapLibre was upgraded in response to a reported advisory but no current clean audit is claimed here | — |
| F-05 | Medium | Comparison radius can cross downloaded geographic bounds | **Open** | A place outside the extract may be omitted even though the circle shows it. Warn on partial coverage or prevent unsupported selection | — |
| F-06 | Medium | Normalized place records discard per-source license provenance | **Open** | Preserve Overture `sources` and review source-specific notices before wider redistribution | — |
| F-07 | Medium | GitHub CI is not demonstrably a required gate for Vercel production | **Open / configuration** | Review branch protection, required checks, and deployment workflow; a green CI run alone is not a gate | — |
| F-08 | Medium | Repo export could include sensitive tracked files | **Partially addressed in source** | `scripts/export_repo.py` blocks common sensitive filenames; content/history scanning and human archive review still required | _Fill after commit_ |
| F-09 | Medium | Checked-in Overture data was not validated by unit tests | **Addressed in source** | `src/lib/data.test.ts` checks actual snapshot invariants | _Fill after commit_ |
| F-10 | Medium | Small muted text had insufficient contrast on checked backgrounds | **Partially addressed in source** | Specific CSS colors were darkened; rendered states, zoom, and keyboard focus still need accessibility inspection | _Fill after commit_ |
| F-11 | Low | Client errors are not centrally collected | **Accepted for demo** | Console diagnostics + `/api/health`; add an error service only if sustained use requires it | — |
| F-12 | Low | Found-category counts may sound like a livability score | **Open / copy** | Label results unambiguously as selected categories with mapped matches | — |
| F-13 | Low | Extraction caps larger towns by alphabetical sort | **Accepted at current size** | `MAX_PER_CITY` only matters for expansion far beyond the current few hundred records | — |
| F-14 | Medium | Original tour launched automatically and stored a browser preference | **Addressed in source (this change)** | Tour opens only from **Take the tour**; no localStorage/cookie. Browser test checks closed-by-default and step navigation | _Fill after commit_ |

## Updating this register

1. Reproduce the issue; describe a user-visible or security-relevant failure mode, not merely a tooling preference.
2. Implement the smallest justified fix, or explicitly accept/defer it with a reason.
3. Record the test or manual evidence. Do not count a passing unit test as a successful visual browser test.
4. Once committed, replace the placeholder with the **actual commit hash**. Keep the finding and its rationale in the table.
5. If a future regression reopens the same issue, change the status and point to the new evidence.

**Review provenance:** assembled from a static review of the uploaded repo and later MapLibre worker incident. Claims about external provider availability, keyboard accessibility, deployment gating, and dependency advisories require independent checks; none is implied by these status labels.
