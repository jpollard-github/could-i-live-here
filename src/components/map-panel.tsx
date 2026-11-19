"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, categoryForPlace } from "@/lib/categories";
import { radiusRing, ringBounds } from "@/lib/circle";
import { insideBBox, milesBetween } from "@/lib/geo";
import { reportClientError } from "@/lib/log";
import type { Anchor, CategoryId, CityData, Coordinate, Place } from "@/lib/types";

type Side = "A" | "B";
type Props = {
  city: CityData;
  anchor: Anchor;
  side: Side;
  radius: number;
  cameraRevision: number;
  selected: readonly CategoryId[];
  focused: Place | null;
  onPick: (point: Coordinate) => void;
  onFocus: (place: Place) => void;
};

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const EMPTY_GEOJSON = { type: "FeatureCollection" as const, features: [] };

/** The map shows ONE location at a time; choose A/B to move between towns. */
export function MapPanel({ city, anchor, side, radius, cameraRevision, selected, focused, onPick, onFocus }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const hoverRef = useRef<import("maplibre-gl").Popup | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const handlersRef = useRef({ onPick, onFocus });
  const propsRef = useRef({ city, anchor, radius, selected, focused });
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => { handlersRef.current = { onPick, onFocus }; }, [onPick, onFocus]);
  useEffect(() => { propsRef.current = { city, anchor, radius, selected, focused }; }, [city, anchor, radius, selected, focused]);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    let localMap: import("maplibre-gl").Map | null = null;
    async function initialize() {
      try {
        const maplibre = await import("maplibre-gl");
        if (disposed || !containerRef.current) return;
        const initial = propsRef.current.anchor;
        const map = new maplibre.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: [initial.lng, initial.lat],
          zoom: 14,
        });
        mapRef.current = map;
        localMap = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        hoverRef.current = new maplibre.Popup({ closeButton: false, closeOnClick: false, offset: 13 });
        const marker = new maplibre.Marker({ element: anchorElement(side), draggable: true })
          .setLngLat([initial.lng, initial.lat]).addTo(map);
        marker.on("dragend", () => {
          const position = marker.getLngLat();
          const point = { lng: position.lng, lat: position.lat };
          if (!insideBBox(point, propsRef.current.city.bbox)) {
            // Do not leave the dragged marker outside the data we downloaded.
            marker.setLngLat([propsRef.current.anchor.lng, propsRef.current.anchor.lat]);
          }
          handlersRef.current.onPick(point);
        });
        markerRef.current = marker;

        map.on("load", () => {
          if (disposed) return;
          map.addSource("search-radius", { type: "geojson", data: EMPTY_GEOJSON });
          map.addLayer({ id: "search-radius-fill", type: "fill", source: "search-radius", paint: { "fill-color": "#2b6b53", "fill-opacity": 0.08 } });
          map.addLayer({ id: "search-radius-edge", type: "line", source: "search-radius", paint: { "line-color": "#284c3d", "line-width": 2.5, "line-dasharray": [2, 2] } });
          map.addSource("essentials", { type: "geojson", data: EMPTY_GEOJSON });
          map.addLayer({
            id: "essentials-dots", type: "circle", source: "essentials",
            paint: {
              "circle-radius": 6,
              "circle-color": ["get", "color"],
              "circle-stroke-color": "#fffdf7", "circle-stroke-width": 1.8,
            },
          });
          map.addLayer({
            id: "essentials-focused", type: "circle", source: "essentials",
            filter: ["==", ["get", "id"], ""],
            paint: { "circle-radius": 12, "circle-color": "#fffdf7", "circle-opacity": 0.16, "circle-stroke-color": "#202c26", "circle-stroke-width": 3 },
          });
          map.getCanvas().style.cursor = "crosshair";
          map.on("mousemove", "essentials-dots", (event) => {
            const id = event.features?.[0]?.properties?.id;
            const place = propsRef.current.city.places.find((item) => item.id === id);
            if (!place) return;
            map.getCanvas().style.cursor = "pointer";
            if (hoveredIdRef.current === place.id) return;
            hoveredIdRef.current = place.id;
            const category = CATEGORIES.find((item) => item.id === categoryForPlace(place));
            hoverRef.current?.setLngLat([place.lng, place.lat]).setText(`${place.name}${category ? ` · ${category.label}` : ""}`).addTo(map);
          });
          map.on("mouseleave", "essentials-dots", () => {
            map.getCanvas().style.cursor = "crosshair";
            hoverRef.current?.remove();
            hoveredIdRef.current = null;
          });
          map.on("click", "essentials-dots", (event) => {
            const id = event.features?.[0]?.properties?.id;
            const place = propsRef.current.city.places.find((item) => item.id === id);
            if (place) handlersRef.current.onFocus(place);
          });
          map.on("click", (event) => {
            // A place inspection must NEVER also move the selected A/B location.
            if (map.queryRenderedFeatures(event.point, { layers: ["essentials-dots", "essentials-focused"] }).length > 0) return;
            handlersRef.current.onPick({ lng: event.lngLat.lng, lat: event.lngLat.lat });
          });
          updateLayers(map, propsRef.current);
          fitRadius(map, propsRef.current.anchor, propsRef.current.radius, false);
          if (propsRef.current.focused) flyToPlace(map, propsRef.current.focused);
        });
        let reported = false;
        map.on("error", (event) => {
          if (reported) return;
          reported = true;
          reportClientError("map_tiles", event.error);
          setUnavailable(true);
        });
      } catch (error) {
        reportClientError("map_init", error);
        if (!disposed) setUnavailable(true);
      }
    }
    void initialize();
    return () => {
      disposed = true;
      hoverRef.current?.remove();
      hoveredIdRef.current = null;
      hoverRef.current = null;
      markerRef.current?.remove();
      markerRef.current = null;
      localMap?.remove();
      if (mapRef.current === localMap) mapRef.current = null;
    };
    // The parent remounts when switching A/B or towns; later edits use effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.setLngLat([anchor.lng, anchor.lat]);
    // isStyleLoaded() may be false while tiles are still downloading. The
    // sources already exist at that point, so do not silently drop updates.
    updateLayers(map, { city, anchor, radius, selected, focused });
    hoverRef.current?.remove();
    hoveredIdRef.current = null;
  }, [city, anchor, radius, selected, focused]);

  useEffect(() => {
    const map = mapRef.current;
    // Camera movement doesn't require loaded map tiles or a finished style.
    // This also honors explicit "center map" requests when coordinates haven't changed.
    if (map) fitRadius(map, anchor, radius, true);
  }, [anchor, radius, cameraRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && focused) flyToPlace(map, focused);
  }, [focused]);

  return <div className="map-shell" data-walkthrough="map">
    <div className="map-container" ref={containerRef} role="application" aria-label={`Map for location ${side}, ${city.name}. Click empty space to move ${side}, drag the ${side} pin, or click a colored dot to inspect a place.`} />
    <div className="map-hint"><span className="map-hint-dot" /> Dashed circle = {radius} mi · dots = selected essentials · drag {side} to move</div>
    {unavailable && <p className="map-warning" role="status">Some map tiles are unavailable. The place lists and comparison below still work.</p>}
  </div>;
}

