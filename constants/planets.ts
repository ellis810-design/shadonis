import { PlanetMeta, Planet } from "../types";
import { PLANET_COLORS } from "./designSystem";

export const PLANETS: Record<Planet, PlanetMeta> = {
  sun: {
    name: "sun",
    displayName: "Sun",
    glyph: "\u2609",
    color: PLANET_COLORS.sun,
    description: "Identity, vitality, and core self-expression",
  },
  moon: {
    name: "moon",
    displayName: "Moon",
    glyph: "\u263D",
    color: PLANET_COLORS.moon,
    description: "Emotions, comfort, and intuitive nature",
  },
  mercury: {
    name: "mercury",
    displayName: "Mercury",
    glyph: "\u263F",
    color: PLANET_COLORS.mercury,
    description: "Communication, intellect, and mental agility",
  },
  venus: {
    name: "venus",
    displayName: "Venus",
    glyph: "\u2640",
    color: PLANET_COLORS.venus,
    description: "Love, beauty, and what you draw toward you",
  },
  mars: {
    name: "mars",
    displayName: "Mars",
    glyph: "\u2642",
    color: PLANET_COLORS.mars,
    description: "Drive, ambition, and physical energy",
  },
  jupiter: {
    name: "jupiter",
    displayName: "Jupiter",
    glyph: "\u2643",
    color: PLANET_COLORS.jupiter,
    description: "Growth, expansion, and good fortune",
  },
  saturn: {
    name: "saturn",
    displayName: "Saturn",
    glyph: "\u2644",
    color: PLANET_COLORS.saturn,
    description: "Structure, discipline, and the long arc",
  },
  uranus: {
    name: "uranus",
    displayName: "Uranus",
    glyph: "\u2645",
    color: PLANET_COLORS.uranus,
    description: "Innovation, rupture, and sudden clarity",
  },
  neptune: {
    name: "neptune",
    displayName: "Neptune",
    glyph: "\u2646",
    color: PLANET_COLORS.neptune,
    description: "Dreams, spirit, and the soft edge of things",
  },
  pluto: {
    name: "pluto",
    displayName: "Pluto",
    glyph: "\u2647",
    color: PLANET_COLORS.pluto,
    description: "Transformation, depth, and rebirth",
  },
};

export const ANGLES = {
  asc: { name: "asc", displayName: "Ascendant (ASC)", description: "How others perceive you in this location" },
  dsc: { name: "dsc", displayName: "Descendant (DSC)", description: "Relationships and partnerships here" },
  mc: { name: "mc", displayName: "Midheaven (MC)", description: "Career and public reputation" },
  ic: { name: "ic", displayName: "Imum Coeli (IC)", description: "Home, roots, and inner foundations" },
} as const;

export const SIGN_GLYPHS: Record<string, string> = {
  aries: "\u2648",
  taurus: "\u2649",
  gemini: "\u264A",
  cancer: "\u264B",
  leo: "\u264C",
  virgo: "\u264D",
  libra: "\u264E",
  scorpio: "\u264F",
  sagittarius: "\u2650",
  capricorn: "\u2651",
  aquarius: "\u2652",
  pisces: "\u2653",
};
