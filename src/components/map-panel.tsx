"use client";

import { useEffect, useRef, useState } from "react";
import type { CityData, Anchor, CategoryId, Coordinate, Place } from "@/lib/types";
import { matchingCategories } from "@/lib/categories";
import { reportClientError } from "@/lib/log";

type Props = {
  city: CityData;
  a: Anchor;
  b: Anchor;
  compare: boolean;
  selected: readonly CategoryId[];
  focused: Place | null;
  onPick: (point: Coordinate) => void;
};

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

/** A client-only map. The rest of the product remains usable if tiles fail. */
export function MapPanel({ city, a, b, compare, selected, focused, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);
  const onPickRef = useRef(onPick);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => { onPickRef.current = onPick; }, [onPick]);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    let localMap: import("maplibre-gl").Map | null = null;
    async function start() {
      try {
        const maplibregl = await import("maplibre-gl");
        if (disposed || !containerRef.current) return;
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: city.center,
          zoom: 12.1,
        });
        localMap = map;
        mapRef.current = map;
        // Put pins on the map immediately. The effect below handles later changes.
        markersRef.current = [
          new maplibregl.Marker({ element: anchorElement("A") }).setLngLat([a.lng, a.lat]).addTo(map),
          ...(compare ? [new maplibregl.Marker({ element: anchorElement("B") }).setLngLat([b.lng, b.lat]).addTo(map)] : []),
        ];
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => {
          if (disposed) return;
          map.addSource("essentials", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          map.addLayer({
            id: "essentials-shadow",
            type: "circle",
            source: "essentials",
            paint: { "circle-radius": 9, "circle-color": "#fffaf0", "circle-stroke-color": "#273932", "circle-stroke-width": 1.8 },
          });
          map.addLayer({
            id: "essentials-dot",
            type: "circle",
            source: "essentials",
            paint: { "circle-radius": 4.5, "circle-color": "#e36a46" },
          });
          map.on("mouseenter", "essentials-dot", () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", "essentials-dot", () => { map.getCanvas().style.cursor = "crosshair"; });
          map.on("click", "essentials-dot", (event) => {
            const name = event.features?.[0]?.properties?.name;
            if (typeof name === "string") {
              new maplibregl.Popup({ closeButton: false, offset: 12 })
                .setLngLat(event.lngLat)
                .setText(name)
                .addTo(map);
            }
          });
          map.getCanvas().style.cursor = "crosshair";
          updateDots(map, city.places, selected);
        });
        map.on("click", (event) => onPickRef.current({ lng: event.lngLat.lng, lat: event.lngLat.lat }));
        // Avoid spamming console if tile access fails repeatedly.
        let mapErrorReported = false;
        map.on("error", (event) => {
          if (mapErrorReported) return;
          mapErrorReported = true;
          reportClientError("map_tiles", event.error);
          setUnavailable(true);
        });
      } catch (error) {
        reportClientError("map_init", error);
        if (!disposed) setUnavailable(true);
      }
    }
    void start();

    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (localMap) localMap.remove();
      if (mapRef.current === localMap) mapRef.current = null;
    };
    // Rebuild only when switching city. Selection updates use their own effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) updateDots(map, city.places, selected);
    else map.once("load", () => updateDots(map, city.places, selected));
  }, [city, selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let disposed = false;
    void import("maplibre-gl").then((maplibregl) => {
      if (disposed || !mapRef.current || mapRef.current !== map) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [
        new maplibregl.Marker({ element: anchorElement("A") }).setLngLat([a.lng, a.lat]).addTo(map),
        ...(compare ? [new maplibregl.Marker({ element: anchorElement("B") }).setLngLat([b.lng, b.lat]).addTo(map)] : []),
      ];
    });
    return () => { disposed = true; };
  }, [a, b, compare, city.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && focused) map.flyTo({ center: [focused.lng, focused.lat], zoom: Math.max(13.5, map.getZoom()), essential: true });
  }, [focused]);

  return (
    <div className="map-shell">
      <div className="map-container" ref={containerRef} role="application" aria-label={`Map of ${city.name}. Click to move the selected location.`} />
      <div className="map-hint"><span className="map-hint-dot" /> Pick any spot on the map</div>
      {unavailable && (
        <p className="map-warning" role="status">Map tiles are unavailable. Use the preset locations and neighborhood details below.</p>
      )}
    </div>
  );
}

function updateDots(map: import("maplibre-gl").Map, places: readonly Place[], selected: readonly CategoryId[]) {
  const source = map.getSource("essentials") as import("maplibre-gl").GeoJSONSource | undefined;
  if (!source) return;
  const active = new Set(selected);
  // Deliberately no geocoder, third-party place lookup, or invented street network.
  const features = places.filter((place) => matchingCategories(place).some((category) => active.has(category)))
    .map((place) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [place.lng, place.lat] },
      properties: { id: place.id, name: place.name },
    }));
  source.setData({ type: "FeatureCollection", features });
}

function anchorElement(letter: "A" | "B"): HTMLElement {
  const marker = document.createElement("div");
  marker.className = `anchor-marker anchor-${letter.toLowerCase()}`;
  marker.textContent = letter;
  marker.setAttribute("aria-label", `Location ${letter}`);
  return marker;
}
