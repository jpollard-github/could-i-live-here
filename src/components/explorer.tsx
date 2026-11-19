"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { nearbyByCategory, essentialsCount, type CategoryResult } from "@/lib/derive";
import { circleWithinBBox, formatDistance, insideBBox } from "@/lib/geo";
import { nudgePin, type Direction } from "@/lib/pin-nudge";
import type { Anchor, CategoryId, CityData, CityId, Coordinate, Place, PlacesDataset } from "@/lib/types";
import { MapPanel } from "./map-panel";
import { Walkthrough } from "./walkthrough";
import { AboutDialog } from "./about-dialog";
import { KeyboardHelp } from "./keyboard-help";

type Side = "A" | "B";
type Spot = Anchor & { cityId: CityId };
type Focus = { side: Side; id: string } | null;
type Preset = Anchor & { id: string };

// Approximate sample areas, not real-estate listings or verified home addresses.
// A starts near the Smith Crossing Drive apartments, not at a specific unit.
const PRESETS: Record<CityId, readonly Preset[]> = {
  kernersville: [
    { id: "smith-crossing", label: "Smith Crossing apartments (approx.)", lat: 36.0745, lng: -80.1017 },
    { id: "downtown", label: "Downtown Kernersville (example)", lat: 36.1199, lng: -80.0737 },
    { id: "east", label: "East Kernersville (example)", lat: 36.117, lng: -80.041 },
  ],
  lexington: [
    { id: "downtown", label: "Downtown Lexington (example)", lat: 35.824, lng: -80.2534 },
    { id: "south", label: "South Lexington (example)", lat: 35.7997, lng: -80.2505 },
    { id: "west", label: "West Lexington (example)", lat: 35.826, lng: -80.282 },
    { id: "east", label: "East Lexington (example)", lat: 35.822, lng: -80.225 },
  ],
};
const RADII = [0.5, 1, 2, 3] as const;

function presetSpot(cityId: CityId, preset: Preset): Spot {
  return { ...preset, cityId };
}

