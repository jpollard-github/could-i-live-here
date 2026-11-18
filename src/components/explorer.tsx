"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { nearbyByCategory, essentialsCount, type CategoryResult } from "@/lib/derive";
import { formatDistance, insideBBox } from "@/lib/geo";
import type { Anchor, CategoryId, Coordinate, Place, PlacesDataset } from "@/lib/types";
import { MapPanel } from "./map-panel";

const PRESETS: Record<string, [Anchor, Anchor]> = {
  lexington: [
    { label: "Downtown Lexington", lat: 35.824, lng: -80.2534 },
    { label: "South Lexington", lat: 35.7997, lng: -80.2505 },
  ],
  kernersville: [
    { label: "Downtown Kernersville", lat: 36.1199, lng: -80.0737 },
    { label: "East Kernersville", lat: 36.117, lng: -80.041 },
  ],
};
const RADII = [0.5, 1, 2, 3] as const;

export function Explorer({ dataset }: { dataset: PlacesDataset }) {
  const [cityId, setCityId] = useState(dataset.cities[0].id);
  const city = dataset.cities.find((candidate) => candidate.id === cityId) ?? dataset.cities[0];
  const [a, setA] = useState<Anchor>(PRESETS[cityId][0]);
  const [b, setB] = useState<Anchor>(PRESETS[cityId][1]);
  const [activeSide, setActiveSide] = useState<"A" | "B">("A");
  const [compare, setCompare] = useState(true);
  const [radius, setRadius] = useState<number>(2);
  const [selected, setSelected] = useState<CategoryId[]>(CATEGORIES.map((category) => category.id));
  const [focused, setFocused] = useState<Place | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resultsA = useMemo(() => nearbyByCategory(city.places, a, radius, selected), [city, a, radius, selected]);
  const resultsB = useMemo(() => nearbyByCategory(city.places, b, radius, selected), [city, b, radius, selected]);
  const dataReady = dataset.generatedAt !== null && city.places.length > 0;

  function pickCity(next: string) {
    setCityId(next as typeof cityId);
    setA(PRESETS[next][0]);
    setB(PRESETS[next][1]);
    setFocused(null);
    setNotice(null);
    setActiveSide("A");
  }

  function pickPoint(point: Coordinate) {
    if (!insideBBox(point, city.bbox)) {
      setNotice("That point is outside our downloaded area. Try closer to town.");
      return;
    }
    setNotice(null);
    const anchor = { ...point, label: "Your map pin" };
    if (activeSide === "A") setA(anchor);
    else setB(anchor);
  }

  function toggleCategory(id: CategoryId) {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
    setFocused(null);
  }

  return (
    <div className="site">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Could I Live Here? Home">
          <span className="wordmark-icon">⌂</span>
          <span>could i live <em>here?</em></span>
        </Link>
        <span className="header-postmark">A SMALL FIELD GUIDE TO EVERYDAY LIFE <span aria-hidden="true">✳</span></span>
      </header>

      <main>
        <section className="intro" aria-labelledby="headline">
          <div>
            <p className="eyebrow"><span className="diamond">◆</span> BEFORE YOU FALL FOR THE HOUSE</p>
            <h1 id="headline">Meet the <span>neighborhood.</span></h1>
            <p className="intro-copy">The listing shows the kitchen. We show where you&apos;ll buy the coffee, pick up a prescription, and get that one screw you forgot.</p>
          </div>
          <div className="intro-stamp" aria-hidden="true"><span>NO</span><strong>VIBES</strong><span>ONLY FACTS*</span></div>
        </section>

        <div className="workbench">
          <aside className="control-panel" aria-label="Neighborhood controls">
            <div className="control-head"><span className="step-index">01 /</span><h2>Pick your patch</h2></div>
            <label htmlFor="city" className="control-label">TOWN</label>
            <select id="city" value={city.id} onChange={(event) => pickCity(event.target.value)} className="town-select">
              {dataset.cities.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}, NC</option>)}
            </select>

            <p className="control-label small-gap">TWO PLACES TO PICTURE YOUR LIFE</p>
            <div className="anchor-picker">
              <button type="button" className={`anchor-card ${activeSide === "A" ? "active" : ""}`} onClick={() => { setActiveSide("A"); setFocused(null); }} aria-pressed={activeSide === "A"}>
                <span className="anchor-card-badge">A</span><span><strong>{a.label}</strong><small>{a.lat.toFixed(3)}, {a.lng.toFixed(3)}</small></span>
              </button>
              {compare && <button type="button" className={`anchor-card ${activeSide === "B" ? "active" : ""}`} onClick={() => { setActiveSide("B"); setFocused(null); }} aria-pressed={activeSide === "B"}>
                <span className="anchor-card-badge b-badge">B</span><span><strong>{b.label}</strong><small>{b.lat.toFixed(3)}, {b.lng.toFixed(3)}</small></span>
              </button>}
            </div>
            <div className="preset-actions">
              <button type="button" className="text-button" onClick={() => { setA(PRESETS[city.id][0]); setActiveSide("A"); setFocused(null); }}>Reset A</button>
              {compare && <button type="button" className="text-button" onClick={() => { setB(PRESETS[city.id][1]); setActiveSide("B"); setFocused(null); }}>Reset B</button>}
            </div>
            <label className="compare-toggle"><input type="checkbox" checked={compare} onChange={(event) => { setCompare(event.target.checked); if (!event.target.checked) setActiveSide("A"); }} /><span>Compare two spots</span></label>

            <div className="section-rule" />
            <div className="control-head"><span className="step-index">02 /</span><h2>What matters?</h2></div>
            <p className="aside-caption">Choose the everyday essentials you care about.</p>
            <div className="filter-grid" aria-label="Essential types">
              {CATEGORIES.map((category) => <button
                type="button"
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                aria-pressed={selected.includes(category.id)}
                className={`category-chip ${selected.includes(category.id) ? "selected" : ""}`}
              ><span aria-hidden="true">{category.symbol}</span><span>{category.label}</span></button>)}
            </div>
            <div className="radius-control">
              <span className="control-label">STRAIGHT-LINE RADIUS</span>
              <div className="radius-options" aria-label="Search radius">
                {RADII.map((value) => <button key={value} type="button" className={radius === value ? "chosen" : ""} onClick={() => setRadius(value)} aria-pressed={radius === value}>{value} mi</button>)}
              </div>
            </div>
            <p className="aside-footnote">*Actual places from Overture Maps when data is loaded. No invented neighborhood grades. No walk-time fairy tales.</p>
          </aside>

          <section className="map-column" aria-label="Neighborhood map and comparison">
            <div className="map-heading"><span className="map-heading-label"><span className="live-dot" /> THE BIG PICTURE</span><span className="map-heading-help">Click map to move location <strong>{activeSide}</strong></span></div>
            <MapPanel key={city.id} city={city} a={a} b={b} compare={compare} selected={selected} focused={focused} onPick={pickPoint} />
            {notice && <p className="inline-notice" role="status">{notice}</p>}
            {!dataReady && <div className="data-banner" role="status"><strong>Map data needs its first refresh.</strong> The interface is ready, but this ZIP cannot include an unverified Overture extract. Run <code>pnpm data:refresh</code> on a network-connected machine, then deploy the generated <code>data/places.json</code>. The basemap still works.</div>}

            <div className="results-heading">
              <div><span className="eyebrow">THE DAY-TO-DAY CHECK</span><h2>What&apos;s within reach?</h2></div>
              <p>{radius} mile{radius === 1 ? "" : "s"} as the crow flies. Not driving or walking distance.</p>
            </div>
            {selected.length === 0 ? <div className="empty-state">Pick an essential above to start looking around.</div> : (
              <div className={`result-grid ${compare ? "is-comparing" : ""}`}>
                <ResultsCard title="Location A" anchor={a} results={resultsA} categoryCount={selected.length} letter="A" onFocus={setFocused} isDataReady={dataReady}/>
                {compare && <ResultsCard title="Location B" anchor={b} results={resultsB} categoryCount={selected.length} letter="B" onFocus={setFocused} isDataReady={dataReady} />}
              </div>
            )}
          </section>
        </div>

        <section className="lower-note"><span className="asterisk">✳</span><div><h2>A useful answer beats a magical score.</h2><p>We count mapped essentials, show the closest three per category, and let you decide what matters. An absent listing doesn&apos;t prove a business or park doesn&apos;t exist. Overture coverage varies by place and category.</p></div></section>
      </main>
      <footer className="footer"><span>MADE FOR CURIOUS MOVERS, NOT REAL ESTATE ALGORITHMS.</span><span>Places © <a href="https://overturemaps.org" target="_blank" rel="noreferrer">Overture Maps</a> · Basemap by <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://docs.overturemaps.org/guides/places/" target="_blank" rel="noreferrer">About the data</a></span><span>{dataset.generatedAt ? `Extracted ${new Date(dataset.generatedAt).toLocaleDateString("en-US", { timeZone: "UTC" })}` : "Awaiting source extract"}</span></footer>
    </div>
  );
}

