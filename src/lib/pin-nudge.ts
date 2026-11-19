import type { Coordinate } from "./types.ts";

export type Direction = "north" | "south" | "east" | "west";

/** Move a pin by a chosen ground distance without requiring a pointing device. */
export function nudgePin(start: Coordinate, direction: Direction, miles: number): Coordinate {
  if (!Number.isFinite(miles) || miles <= 0) throw new RangeError("Invalid pin step");
  const rad = Math.PI / 180;
  const phi = start.lat * rad;
  const lambda = start.lng * rad;
  const bearing = ({ north: 0, east: 90, south: 180, west: 270 } as const)[direction] * rad;
  const distance = miles / 3958.7613;
  const nextPhi = Math.asin(Math.sin(phi) * Math.cos(distance) + Math.cos(phi) * Math.sin(distance) * Math.cos(bearing));
  const nextLambda = lambda + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(phi), Math.cos(distance) - Math.sin(phi) * Math.sin(nextPhi));
  return { lat: nextPhi / rad, lng: nextLambda / rad };
}
