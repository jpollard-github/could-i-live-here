# Review findings

[Documentation index](README.md) · [Quality](QUALITY.md) · [Data notices](DATA-ATTRIBUTION.md)

A living, deliberately plain-language record. **Implemented** means the code exists in this version; it does not imply it has passed the deployed browser or an external security check. **Partial** means the risk is reduced but not fully resolved. We update this when a real regression or review changes the assessment. This is a review register, not a release-history ledger.

| ID | Priority | Finding | Current assessment and evidence |
| --- | --- | --- | --- |
| F-01 | High | MapLibre 6 worker left the map blank after a security upgrade | **Implemented:** local versioned worker and browser regression check. Verify production after deploying. |
| F-02 | High | No real browser verification of map interactions | **Implemented:** Chromium E2E covers the worker, A/B, sample areas, categories and tour. Add observed regressions as they occur. |
| F-03 | High | Cannot position a pin at an arbitrary point without a mouse | **Deferred deliberately:** the modal arrow-key experiment obscured the map and confused the interaction. Removed. Keyboard users can choose towns, sample areas, A/B, categories, and radii; exact custom pin placement still needs a coherent, tested design. |
| F-04 | High | Dependency audit was entirely manual | **Configured:** `.github/workflows/security.yml` runs `pnpm audit --prod` on main pushes, PRs and weekly. User reports a clean local audit; CI run not yet verified. |
| F-05 | Medium | Valid sample area + offered radius can produce an incomplete-data warning | **Open UX problem; detection implemented.** Boundary warnings and tests work, but a normal preset/radius combination should not feel like falling off the map. Prefer buffering the extract to support every offered radius around curated samples, then consider a visible extract boundary for manually moved pins. Test the expected user journey, not just the warning. |
| F-06 | Medium | Export strips per-source license provenance | **Partial:** refreshed JSON now includes `sources` identifiers for all 424 retained records. Still review applicable provider licenses and NOTICE content before claiming compliant redistribution. See [data notices](DATA-ATTRIBUTION.md). |
| F-07 | Medium | CI is not required for production deployment | **Deliberately accepted for solo trial:** CodeQL and audit run on PRs and main; branch protection and Vercel deployment gating are *not* configured. Trial PR-based development before deciding if enforcement helps. |
| F-08 | Medium | Exported review archives may contain tracked secrets | **Partial:** ignored files, risky filenames and recognized secret content patterns are blocked; archive review and history-wide secret scanning are still human responsibilities. |
| F-09 | Medium | Committed Overture JSON lacked integrity tests | **Implemented:** `src/lib/data.test.ts` checks the actual checked-in snapshot. |
| F-10 | Medium | Muted text contrast and interaction accessibility | **Improved, not certified:** specific low-contrast text colors darkened; keyboard tour/dialog behavior has browser checks. Precise pin placement remains pointer-only; mobile/screen-reader/zoom review outstanding. |
| F-11 | Low | No centralized client-error service | **Accepted:** small read-only demo; structured console events and `/api/health` remain appropriate. |
| F-12 | Low | Category counts could be mistaken for a livability score | **Accepted for review:** cards say *categories found* and the product explicitly rejects scoring; refine if actual users misunderstand. |
| F-13 | Low | Alphabetical cap would bias a much larger city | **Accepted:** with 424 places across two towns the 15,000-item cap does not operate. Revisit before adding cities. |
| F-14 | Medium | Tour opened automatically and stored a preference | **Implemented:** opt-in, replayable tour with no browser persistence. |
| F-15 | Medium | Numerous UI labels and result details use 10–12px text | **Open readability concern.** CSS contains genuinely tiny type (radius controls, result metadata, map hints). Increase the working text scale, then review wrapping, density, 200% zoom, and real mobile use. Passing color contrast does not prove legibility. |

## When a finding changes

1. Describe the specific failure and what it affects.
2. Update the code and tests, or record why accepting the risk is rational for this product.
3. Replace the assessment with the actual evidence; distinguish source checks, CI and a real deployed/browser run.
4. Reopen findings when they regress. No performative green-check accumulation.

**Verification scope:** reviewed against the uploaded source snapshot. These statuses are not security, accessibility or licensing certifications.