function ResultsCard({ title, anchor, results, categoryCount, letter, onFocus, isDataReady }: {
  title: string;
  anchor: Anchor;
  results: CategoryResult[];
  categoryCount: number;
  letter: "A" | "B";
  onFocus: (place: Place) => void;
  isDataReady: boolean;
}) {
  return <article className="results-card">
    <div className="result-top"><div className={`result-letter result-${letter.toLowerCase()}`}>{letter}</div><div className="result-title"><small>{title}</small><h3>{anchor.label}</h3></div><div className="count-note"><strong>{isDataReady ? essentialsCount(results) : "—"}<span>/{categoryCount}</span></strong><small>essentials found</small></div></div>
    <div className="result-lines">
      {results.map((result) => {
        const config = CATEGORIES.find((item) => item.id === result.id)!;
        return <div className="result-line" key={result.id}>
          <div className="line-symbol" aria-hidden="true">{config.symbol}</div>
          <div className="line-info"><strong>{config.label}</strong><span>{result.nearest ? `${result.count} within radius` : "No mapped matches"}</span>
            {result.closest.map(({ place, miles }) => <button className="nearest-link" key={place.id} onClick={() => onFocus(place)} type="button" title={place.address ?? place.name}>{place.name} <span>{formatDistance(miles)}</span></button>)}
          </div>
          <div className="line-distance">{result.nearest ? formatDistance(result.nearest.miles) : "—"}</div>
        </div>;
      })}
    </div>
    <div className="result-bottom">{isDataReady ? "Based on the downloaded Overture snapshot." : "Waiting for the first data extract."}</div>
  </article>;
}
