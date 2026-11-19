"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const STEPS = [
  {
    target: "intro",
    kicker: "THE REASON",
    title: "A move. An everyday question.",
    copy: "Imagine you're considering a move from Kernersville to Lexington. What everyday places would you gain or lose? Compare your current neighborhood with possible new ones, using real mapped places.",
  },
  {
    target: "anchors",
    kicker: "01 · THE TWO PINS",
    title: "A is now. B is maybe.",
    copy: "A is your current-area reference in Kernersville. B is a possible area in Lexington. Select either card to see it on the map; both stay in the comparison below.",
  },
  {
    target: "sample",
    kicker: "02 · FIND YOUR SPOT",
    title: "Start with a sample area.",
    copy: "Choose a sample area to move the pin and recenter the map. Or click empty map space to choose your own spot. These are examples, not home listings.",
  },
  {
    target: "essentials",
    kicker: "03 · WHAT MATTERS",
    title: "You choose the essentials.",
    copy: "Nothing starts selected. Turn on groceries, parks, restaurants, or whichever everyday places matter to you. The colors match their dots and result lists.",
  },
  {
    target: "radius",
    kicker: "04 · THE RADIUS",
    title: "How far is nearby?",
    copy: "Start with a half-mile radius or choose a larger one. The dashed circle is a straight-line distance from the pin, not a walking or driving route.",
  },
  {
    target: "map",
    kicker: "05 · ON THE GROUND",
    title: "Read the map, not a score.",
    copy: "Hover over colored dots for names; click one to inspect it. Drag A or B to try a different location. Place listings may be incomplete or out of date.",
  },
  {
    target: "comparison",
    kicker: "06 · THE COMPARISON",
    title: "Now decide for yourself.",
    copy: "Both locations appear below the map once you choose a category. Browse every mapped place, compare distances, and decide which tradeoffs matter. No invented livability score.",
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
    // Tour navigation jumps to the next section; the global smooth-scroll style must not take over.
    node?.scrollIntoView({ behavior: "instant", block: "center" });
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