export function Explorer({ dataset }: { dataset: PlacesDataset }) {
  const [spots, setSpots] = useState<Record<Side, Spot>>({
    A: presetSpot("kernersville", PRESETS.kernersville[0]),
    B: presetSpot("lexington", PRESETS.lexington[0]),
  });
  const [activeSide, setActiveSide] = useState<Side>("B");
  const [radius, setRadius] = useState<number>(0.5);
  const [selected, setSelected] = useState<CategoryId[]>([]);
  const [focused, setFocused] = useState<Focus>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cameraRevision, setCameraRevision] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const cityFor = (side: Side): CityData => dataset.cities.find((item) => item.id === spots[side].cityId) ?? dataset.cities[0];
  const cityA = cityFor("A");
  const cityB = cityFor("B");
  const activeCity = cityFor(activeSide);
  const activeSpot = spots[activeSide];
  const partialA = !circleWithinBBox(spots.A, radius, cityA.bbox);
  const partialB = !circleWithinBBox(spots.B, radius, cityB.bbox);
  const activePartial = activeSide === "A" ? partialA : partialB;
  const currentFocus = focused?.side === activeSide ? activeCity.places.find((place) => place.id === focused.id) ?? null : null;
  const resultsA = nearbyByCategory(cityA.places, spots.A, radius, selected);
  const resultsB = nearbyByCategory(cityB.places, spots.B, radius, selected);
  const selectedPreset = PRESETS[activeSpot.cityId].find((preset) => preset.lat === activeSpot.lat && preset.lng === activeSpot.lng)?.id ?? "custom";

  function setSpot(side: Side, next: Spot) {
    setSpots((current) => ({ ...current, [side]: next }));
    setFocused(null);
    setNotice(null);
  }

  function activate(side: Side) {
    setActiveSide(side);
    setFocused(null);
    setNotice(null);
    // A/B cards also recenter after someone has manually panned away.
    setCameraRevision((value) => value + 1);
  }

  function changeTown(next: CityId) {
    setSpot(activeSide, presetSpot(next, PRESETS[next][0]));
    setCameraRevision((value) => value + 1);
  }

  function choosePreset(id: string) {
    const preset = PRESETS[activeSpot.cityId].find((entry) => entry.id === id);
    if (preset) {
      setSpot(activeSide, presetSpot(activeSpot.cityId, preset));
      // A new selection is also a camera instruction, even if the map was panned.
      setCameraRevision((value) => value + 1);
    }
  }

  function movePin(point: Coordinate) {
    if (!insideBBox(point, activeCity.bbox)) {
      setNotice("This point is outside the downloaded map area. Try somewhere closer to town.");
      return;
    }
    setSpot(activeSide, { ...point, cityId: activeSpot.cityId, label: `Custom pin · ${activeCity.name}` });
  }

  function moveWithKeyboard(direction: Direction, miles: number) {
    movePin(nudgePin(activeSpot, direction, miles));
  }

  function focusPlace(side: Side, place: Place) {
    setActiveSide(side);
    setFocused({ side, id: place.id });
    setNotice(null);
  }

  function toggleCategory(id: CategoryId) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setFocused(null);
  }

  const activeDataReady = dataset.generatedAt !== null && activeCity.places.length > 0;

  return (
    <div className="site">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Could I Live Here? Home"><span className="wordmark-icon">⌂</span><span>could i live <em>here?</em></span></Link>
        <nav className="header-actions" aria-label="About this app">
          <button type="button" onClick={() => { setAboutOpen(false); setTourOpen(true); }}>Take the tour</button>
          <button type="button" onClick={() => { setTourOpen(false); setAboutOpen(true); }}>Why this exists <span aria-hidden="true">↗</span></button>
        </nav>
      </header>
      <main>
        <section className="intro" aria-labelledby="headline" data-walkthrough="intro">
          <div>
            <p className="eyebrow"><span className="diamond">◆</span> A BETTER QUESTION THAN “NICE HOUSE?”</p>
            <h1 id="headline">Meet the <span>neighborhood.</span></h1>
            <p className="intro-copy">Compare the places around where you live now with places around somewhere you might move. Pick what matters to you; we&apos;ll show what the map actually knows.</p>
          </div>
          <div className="intro-stamp" aria-hidden="true"><span>ONE</span><strong>GOOD</strong><span>QUESTION AT A TIME</span></div>
        </section>

        <div className="workbench">
          <aside className="control-panel" aria-label="Location and amenity controls">
            <div className="control-head"><span className="step-index">01 /</span><h2>Choose a place</h2></div>
            <p className="aside-caption steps-copy"><strong>A</strong> is your current-area reference. <strong>B</strong> is somewhere you might move. Select A or B below to view its map.</p>
            <div className="anchor-picker" data-walkthrough="anchors" role="group" aria-label="Choose which location to edit">
              {(["A", "B"] as const).map((side) => {
                const spot = spots[side];
                return <button type="button" key={side} className={`anchor-card ${activeSide === side ? "active" : ""}`} onClick={() => activate(side)} aria-pressed={activeSide === side}>
                  <span className={`anchor-card-badge ${side === "B" ? "b-badge" : ""}`}>{side}</span>
                  <span><strong>{side === "A" ? "Your current area" : "A possible move"}</strong><small>{spot.label}</small></span>
                  <span className="anchor-view">{activeSide === side ? "On map" : "View"}</span>
                </button>;
              })}
            </div>
            <div className="location-edit" data-walkthrough="sample">
              <p className="edit-heading">EDIT LOCATION {activeSide}</p>
              <label htmlFor="town" className="control-label">TOWN</label>
              <select id="town" value={activeSpot.cityId} onChange={(event) => changeTown(event.target.value as CityId)} className="town-select">
                {dataset.cities.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}, NC</option>)}
              </select>
              <label htmlFor="area" className="control-label area-label">SAMPLE AREA</label>
              <select id="area" className="town-select" value={selectedPreset} onChange={(event) => choosePreset(event.target.value)}>
                {selectedPreset === "custom" && <option value="custom">My custom map pin</option>}
                {PRESETS[activeSpot.cityId].map((preset) => <option key={preset.id} value={preset.id}>{preset.label.replace(" (example)", "")}</option>)}
              </select>
              <button type="button" className="recenter-button" onClick={() => setCameraRevision((value) => value + 1)}>⌖ Center map on {activeSide}</button>
              <button type="button" className="keyboard-help-link" onClick={() => setKeyboardOpen(true)}>⌨ Keyboard help / move pin</button>
              <p className="location-tip"><strong>To choose your own spot:</strong> click empty map space or drag the {activeSide} pin. Click a colored place dot to inspect it instead.</p>
            </div>

            <div className="section-rule" />
            <div className="control-head"><span className="step-index">02 /</span><h2>Choose your essentials</h2></div>
            <p className="aside-caption">Everything starts off. Turn on only what you want to see; each color matches the map and the lists below.</p>
            <div className="filter-grid" aria-label="Essential types" data-walkthrough="essentials">
              {CATEGORIES.map((category) => <button
                type="button"
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                aria-pressed={selected.includes(category.id)}
                className={`category-chip ${selected.includes(category.id) ? "selected" : ""}`}
                style={{ "--category-color": category.color } as CSSProperties}
              ><span className="chip-swatch" aria-hidden="true" /><span aria-hidden="true">{category.symbol}</span><span>{category.label}</span></button>)}
            </div>
            <div className="radius-control" data-walkthrough="radius">
              <span className="control-label">STRAIGHT-LINE RADIUS</span>
              <div className="radius-options" role="group" aria-label="Search radius">
                {RADII.map((value) => <button key={value} type="button" className={radius === value ? "chosen" : ""} onClick={() => setRadius(value)} aria-pressed={radius === value}>{value} mi</button>)}
              </div>
              <p className="radius-caption">The outlined circle on the map is your selected radius. Distances are not driving or walking routes.</p>
            </div>
            <p className="aside-footnote">Missing on the map doesn&apos;t mean missing in real life. Overture&apos;s records are incomplete and may contain duplicates.</p>
          </aside>

          <section className="map-column" aria-label="Neighborhood map and comparison">
            <div className="map-heading">
              <div className="map-heading-label"><span className="live-dot" /> VIEWING <strong>{activeSide}</strong> · {activeCity.name.toUpperCase()}</div>
              <span className="map-heading-help">Drag the {activeSide} pin or click empty map space to relocate it</span>
            </div>
            <MapPanel key={`${activeSide}-${activeCity.id}`} city={activeCity} anchor={activeSpot} side={activeSide} radius={radius} selected={selected} focused={currentFocus} cameraRevision={cameraRevision} onPick={movePin} onFocus={(place) => focusPlace(activeSide, place)} />
            {notice && <p className="inline-notice" role="status">{notice}</p>}
            {activePartial && <p className="coverage-warning" role="status"><strong>Partial map-data coverage.</strong> Part of this {radius}-mile circle lies outside our downloaded Overture extract. Nearby lists might miss places across that boundary. Move the pin inward or choose a smaller radius for a complete geographic search area.</p>}
            {!activeDataReady && <div className="data-banner" role="status"><strong>Map data needs a refresh.</strong> Run <code>pnpm data:refresh</code> and deploy the generated <code>data/places.json</code>. Map tiles may still load without that data.</div>}

            <div className="results-heading" data-walkthrough="comparison">
              <div><span className="eyebrow">THE DAY-TO-DAY CHECK</span><h2>What&apos;s within reach?</h2></div>
              <p>Within {radius} mile{radius === 1 ? "" : "s"}, straight line. Click a card to view its area, or a place to inspect it.</p>
            </div>
            {selected.length === 0 ? <div className="empty-state"><strong>Start with one essential.</strong><span>Choose a colored category on the left. We&apos;ll show its matches for A and B, with all places available to browse.</span></div> : (
              <div className="result-grid is-comparing">
                <ResultsCard title="Current area" anchor={spots.A} city={cityA} results={resultsA} categoryCount={selected.length} letter="A" onFocus={(place) => focusPlace("A", place)} onView={() => activate("A")} focusedId={focused?.side === "A" ? focused.id : null} onClearFocus={() => setFocused(null)} isDataReady={dataset.generatedAt !== null && cityA.places.length > 0} active={activeSide === "A"} partial={partialA} />
                <ResultsCard title="A possible move" anchor={spots.B} city={cityB} results={resultsB} categoryCount={selected.length} letter="B" onFocus={(place) => focusPlace("B", place)} onView={() => activate("B")} focusedId={focused?.side === "B" ? focused.id : null} onClearFocus={() => setFocused(null)} isDataReady={dataset.generatedAt !== null && cityB.places.length > 0} active={activeSide === "B"} partial={partialB} />
              </div>
            )}
          </section>
        </div>

        <section className="lower-note"><span className="asterisk">✳</span><div><h2>A useful answer beats a magical score.</h2><p>Browse every mapped match, not an arbitrary top three. We show straight-line proximity, not quality or convenience. &ldquo;Restaurants&rdquo; is separate from fast food and cafés, but Overture cannot reliably tell independently owned places from chains.</p></div></section>
      </main>
      <footer className="footer"><span>MADE FOR CURIOUS MOVERS. <a href="https://jasonpollard.com" target="_blank" rel="noreferrer">BY JASON POLLARD</a></span><span>Places © <a href="https://overturemaps.org" target="_blank" rel="noreferrer">Overture Maps</a> · Basemap by <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noreferrer">Data licenses & notices</a></span><span>{dataset.generatedAt ? `Extracted ${new Date(dataset.generatedAt).toLocaleDateString("en-US", { timeZone: "UTC" })}` : "Awaiting source extract"}</span></footer>
      {tourOpen && <Walkthrough onClose={() => setTourOpen(false)} />}
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <KeyboardHelp open={keyboardOpen} onClose={() => setKeyboardOpen(false)} side={activeSide} anchor={activeSpot} notice={notice} onMove={moveWithKeyboard} />
    </div>
  );
}

