# Engineering notes

The [live app](https://could-i-live-here.vercel.app/) is the product. The [short README](../README.md) is the take-home submission summary. Everything below is optional: pick the question you're trying to answer instead of reading the documentation front to back.

## Three ways in

### 1. Understand the product

**Question:** *Why would someone use this, and what decisions shaped the experience?*

Start with [Product & UX](PRODUCT.md) for the real moving-house question, the A/B journey, and intentional omissions. Then read [Architecture & data](ARCHITECTURE.md) for the static Overture extract and why the application doesn't need a backend. See [Data attribution](DATA-ATTRIBUTION.md) for the boundaries of what we can claim about the source.

### 2. Work on the code

**Question:** *How do I run, change, or verify something without guessing?*

Start with [Commands](COMMANDS.md) for setup, tests, data refresh, and repo export. Then use [Quality & security](QUALITY.md) to see what CI and browser tests actually establish. Check [Review findings](REVIEW-FINDINGS.md) for known problems and accepted tradeoffs. The [browser-test guide](../tests/e2e/README.md) explains deterministic versus live-map testing.

### 3. Challenge the engineering decisions

**Question:** *Why this approach, what went wrong, and what would you change?*

Start with [Interview questions](INTERVIEW.md) for the short explanation, skeptical objections, biases, and mentoring approaches. Follow the specific question into [Architecture & data](ARCHITECTURE.md), [Quality & security](QUALITY.md), or the [living findings](REVIEW-FINDINGS.md). [AI-assisted workflow](AI-WORKFLOW.md) explains which work was delegated and how decisions were reviewed.

## Find a decision quickly

| Question | Start here |
| --- | --- |
| Why Next.js, Python, static JSON, and no database? | [Architecture: stack and scope](ARCHITECTURE.md#architecture-and-why-the-stack-is-this-small) |
| Why the custom MapLibre worker setup? | [Architecture: MapLibre 6 worker](ARCHITECTURE.md#why-we-own-a-maplibre-worker-preparation-script) |
| What do the map data and radius *not* guarantee? | [Architecture: data limits](ARCHITECTURE.md#data-correctness-provenance-and-licensing) · [Review findings](REVIEW-FINDINGS.md) |
| What is actually tested, audited, and deployed? | [Quality: verification](QUALITY.md#verification-what-ci-does-and-does-not-establish) |
| How does AI fit without outsourcing judgment? | [AI-assisted workflow](AI-WORKFLOW.md) |
| What would we fix, defer, or refuse to build next? | [Product: next steps](PRODUCT.md#what-id-do-next-and-what-i-would-refuse-to-add) · [Review findings](REVIEW-FINDINGS.md) |

## Why this much documentation?

This is a real personal decision aid **and** an educational take-home. I enjoy using a working product to discover mistakes and improve it, including the engineering process. I **wouldn't routinely apply this much documentation or CI ceremony to a tiny app**. Here, it provides an inspectable record of decisions and tradeoffs for a technical conversation. More process still needs to earn its cost.

A finding marked **implemented** means there's code and some stated evidence, not a blanket claim of production readiness, security, or accessibility conformance.
