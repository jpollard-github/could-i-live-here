"use client";

import { useEffect, useRef } from "react";

/** A native dialog avoids building a second custom focus/keyboard system. */
export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog className="decision-dialog" ref={ref} onClose={onClose} onClick={(event) => { if (event.target === ref.current) ref.current?.close(); }} aria-labelledby="decisions-title">
    <div className="decision-head">
      <span className="eyebrow">THE REASONING BEHIND THE MAP</span>
      <button type="button" className="decision-close" onClick={() => ref.current?.close()} aria-label="Close explanation">×</button>
    </div>
    <h2 id="decisions-title">Why this exists.</h2>
    <p className="decision-lead">Overture Maps offers open geographic data. The challenge was to turn it into something a person would actually use, not simply another page full of pins.</p>
    <div className="decision-columns">
      <section><h3>The real problem</h3><p>Jason is considering a move from Kernersville to Lexington. House listings describe buildings. This app compares the everyday amenities around two areas, leaving the actual choice to the person moving.</p></section>
      <section><h3>The product decision</h3><p>Two named points, categories you select, a visible radius, and complete browsable results. No anonymous neighborhood score, invented driving times, or claims that missing map records mean missing businesses.</p></section>
      <section><h3>The engineering decision</h3><p>Next.js and TypeScript run the Vercel app. MapLibre draws the map. A bounded Overture snapshot is loaded as static JSON; a server and database would add complexity without helping this small use case.</p></section>
      <section><h3>Why Python, too?</h3><p>The maintained Overture Python tooling does the offline bounding-box extract and normalization. Python never runs in production here. Reimplementing that ingestion in TypeScript would increase code without improving this product.</p></section>
      <section><h3>What’s deliberately absent</h3><p>No accounts, routing engine, live opening hours, geocoder, ranking model, or ongoing ingestion service. Straight-line distance is plainly labeled, and source coverage may be incomplete or duplicated.</p></section>
      <section><h3>How I work with AI</h3><p>Codex or in-editor AI helps with focused code tasks. ChatGPT and other general AI tools help with product decisions, architecture, larger refactors, and reviews. I export the repository with a local skill when I want broader feedback. I could automate more, but I deliberately choose what to delegate and review the result myself.</p></section>
    </div>
    <div className="decision-foot">
      <p>Built by <strong>Jason Pollard</strong> · <a href="https://jasonpollard.com" target="_blank" rel="noreferrer">Personal site</a> · <a href="https://arcadeghost.org" target="_blank" rel="noreferrer">Arcade Ghost</a> · <a href="https://github.com/jpollard-github/could-i-live-here" target="_blank" rel="noreferrer">Source code</a></p>
      <button type="button" className="decision-done" onClick={() => ref.current?.close()}>Back to exploring</button>
    </div>
  </dialog>;
}