function ResultsCard({ title, anchor, city, results, categoryCount, letter, onFocus, onView, focusedId, onClearFocus, isDataReady, active, partial }: {
  title: string;
  anchor: Spot;
  city: CityData;
  results: CategoryResult[];
  categoryCount: number;
  letter: Side;
  onFocus: (place: Place) => void;
  onView: () => void;
  focusedId: string | null;
  onClearFocus: () => void;
  isDataReady: boolean;
  active: boolean;
  partial: boolean;
}) {
  return <article
    className={`results-card ${active ? "results-active" : ""}`}
    onClick={(event) => {
      // The card is a mouse-sized target, but its buttons keep their own actions.
      // In particular, focusing a place must not be followed by a card activation
      // that clears the focus we just set.
      if (event.target instanceof Element && event.target.closest(".place-row, .text-button")) return;
      if (!active) onView();
    }}
  >
    <div className="result-top"><div className={`result-letter result-${letter.toLowerCase()}`}>{letter}</div><div className="result-title"><small>{title} · {city.name}</small><h3>{anchor.label}</h3></div><div className="count-note"><strong>{isDataReady ? essentialsCount(results) : "—"}<span>/{categoryCount}</span></strong><small>categories found</small></div></div>
    <div className="results-view-row"><button type="button" className="text-button" onClick={onView}>{active ? "Showing this location on map" : `View location ${letter} on map`}</button></div>
    <div className="result-lines">
      {results.map((result) => <CategoryResults key={result.id} result={result} onFocus={onFocus} onClearFocus={onClearFocus} focusedId={focusedId} />)}
    </div>
    {partial && <p className="coverage-note">{letter}: Partial coverage. Some nearby places could be outside the downloaded data.</p>}
    <div className="result-bottom">{isDataReady ? "From the downloaded Overture snapshot. Counts may include duplicate listings." : "Waiting for the first data extract."}</div>
  </article>;
}

