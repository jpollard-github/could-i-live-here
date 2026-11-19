"use client";

import { useEffect, useRef } from "react";
import type { Direction } from "@/lib/pin-nudge";
import type { Coordinate } from "@/lib/types";

const MOVES: { direction: Direction; label: string; symbol: string }[] = [
  { direction: "west", label: "Move west", symbol: "←" },
  { direction: "north", label: "Move north", symbol: "↑" },
  { direction: "south", label: "Move south", symbol: "↓" },
  { direction: "east", label: "Move east", symbol: "→" },
];

export function KeyboardHelp({ open, onClose, side, anchor, notice, onMove }: {
  open: boolean; onClose: () => void; side: "A" | "B"; anchor: Coordinate; notice: string | null;
  onMove: (direction: Direction, miles: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={ref} className="decision-dialog keyboard-dialog" aria-labelledby="keyboard-title"
    onClose={onClose}
    onKeyDown={(event) => {
      const direction = ({ ArrowUp: "north", ArrowDown: "south", ArrowLeft: "west", ArrowRight: "east" } as Record<string, Direction>)[event.key];
      if (direction) {
        event.preventDefault();
        event.stopPropagation();
        onMove(direction, event.shiftKey ? 0.01 : 0.1);
      }
    }}
  >
    <div className="decision-head"><span className="eyebrow">NO MOUSE REQUIRED</span>
      <button type="button" className="decision-close" onClick={() => ref.current?.close()} aria-label="Close keyboard help">×</button>
    </div>
    <h2 id="keyboard-title">Place your {side} pin.</h2>
    <p className="decision-lead">Use the arrow keys to move {side} in 0.1-mile steps. Hold Shift for smaller 0.01-mile steps. Or use the buttons below. Escape closes this help.</p>
    <div className="keyboard-arrows" role="group" aria-label={`Move location ${side}`}>
      {MOVES.map((move) => <button type="button" key={move.direction} aria-label={`${move.label} 0.1 mile`}
        onClick={() => onMove(move.direction, 0.1)}>{move.symbol}<span>{move.direction}</span></button>)}
    </div>
    <p className="keyboard-coordinates" role="status">{side}: {anchor.lat.toFixed(5)}° N, {Math.abs(anchor.lng).toFixed(5)}° W</p>
    {notice && <p className="coverage-note" role="alert">{notice}</p>}
    <p className="keyboard-footnote">The pin stays inside the downloaded area. If it reaches the edge, you’ll get a message. The circle and comparison update with each move.</p>
    <button type="button" className="decision-done" onClick={() => ref.current?.close()}>Done</button>
  </dialog>;
}
