import type { PlanetaryLine } from "../../../types";

export type { GlobeCity } from "../../../types";

/** Drawable segment for Three.js (from API `PlanetaryLine` rows). */
export interface GlobeLineSegment {
  coords: [number, number][];
  color: number;
  style: "solid" | "dashed";
  planetaryLine: PlanetaryLine;
}
