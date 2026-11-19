# Product and user experience

The real user question, the assignment rubric, UX decisions, limitations, and scope priorities. See [docs index](README.md) and [living findings](REVIEW-FINDINGS.md).

## What the assignment actually tests

Valid asks for a **deployed, useful application** using Overture data and a repo that demonstrates product sense, UX, functioning software, and judgment. An elaborate CI matrix is not the deliverable. Quality practices matter only insofar as they make the deliverable more trustworthy or maintainable.

| Assignment criterion | Evidence here | Honest caveat |
| --- | --- | --- |
| Product sense | Real Kernersville-to-Lexington use case; comparison is the main interaction | We have not validated demand beyond the initial user |
| UX and craft | Simple selectable A/B model, presets, colored filters, radius, browsable results, user-launched tour | Accessibility, small-screen usability, and comprehension lack formal user testing |
| Engineering quality | Typed client, deterministic distance calculations, ingestion validation, bounded data, health endpoint, CI | Browser E2E checks cover key workflows with a deterministic style; client errors are not remotely collected |
| Judgment | Static extract and explicit limitations; no accounts, routing, or score | Some shortcuts have consequences (data coverage, freshness, geocoding) |

**Anti-pattern to avoid:** adding tooling solely to make a table of green checks longer. A check without a defined failure mode or an owner is not engineering rigor.

## UX, accessibility, and product honesty

**Core journey:** Select A/B, choose a sample area or a pin, select a couple of categories, compare mapped places, inspect one. The interface's *first-job* is legibility, not quantity of pins. Avoid expanding the app into a gallery of every Overture feature type just because it is available.

**What works in the design:** An explicit A/B metaphor, 0.5-mile default, empty filters to prevent dot overload, distinct category colors *plus* text/icons, complete scrollable result lists, focused-place highlighting, transparent distance language, and an user-launched tour. We discovered and fixed genuine interaction problems through manual use (sample-area camera sync and click targets). That's more meaningful than blindly defending the first implementation.

**Accessibility needs a reality check, not a checkbox.** Positives in source: semantic headings, buttons and selects, `aria-pressed`, list regions, visible focus styles, a native `<dialog>` for the rationale, Escape/dismiss for the walkthrough, and reduced-motion CSS. Gaps requiring testing: keyboard-only custom pin placement, actual screen-reader reading order in the custom tour, focus restoration on tour/dialog close, mobile screen height and zoom, overly small secondary labels, text contrast, and touch targets. The comparison card itself is clickable by pointer but has a separate actual button for keyboard activation. That preserves functionality but doesn't make “click anywhere” literally true for keyboard users.

**Contrast review:** The original stylesheet used `#718076` on `#fcf9f1` (≈3.95:1), `#6c7a6f` on `#f5f1e8` (≈4.01:1), and `#7f847d` on `#fffdf7` (≈3.75:1) for small text. An earlier patch darkened those colors, plus a tour label color, to achieve about 5:1 or better for those specific pairs. WCAG AA normal text generally calls for 4.5:1. **This is color-pair checking, not a complete accessibility audit**; interactive states, type sizes, and actual rendered backgrounds need review.

**Public narrative / privacy:** The author is credited on the site, but the app and tour describe an illustrative move without naming the mover. The approximate sample apartment area could still reveal context; it is a conscious demo choice, not a verified address. A broader consumer product should make locations fully generic or user-provided.

**UX reviewer probes:** What does 0/3 really mean? Why don't categories begin selected? Are business counts duplicate-safe? Does the circle mean walking distance? What happens at 200% zoom, offline tiles, very narrow mobile viewport, or a radius crossing the box? Could a user accomplish the same flow without using a mouse? These are questions we should be glad to get before a broader rollout.

## What I'd do next, and what I would refuse to add

**Before submission (proportionate):**

1. Run the full local CI equivalent and verify the production deploy after the patch; check that data integrity test runs in CI.
2. Perform and document a real keyboard + mobile walkthrough; confirm the adjusted secondary text contrast against actual rendered backgrounds.
3. Manually run the core browser flows (A/B switches, sample-area camera reset, radius, focus, tour replay/escape, map offline fallback) in addition to the automated suite. Retain and extend the existing Chromium smoke tests when a real regression warrants it.
4. Run `pnpm audit --prod` against the installed lockfile and triage actual advisories; audit the exported ZIP for secrets. Don't claim these were already done.
5. Review per-source Overture licensing/NOTICE and ensure the attribution we distribute is sufficient for the actual data.
6. Verify CI and Vercel are showing the same release commit and that required checks govern the intended promotion path.

**If useful after user feedback:** allow multiple saved B candidates, clarify matched-category counts, warn of partial data radius, improve map keyboard controls, and perhaps show user-defined priorities. Measure whether users really need these first.

**Not now:** full GIS backend, distributed jobs, multi-region database, OAuth, AI recommendations, LLM agents, Kubernetes, container registry, SonarQube server, synthetic 80% coverage targets, load-test dashboard, release train, or automatic daily ingestion. These would be engineering outputs without evidence they improve this small product.
