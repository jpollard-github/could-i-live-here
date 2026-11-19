# Could I Live Here?

**Pitch:** Compare the everyday places near your current neighborhood and a possible new one, using a small, reproducible extract of [Overture Maps](https://overturemaps.org/) Places data.

**[Live app](https://could-i-live-here.vercel.app/)** · **[Source](https://github.com/jpollard-github/could-i-live-here)** · **[Engineering notes](docs/README.md)**

## Why this product?

A real question motivated it: *If I move from Kernersville to Lexington, what everyday places will be near me?* Property listings describe houses; they don't help compare groceries, cafés, pharmacies, parks, or other routine errands. Pick **A** (current area) and **B** (possible move), choose what matters, adjust a visible **straight-line** radius (0.5 mi by default), and explore the map and full result lists. A/B presets are examples, **not homes for sale**. The walkthrough is optional and starts only when you select **Take the tour**.

## Decisions and tradeoffs

- **Next.js / TypeScript / MapLibre on Vercel:** one small typed web app with a browsable map, accessible form controls, and no custom data service or database.
- **Checked-in Overture Places snapshot:** fast, inspectable, inexpensive for these two towns; coverage, duplicates, and freshness are imperfect. A radius near the extract boundary may omit places.
- **Offline Python extraction:** use Overture's existing Python CLI to obtain/normalize bounded data rather than reimplement ingestion in TypeScript. Python is not part of the deployed runtime.
- **No invented livability score:** user-selected categories and actual great-circle distances, **not** walking routes, recommendations, or claims that unmapped businesses don't exist.
- **Tests where failures happened:** lint/typecheck/unit/data tests plus Chromium browser checks for the real MapLibre worker and core interactions. CI is not a security or accessibility certification.

**Deliberate cuts:** accounts, saved searches, home-listing feeds, geocoding, routing, live hours, a database, AI-generated recommendations, and automated data refresh.

## Run and verify

Requires Node 22+, pnpm 10.20.0 (see `packageManager`), and optionally Python 3 for refreshing data or running browser tests.

```bash
pnpm install --frozen-lockfile
pnpm dev                 # http://localhost:3000
pnpm check               # lint, types, unit tests, production build
```

The repository includes the extracted dataset; no data download is needed just to run it. For a refresh: activate a `.venv`, install `overturemaps`, then run `pnpm data:refresh`. For Chromium tests: install `requirements-e2e.txt`, run `python -m playwright install chromium`, start the built app with `pnpm start`, then run `pnpm test:e2e`. Full commands, source/license caveats, architecture details, review findings, and the AI-assisted workflow are in the **[docs index](docs/README.md)**.
