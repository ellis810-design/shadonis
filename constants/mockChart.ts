/**
 * Mock natal chart used while the live astrology API is not wired up.
 * Replace with real computed data once the calculation pipeline is connected.
 */
import { Planet } from "../types";

export interface MockPlanetPosition {
  planet: Planet;
  degree: number;
  minute: number;
  sign: string;          // e.g. "leo"
  signGlyph: string;
  signAbbr: string;      // e.g. "LEO"
  retrograde?: boolean;
  house?: number;
}

export interface MockChart {
  name: string;
  birthDate: string;     // formatted display string
  birthPlace: string;
  sun: { sign: string; element: string; modality: string; rulingPlanet: string; theme: string };
  moon: { sign: string; element: string; modality: string; rulingPlanet: string; theme: string };
  rising: { sign: string; element: string; modality: string; rulingPlanet: string; theme: string };
  positions: MockPlanetPosition[];
  elementBalance: { fire: number; earth: number; air: number; water: number };
  elementSummary: string;
  dominantPlanets: { planet: Planet; aspectCount: number }[];
}

export const MOCK_CHART: MockChart = {
  name: "Star",
  birthDate: "August 9, 1995 \u00B7 14:36",
  birthPlace: "Brooklyn, New York",
  sun: {
    sign: "Leo",
    element: "fire",
    modality: "fixed",
    rulingPlanet: "Sun",
    theme: "A radiant centre of gravity \u2014 you are designed to be witnessed.",
  },
  moon: {
    sign: "Cancer",
    element: "water",
    modality: "cardinal",
    rulingPlanet: "Moon",
    theme: "An inner tide pulling you toward home, family, and felt safety.",
  },
  rising: {
    sign: "Cancer",
    element: "water",
    modality: "cardinal",
    rulingPlanet: "Moon",
    theme: "Soft on the surface, watchful underneath \u2014 the world meets you in moods.",
  },
  positions: [
    { planet: "sun",     degree: 17, minute: 36, sign: "leo",         signGlyph: "\u264C", signAbbr: "LEO" },
    { planet: "moon",    degree: 19, minute: 56, sign: "cancer",      signGlyph: "\u264B", signAbbr: "CAN" },
    { planet: "mercury", degree: 24, minute: 51, sign: "leo",         signGlyph: "\u264C", signAbbr: "LEO" },
    { planet: "venus",   degree:  3, minute: 12, sign: "virgo",       signGlyph: "\u264D", signAbbr: "VIR" },
    { planet: "mars",    degree: 28, minute:  4, sign: "leo",         signGlyph: "\u264C", signAbbr: "LEO" },
    { planet: "jupiter", degree:  9, minute: 17, sign: "sagittarius", signGlyph: "\u2650", signAbbr: "SAG", retrograde: true },
    { planet: "saturn",  degree: 14, minute: 45, sign: "pisces",      signGlyph: "\u2653", signAbbr: "PIS" },
    { planet: "uranus",  degree: 29, minute:  2, sign: "capricorn",   signGlyph: "\u2651", signAbbr: "CAP", retrograde: true },
    { planet: "neptune", degree: 23, minute: 55, sign: "capricorn",   signGlyph: "\u2651", signAbbr: "CAP", retrograde: true },
    { planet: "pluto",   degree: 28, minute: 41, sign: "scorpio",     signGlyph: "\u264F", signAbbr: "SCO", retrograde: true },
  ],
  elementBalance: { fire: 38, earth: 18, air: 12, water: 32 },
  elementSummary:
    "Heavy fire and water \u2014 a chart of feeling and force. Earth and air are the muscles you have to consciously train.",
  dominantPlanets: [
    { planet: "sun",     aspectCount: 9 },
    { planet: "moon",    aspectCount: 8 },
    { planet: "venus",   aspectCount: 7 },
    { planet: "mars",    aspectCount: 6 },
    { planet: "saturn",  aspectCount: 5 },
  ],
};

export const LIFE_GOALS = [
  { id: "career",     label: "Career & Legacy",        planets: ["sun", "saturn", "jupiter"] as Planet[] },
  { id: "home",       label: "Home & Roots",           planets: ["moon", "saturn"] as Planet[] },
  { id: "love",       label: "Love & Partnership",     planets: ["venus", "moon"] as Planet[] },
  { id: "magnetism",  label: "Magnetism & Visibility", planets: ["sun", "venus", "jupiter"] as Planet[] },
  { id: "spirit",     label: "Spiritual Growth",       planets: ["neptune", "jupiter", "moon"] as Planet[] },
  { id: "freedom",    label: "Freedom & Adventure",    planets: ["jupiter", "uranus", "mars"] as Planet[] },
  { id: "healing",    label: "Healing & Reset",        planets: ["moon", "neptune", "saturn"] as Planet[] },
  { id: "education",  label: "Education & Ideas",      planets: ["mercury", "jupiter", "uranus"] as Planet[] },
];
