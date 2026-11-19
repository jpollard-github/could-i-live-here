# Browser tests

These tests use Playwright **Python** because this repo already has Python
scripts and CI. The app shipped to Vercel remains entirely TypeScript.

The default suite intercepts the remote *basemap style* with a tiny, locally
supplied GeoJSON style. This keeps CI deterministic while still exercising a
real Chromium browser, MapLibre's **module worker**, canvas, sources, camera,
pin, and user controls. It would fail if the v6 worker could not start. It does
**not** validate OpenFreeMap uptime, tile content, or every pixel.

For a manual **live OpenFreeMap** smoke test, set `LIVE_MAP_STYLE=1`. That mode
requires external network access and may fail when the provider is unavailable.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-e2e.txt
python -m playwright install chromium
pnpm build
pnpm start &
pnpm test:e2e
# Optional real network smoke:
pnpm test:e2e:live
```

If you prefer installed Chrome/Chromium: `E2E_CHROMIUM_EXECUTABLE=/path/to/chrome pnpm test:e2e`.
The tests read `E2E_BASE_URL` (default `http://127.0.0.1:3000`).
