"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const STEPS = [
  {
    target: "intro",
    kicker: "THE REASON",
    title: "A real move. A useful question.",
    copy: "Jason is moving to Lexington, and could use some help figuring out exactly where. He wants to see what he currently has available in Kernersville and what the possibilities are in Lexington.",
  },
  {
    target: "anchors",
    kicker: "01 · THE TWO PINS",
    title: "A is now. B is maybe.",
    copy: "A represents the neighborhood around where Jason lives today. B is a possible new area in Lexington. Select either card to see that location on the map.",
  },
  {
    target: "sample",
    kicker: "02 · FIND YOUR SPOT",
    title: "Start with a sample area.",
    copy: "Switch between Lexington sample areas or click an empty spot on the map to place the pin. Changing a sample area recenters the map and its circle.",
  },
  {
    target: "essentials",
    kicker: "03 · WHAT MATTERS",
    title: "You choose the essentials.",
    copy: "Nothing is preselected. Turn on groceries, parks, restaurants, or whichever places matter to you. Change the radius if half a mile feels too small.",
  },
  {
    target: "map",
    kicker: "04 · ON THE GROUND",
    title: "Read the map, not a score.",
    copy: "The dashed circle shows straight-line distance. Hover over colored dots for names; click one to inspect it. Drag A or B to try a different location.",
  },
  {
    target: "comparison",
    kicker: "05 · THE COMPARISON",
    title: "Now decide for yourself.",
    copy: "Both locations appear below the map once you choose a category. Browse every mapped place, compare their distances, and decide which tradeoffs matter. No invented livability score.",
  },
] as const;

type Rect = Pick<DOMRect, "top" | "left" | "width" | "height" | "bottom" | "right">;

export function Walkthrough({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<Rect | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const priorFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    priorFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Unmounting also resets the story to step one on every replay.
    return () => priorFocus.current?.focus();
  }, []);

  useEffect(() => {
    const node = document.querySelector(`[data-walkthrough="${STEPS[step].target}"]`);
    const measure = () => {
      if (!node) return setTarget(null);
      const box = node.getBoundingClientRect();
      setTarget({ top: box.top, left: box.left, width: box.width, height: box.height, bottom: box.bottom, right: box.right });
    };
    node?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const animation = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab" || !panelRef.current) return;
      const controls = [...panelRef.current.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [step, onClose]);

  const margin = 16;
  const panelWidth = Math.min(395, windowWidth() - 2 * margin);
  const panelHeight = 275; // Used only for placement; content height is naturally sized.
  let left = margin;
  let top = Math.max(margin, windowHeight() - panelHeight - margin);
  if (target && windowWidth() > 700) {
    if (target.right + panelWidth + 26 < windowWidth()) {
      left = target.right + 16;
      top = Math.max(margin, Math.min(target.top, windowHeight() - panelHeight - margin));
    } else if (target.left > panelWidth + 26) {
      left = target.left - panelWidth - 16;
      top = Math.max(margin, Math.min(target.top, windowHeight() - panelHeight - margin));
    } else {
      left = Math.max(margin, Math.min(target.left, windowWidth() - panelWidth - margin));
      top = target.bottom + panelHeight + 26 < windowHeight() ? target.bottom + 16 : Math.max(margin, target.top - panelHeight - 16);
    }
  }
  const panelStyle: CSSProperties = { left, top, width: panelWidth };
  const spotlightStyle: CSSProperties | undefined = target ? {
    top: Math.max(0, target.top - 7), left: Math.max(0, target.left - 7),
    width: Math.min(windowWidth(), target.width + 14), height: Math.max(0, target.height + 14),
  } : undefined;

  return <div className="tour-layer">
    <button type="button" tabIndex={-1} aria-label="Dismiss walkthrough" className="tour-dismiss-area" onClick={onClose} />
    {target && <div className="tour-spotlight" style={spotlightStyle} aria-hidden="true" />}
    <section className="tour-panel" style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-copy" ref={panelRef}>
      <div className="tour-topline"><span>{STEPS[step].kicker}</span><button type="button" onClick={onClose} className="tour-close" aria-label="Close walkthrough">×</button></div>
      <h2 id="tour-title">{STEPS[step].title}</h2>
      <p id="tour-copy">{STEPS[step].copy}</p>
      <div className="tour-bottom">
        <div className="tour-progress"><span className="tour-count">{step + 1} of {STEPS.length}</span><button type="button" className="tour-skip" onClick={onClose}>Skip tour</button></div>
        <div className="tour-actions">
          {step > 0 && <button type="button" className="tour-back" onClick={() => setStep(step - 1)}>Back</button>}
          <button type="button" className="tour-next" onClick={() => step === STEPS.length - 1 ? onClose() : setStep(step + 1)}>{step === STEPS.length - 1 ? "Explore the map" : "Next →"}</button>
        </div>
      </div>
    </section>
  </div>;
}

function windowWidth(): number { return typeof window === "undefined" ? 1024 : window.innerWidth; }
function windowHeight(): number { return typeof window === "undefined" ? 768 : window.innerHeight; }
