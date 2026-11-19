# Map data, provenance and notices

[Documentation index](README.md) · [Architecture](ARCHITECTURE.md) · [Findings](REVIEW-FINDINGS.md)

The map uses two different data services: **Overture Maps Places** for the locally checked-in place records, and **OpenFreeMap** for the basemap. The app itself is not an Overture product.

## Overture Places

Overture's Places theme combines multiple providers with different licenses. [Overture's attribution and licensing page](https://docs.overturemaps.org/attribution/) is authoritative for the current release and links to the provider notices; [Places documentation](https://docs.overturemaps.org/guides/places/) describes the contributors and terms. Among the sources described there are CDLA-Permissive-2.0 data, Foursquare data under Apache-2.0 with its required NOTICE, and CC0 data. There is **not** one universal license covering every source.

The extractor retains compact per-record `sources` dataset/property identifiers. The latest `data/places.json` was refreshed and all **424 retained records** have source identifiers, including entries such as Overture, Foursquare, and Microsoft. These identifiers help identify possible notice requirements but are not themselves a complete licensing review. An older JSON without source identifiers cannot be repaired without re-extracting the source data.

**Before wider redistribution or submission:** review the providers' license/NOTICE obligations against the refreshed `sources` values and include applicable full notices and licenses if required. A link to a license page is helpful for attribution but is **not automatically a substitute** for including a required license or NOTICE file with redistributed data. Foursquare's terms in particular merit a deliberate check. An attribution link has been added to the footer so reviewers can inspect Overture's current terms.

## Basemap

MapLibre displays OpenFreeMap's Positron style. OpenFreeMap's on-map credits and its [terms](https://openfreemap.org/tos/) are separate from Overture Places. Do not suppress the renderer's map attribution. User-visible basemap tile availability is a third-party dependency; the place lists still work if tiles fail.

## Limits of the current dataset

The point extract covers only the configured boxes around Lexington and Kernersville, has a heuristic confidence cutoff, and may omit or duplicate places. The site warns when a selected circle crosses an extract boundary. A geographically complete circle does *not* imply a complete or accurate catalog of real-world businesses.
