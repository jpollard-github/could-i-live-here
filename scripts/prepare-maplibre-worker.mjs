/**
 * MapLibre 6 uses a module Worker. Next.js/Turbopack cannot reliably derive
 * the worker URL from import.meta.url, so copy the installed, matching worker
 * to a predictable same-origin URL before `next dev` and `next build`.
 *
 * The MapLibre 6.19 worker is self-contained; copy the optional shared module
 * too for compatibility with other 6.x minor versions.
 * Fail fast: shipping an absent worker produces a deceptively blank map.
 */
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve("maplibre-gl/package.json"));
const { version } = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Unexpected MapLibre version: ${version}`);
const sourceDir = join(packageDir, "dist");
const destination = resolve("public", "vendor", "maplibre-gl", version);
mkdirSync(destination, { recursive: true });

const worker = join(sourceDir, "maplibre-gl-worker.mjs");
if (!existsSync(worker)) throw new Error(`Missing MapLibre worker: ${worker}`);
cpSync(worker, join(destination, "maplibre-gl-worker.mjs"));
const shared = join(sourceDir, "maplibre-gl-shared.mjs");
if (existsSync(shared)) cpSync(shared, join(destination, "maplibre-gl-shared.mjs"));
console.log(`MapLibre ${version} worker ready at /vendor/maplibre-gl/${version}/maplibre-gl-worker.mjs`);
