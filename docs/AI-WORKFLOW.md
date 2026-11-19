# AI-assisted workflow and accountability

This is a description of actual collaboration, not a claim that AI reviewed or verified its own output. See [docs index](README.md).

## AI-assisted development and accountability

The engineering workflow is intentionally **human-selected delegation**: small tasks in editor AI (e.g., Codex), broader product/architecture/review discussions in ChatGPT or another general AI, a Git-ignore-aware review ZIP exported by `pnpm repo:export`, and human inspection before accepting patches. A model drafting code does not approve it; passing lint does not approve it either.

A convincing account in an interview contains *examples of disagreement and revision*: restaurant categories had to be split; default selections overwhelmed the map; the A/B model needed explicit instruction; map camera updates needed correction; the need for source attribution and accessibility emerged in review. The skill is not asking AI to build a site. It is repeatedly rejecting unnecessary complexity and inspecting actual behavior.

**Avoid claiming:** AI-review automation is secure by default, that an uploaded repository cannot contain secrets, or that code authored with AI has been “independently audited” unless an actual audit occurred. This document is deliberately candid about its own limits. Automating repo uploads would be possible; adding that before a clear benefit would remove a useful consent/review checkpoint.

## Why the process is unusually thorough for the size of the app

For an ordinary small internal utility, I would stop earlier once its practical use and risks were understood. This is an interview work sample **and** a deliberately educational exercise in product iteration, technical judgment, testing at the right layer, and AI-assisted review. I enjoy the improvement process; that is different from advocating this amount of documentation or infrastructure for every small application. The stopping rule is still: does the next change help the user, prevent an observed regression, or answer a material reviewer question?
