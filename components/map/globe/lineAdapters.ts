import type { Angle, PlanetaryLine } from "../../../types";
import type { GlobeLineSegment } from "./types";

const STEPS_BETWEEN_POINTS = 12;

export function lineStyleForAngle(angle: Angle): "solid" | "dashed" {
  return angle === "mc" || angle === "ic" ? "solid" : "dashed";
}

export function hexColorStringToNumber(hex: string): number {
  const h = hex.replace("#", "").trim();
  const six = h.length >= 6 ? h.slice(0, 6) : h;
  return parseInt(six, 16) || 0xffffff;
}

export function interpolateLatLngPath(
  coords: Array<{ lat: number; lng: number }>,
  stepsBetween: number = STEPS_BETWEEN_POINTS
): [number, number][] {
  if (coords.length < 2) {
    return coords.map((c) => [c.lat, c.lng]);
  }
  const out: [number, number][] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    for (let s = 0; s <= stepsBetween; s++) {
      const t = s / stepsBetween;
      out.push([
        a.lat + (b.lat - a.lat) * t,
        a.lng + (b.lng - a.lng) * t,
      ]);
    }
    if (i < coords.length - 2) {
      out.pop();
    }
  }
  return out;
}

/** Build drawable segments from API lines (one mesh per segment). */
export function planetaryLinesToGlobeSegments(lines: PlanetaryLine[]): GlobeLineSegment[] {
  return lines.map((planetaryLine) => {
    const coords = interpolateLatLngPath(planetaryLine.coordinates);
    return {
      coords,
      color: hexColorStringToNumber(planetaryLine.color),
      style: lineStyleForAngle(planetaryLine.angle),
      planetaryLine,
    };
  });
}

export function samePlanetarySegment(a: PlanetaryLine | null, b: PlanetaryLine): boolean {
  if (!a) return false;
  if (a.planet !== b.planet || a.angle !== b.angle) return false;
  const ca = a.coordinates[0];
  const cb = b.coordinates[0];
  if (!ca || !cb) return a === b;
  return ca.lat === cb.lat && ca.lng === cb.lng;
}