function CategoryResults({ result, onFocus, onClearFocus, focusedId }: {
  result: CategoryResult;
  onFocus: (place: Place) => void;
  onClearFocus: () => void;
  focusedId: string | null;
}) {
  const category = CATEGORIES.find((entry) => entry.id === result.id)!;
  const [expanded, setExpanded] = useState(false);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hasFocus = focusedId !== null && result.closest.some(({ place }) => place.id === focusedId);
  const showing = expanded || hasFocus;
  useEffect(() => {
    const list = listRef.current;
    const row = selectedItemRef.current;
    if (!showing || !hasFocus || !list || !row) return;
    // Scroll only the small list, never yank the user away from the map.
    const listBounds = list.getBoundingClientRect();
    const rowBounds = row.getBoundingClientRect();
    if (rowBounds.top < listBounds.top) list.scrollTop -= listBounds.top - rowBounds.top + 8;
    if (rowBounds.bottom > listBounds.bottom) list.scrollTop += rowBounds.bottom - listBounds.bottom + 8;
  }, [showing, focusedId, hasFocus]);

  function toggleList() {
    if (showing) {
      setExpanded(false);
      if (hasFocus) onClearFocus();
    } else setExpanded(true);
  }

  return <div className="category-result" style={{ "--category-color": category.color } as CSSProperties}>
    <div className="category-result-summary">
      <span className="result-swatch" aria-hidden="true" />
      <span className="category-result-name"><strong>{category.symbol} {category.label}</strong><small>{result.count === 0 ? "No mapped matches in this circle" : `${result.count} mapped place${result.count === 1 ? "" : "s"} · closest ${formatDistance(result.nearest!.miles)}`}</small></span>
      {result.count > 0 && <button className="browse-button" type="button" aria-expanded={showing} onClick={toggleList}>{showing ? "Hide" : `Browse ${result.count}`} <span aria-hidden="true">{showing ? "−" : "+"}</span></button>}
    </div>
    {showing && result.count > 0 && <div className="place-scroll" ref={listRef} role="region" aria-label={`${category.label}: ${result.count} mapped places`} tabIndex={0}>
      {result.closest.map(({ place, miles }) => <button type="button" className={`place-row ${focusedId === place.id ? "focused" : ""}`} key={place.id} ref={focusedId === place.id ? selectedItemRef : null} aria-pressed={focusedId === place.id} onClick={() => onFocus(place)} title={place.address ?? place.name}>
        <span className="place-name">{place.name}<small>{place.address ?? "No address in source"}</small></span><span className="place-distance">{formatDistance(miles)}</span>
      </button>)}
    </div>}
  </div>;
}
