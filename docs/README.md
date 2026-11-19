# Engineering notes

These are **optional deep dives**, not homework for someone evaluating the product. The [short README](../README.md) answers the assignment in a minute; the running app is the primary evidence. If a reviewer wants to challenge a decision, the relevant detail is here.

| Document | When to read it |
| --- | --- |
| [Using the repository / commands](COMMANDS.md) | Setup, dev, production, tests, extraction, security audit, export, and F-05 manual check |
| [Product & UX](PRODUCT.md) | Real problem, user journey, accessibility limitations, what we deliberately cut |
| [Architecture & data](ARCHITECTURE.md) | Why Next.js, MapLibre, static Overture JSON, and offline Python; provenance and operations |
| [Quality & security](QUALITY.md) | Threat model, CI/E2E test scope, MapLibre worker incident, commands, unverified claims |
| [Review findings](REVIEW-FINDINGS.md) | Living issue register with decisions, remaining risks and evidence |
| [AI-assisted workflow](AI-WORKFLOW.md) | How editor AI and broader ChatGPT review fit into human selection and verification |
| [Interview notes](INTERVIEW.md) | Thirty-second pitch, potential biases, skeptical questions with concrete answers |
| [Data attribution](DATA-ATTRIBUTION.md) | Provider licenses, notices and source-provenance limitations |
| [Browser tests](../tests/e2e/README.md) | Deterministic map test vs live-provider smoke test |

## Appropriate effort, not universal ceremony

This project is both a real personal decision aid and an educational take-home. I enjoy iterating on a product and understanding why something does or does not work. **I would not ordinarily produce this degree of process and review material for a tiny app by default.** The extra scrutiny is useful here because it exposes product and engineering tradeoffs in an interview. The rule is still to earn each added test, dependency, or abstraction by a credible failure mode or user benefit. This repository's detailed documentation should never be mistaken for the product itself.

The findings register distinguishes **implemented**, **partially addressed**, **accepted**, and **still to verify**. It is not a release log.
