# Map data, provenance and notices

[Documentation index](README.md) · [Architecture](ARCHITECTURE.md) · [Findings](REVIEW-FINDINGS.md)

The map uses two different data services: **Overture Maps Places** for the locally checked-in place records, and **OpenFreeMap** for the basemap. The app itself is not an Overture product.

## Overture Places

Overture's Places theme combines multiple providers with different licenses. [Overture's attribution and licensing page](https://docs.overturemaps.org/attribution/) is authoritative for the current release and links to the provider notices; [Places documentation](https://docs.overturemaps.org/guides/places/) describes the contributors and terms. Among the sources described there are CDLA-Permissive-2.0 data, Foursquare data under Apache-2.0 with its required NOTICE, and CC0 data. There is **not** one universal license covering every source.

The new extraction script retains the per-record `sources` dataset/property identifiers where provided by Overture. These help determine which provider notices are applicable. **The currently committed `data/places.json` predates this change and contains no source identifiers.** A future `pnpm data:refresh` can generate them; this cannot be repaired by adding metadata to already-normalized records. Do not claim verified record-level provenance for the existing snapshot.

**Before wider redistribution or submission:** refresh the extract and inspect the resulting `sources` values; review the providers' license/NOTICE obligations and include applicable full notices and licenses if required. A link to a license page is helpful for attribution but is **not automatically a substitute** for including a required license or NOTICE file with redistributed data. Foursquare's terms in particular merit a deliberate check. An attribution link has been added to the footer so reviewers can inspect Overture's current terms.

## Basemap

MapLibre displays OpenFreeMap's Positron style. OpenFreeMap's on-map credits and its [terms](https://openfreemap.org/tos/) are separate from Overture Places. Do not suppress the renderer's map attribution. User-visible basemap tile availability is a third-party dependency; the place lists still work if tiles fail.

## Limits of the current dataset

The point extract covers only the configured boxes around Lexington and Kernersville, has a heuristic confidence cutoff, and may omit or duplicate places. The site warns when a selected circle crosses an extract boundary. A geographically complete circle does *not* imply a complete or accurate catalog of real-world businesses.
