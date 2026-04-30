import { create } from "zustand";
import { PlanetaryLine, Planet, Angle } from "../types";

interface MapState {
  planetaryLines: PlanetaryLine[];
  selectedLine: PlanetaryLine | null;
  visiblePlanets: Set<Planet>;
  visibleAngles: Set<Angle>;
  searchedCity: { name: string; lat: number; lng: number } | null;
  isLoadingLines: boolean;

  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };

  setPlanetaryLines: (lines: PlanetaryLine[]) => void;
  setSelectedLine: (line: PlanetaryLine | null) => void;
  togglePlanet: (planet: Planet) => void;
  toggleAngle: (angle: Angle) => void;
  setSearchedCity: (city: { name: string; lat: number; lng: number } | null) => void;
  setRegion: (region: MapState["region"]) => void;
  setLoadingLines: (loading: boolean) => void;
  getFilteredLines: () => PlanetaryLine[];
}

const ALL_PLANETS: Planet[] = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
];
const ALL_ANGLES: Angle[] = ["asc", "dsc", "mc", "ic"];

export const useMapStore = create<MapState>((set, get) => ({
  planetaryLines: [],
  selectedLine: null,
  // Lines hidden by default. They populate as the user checks Life Goals
  // on the map page; an empty visiblePlanets set means no lines drawn.
  visiblePlanets: new Set<Planet>(),
  visibleAngles: new Set(ALL_ANGLES),
  searchedCity: null,
  isLoadingLines: false,

  region: {
    latitude: 20,
    longitude: 0,
    latitudeDelta: 120,
    longitudeDelta: 120,
  },

  setPlanetaryLines: (planetaryLines) => set({ planetaryLines }),
  setSelectedLine: (selectedLine) => set({ selectedLine }),

  togglePlanet: (planet) =>
    set((state) => {
      const next = new Set(state.visiblePlanets);
      if (next.has(planet)) next.delete(planet);
      else next.add(planet);
      return { visiblePlanets: next };
    }),

  toggleAngle: (angle) =>
    set((state) => {
      const next = new Set(state.visibleAngles);
      if (next.has(angle)) next.delete(angle);
      else next.add(angle);
      return { visibleAngles: next };
    }),

  setSearchedCity: (searchedCity) => set({ searchedCity }),
  setRegion: (region) => set({ region }),
  setLoadingLines: (isLoadingLines) => set({ isLoadingLines }),

  getFilteredLines: () => {
    const state = get();
    return state.planetaryLines.filter(
      (line) =>
        state.visiblePlanets.has(line.planet) &&
        state.visibleAngles.has(line.angle)
    );
  },
}));
