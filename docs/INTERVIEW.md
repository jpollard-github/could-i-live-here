# Interview notes and skeptical questions

Answers to defend with source code, tests, and real tradeoffs rather than abstract claims. See [docs index](README.md) and [living findings](REVIEW-FINDINGS.md).

## The 30-second answer

> **Problem:** Comparing two houses by price or listing photos says almost nothing about the practical places nearby. I wanted to compare the area where I currently live in Kernersville with candidate neighborhoods in Lexington. **Solution:** Two selectable points, a genuinely geographic radius, user-selected amenity categories, a map, and complete browsable result lists backed by a small Overture Maps extract. **Judgment:** No pretend livability score or invented walking time. The app uses static data because this use case does not yet justify an API, database, authentication, or continuous ingestion. **Evidence:** Tests and CI cover the geographic and data-transformation logic; the app is deployed and automated Chromium interaction tests exist; accessibility remains incompletely validated.

Why consider this work? It is an end-to-end, inspectable product with a real motivating decision, source data, explainable behavior, deliberate exclusions, and a reproducible build. The claim is **good judgment relative to scope**, not that 500 mapped records require enterprise infrastructure.

Why consider the engineer? The interesting part is neither framework choice nor typing speed. It is the process of recognizing what the user actually needs, simplifying the architecture, inspecting the result, responding to observed UX failures, and taking responsibility for what is and isn't verified. The code and revision history should support this claim; prose alone does not.

## My biases and possible blind spots

1. **Simplicity bias.** Strong preference for static data and avoiding backend ceremony. Usually right at this scale; can underweight observability, release controls, privacy, and future expansion costs.
2. **Developer-as-user bias.** The first user understands the local geography and can navigate maps. Someone who doesn't know Kernersville or Lexington may misinterpret presets, distances, 0/3 category counts, or the unlabeled lack of routes.
3. **Aesthetic bias.** A distinctive field-guide UI is pleasant but tiny muted labels and custom tour mechanics can harm contrast and accessibility. Attractive ≠ inclusive.
4. **Data-availability bias.** Hundreds of mapped places feel abundant, but density and correctness vary by category and location. Counts aren't evidence of completeness.
5. **Technical-test bias.** Geometry and taxonomy tests are easy to write, pass, and celebrate; the bug that actually reached the user was map synchronization. The browser suite now exercises real interactions; future tests should still follow observed failure modes.
6. **No-score bias.** Refusing a black-box score prevents false authority, but could force the user to do too much comparison work. A future transparent, user-defined weighting system might be justified by actual demand.
7. **AI confidence bias.** Generated explanations can sound more authoritative than verification warrants. Every statement about security, compliance, accessibility, or deployment needs an observable basis.
8. **Personal-story bias.** A real move makes the pitch compelling, but the hard-coded two-town narrative limits general reuse and exposes private geographic context.

## Hostile interviewer questions and defensible answers

**“Why should I care? Google Maps already exists.”**

Google Maps is excellent for finding individual places. This product is a deliberately narrow comparison between two candidate residential areas: the same categories and radius, two result sets, no invented score. That's useful for a specific decision, not an attempt to replace Google Maps. If people prefer Google Maps after trying it, that's valid evidence to stop.

**“Why Next.js for a static app?”**

The deployment platform and my working familiarity made it cheap to ship. It provides typed React, routing and production builds. Vite would also be valid and possibly simpler; I would migrate only if the framework's ongoing costs justify it. I have not invented a server architecture to make Next.js seem necessary.

**“You used two languages for 483 records?”**

One language runs the browser application; Python only prepares and reviews data offline. The Overture CLI eliminates building and maintaining my own data download path. The additional Python toolchain is a cost, documented and tested. It's not automatically the right choice at every future scale.

**“Isn't 0/3 a fake livability score?”**

It counts selected categories with at least one mapped match, not neighborhood quality. The label could explain that more clearly. No weights, ratings, or travel-time claims are inferred. The user makes the decision.

**“If the circle overlaps the boundary of your downloaded data, aren't the results misleading?”**

Yes, potentially. The app checks the entire search circle against the downloaded box and flags partial coverage in the map and the relevant comparison card. Results are intentionally still shown, with an explicit caveat. That only addresses extract boundaries, not missing businesses within the extract.

**“Can a keyboard-only user move the pin?”**

Yes: the keyboard-help dialog lets them move A or B by arrows and shift-arrows (0.1 or 0.01 miles), or by selecting directional buttons. It uses native dialog keyboard/focus behavior. The path needs a real screen-reader and mobile accessibility review before claiming conformance.

**“How did you verify the app, not just your math?”**

There are unit tests for geography/classification and offline extraction, a snapshot validation test added after review, and CI build checks. We also manually iterated on real map behavior. Chromium browser regressions were added after a real MapLibre worker failure. Accessibility and mobile checks remain insufficiently verified.

**“Can I trust a green CI badge to mean this commit was safe to ship?”**

No. It proves the configured checks succeeded for that commit. It doesn't establish dependency safety, UX accessibility, production smoke tests, or protected deployment promotion. Vercel deployment is a separate mechanism.

**“Did you review security, or just sprinkle security vocabulary into the README?”**

I inspected untrusted-text rendering, external calls, API surface, export tooling, dependencies declared, and config. React text rendering and MapLibre `setText()` avoid obvious injected-HTML paths; there's no app write API or secrets. I fixed the exporter's common-credential filename risk. The workflow now checks production dependency advisories and runs CodeQL on pushes/PRs and weekly. The user reports a clean local audit, but the newly configured CI and Git history have not yet been verified.

**“Why no Docker, SonarQube, database, IaC, microservices, or elaborate pre-commit hooks?”**

None is required to solve the demonstrated user problem. I would add a tool when it prevents an actual expected failure or reduces real maintenance cost. The higher-value next work is a real assistive-technology check, verifying source licenses and notices after refreshing the extract, and testing the actual deployed application.

**“What would you do if you had another afternoon?”**

First, exercise the new keyboard control with a real screen reader and verify the production security workflow; then refresh the extract to retain provenance, review the applicable license notices, and test mobile interaction and live tiles. I wouldn't add features before those reliability gaps are understood.

**“What's your evidence that people want this?”**

One authentic user need, one implemented prototype, and observed interaction changes from direct use. Not product-market fit. The next step is putting it in front of a few people who are actually evaluating neighborhoods, not claiming a market from my own enthusiasm.

**“What did AI do? What did *you* do?”**

AI supported implementation and design review. The product definition, user-specific feedback, rejection of wrong defaults, scope decisions, evaluation of the result, and acceptance of code changes remain human responsibilities. The artifacts, tests, and tradeoffs are inspectable. Authorship of every individual line is less relevant than whether I can explain, verify, and change it.