function updateLayers(map: import("maplibre-gl").Map, props: Pick<Props, "city" | "anchor" | "radius" | "selected" | "focused">): void {
  const area = map.getSource("search-radius") as import("maplibre-gl").GeoJSONSource | undefined;
  const dots = map.getSource("essentials") as import("maplibre-gl").GeoJSONSource | undefined;
  if (!area || !dots) return;
  const ring = radiusRing(props.anchor, props.radius);
  area.setData({ type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } }] });
  const active = new Set(props.selected);
  const features = props.city.places.flatMap((place) => {
    const category = categoryForPlace(place);
    if (category === null || !active.has(category) || milesBetween(props.anchor, place) > props.radius) return [];
    return [{ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [place.lng, place.lat] }, properties: { id: place.id, name: place.name, category, color: CATEGORIES.find((entry) => entry.id === category)!.color } }];
  });
  dots.setData({ type: "FeatureCollection", features });
  map.setFilter("essentials-focused", ["==", ["get", "id"], props.focused?.id ?? ""]);
}

function fitRadius(map: import("maplibre-gl").Map, anchor: Anchor, radius: number, animate: boolean): void {
  const bounds = ringBounds(radiusRing(anchor, radius));
  map.fitBounds(bounds, { padding: 60, maxZoom: 15.5, duration: animate ? 300 : 0 });
}

function flyToPlace(map: import("maplibre-gl").Map, place: Place): void {
  map.flyTo({ center: [place.lng, place.lat], zoom: Math.max(map.getZoom(), 14.4), essential: true });
}

function anchorElement(letter: Side): HTMLElement {
  const marker = document.createElement("div");
  marker.className = `anchor-marker anchor-${letter.toLowerCase()}`;
  marker.textContent = letter;
  marker.title = `Drag to move location ${letter}`;
  marker.setAttribute("aria-label", `Drag location ${letter} to a different spot`);
  return marker;
}
