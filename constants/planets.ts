import { PlanetMeta, Planet } from "../types";

export const PLANETS: Record<Planet, PlanetMeta> = {
  sun: {
    name: "sun",
    displayName: "Sun",
    glyph: "☉",
    color: "#FFD700",
    description: "Identity, vitality, and core self-expression",
  },
  moon: {
    name: "moon",
    displayName: "Moon",
    glyph: "☽",
    color: "#C0C0C0",
    description: "Emotions, comfort, and intuitive nature",
  },
  mercury: {
    name: "mercury",
    displayName: "Mercury",
    glyph: "☿",
    color: "#87CEEB",
    description: "Communication, intellect, and mental agility",
  },
  venus: {
    name: "venus",
    displayName: "Venus",
    glyph: "♀",
    color: "#FF69B4",
    description: "Love, beauty, and attraction",
  },
  mars: {
    name: "mars",
    displayName: "Mars",
    glyph: "♂",
    color: "#FF4444",
    description: "Drive, ambition, and physical energy",
  },
  jupiter: {
    name: "jupiter",
    displayName: "Jupiter",
    glyph: "♃",
    color: "#FFA500",
    description: "Growth, expansion, and good fortune",
  },
  saturn: {
    name: "saturn",
    displayName: "Saturn",
    glyph: "♄",
    color: "#8B7355",
    description: "Structure, discipline, and life lessons",
  },
  uranus: {
    name: "uranus",
    displayName: "Uranus",
    glyph: "♅",
    color: "#00CED1",
    description: "Innovation, rebellion, and sudden change",
  },
  neptune: {
    name: "neptune",
    displayName: "Neptune",
    glyph: "♆",
    color: "#9370DB",
    description: "Dreams, spirituality, and transcendence",
  },
  pluto: {
    name: "pluto",
    displayName: "Pluto",
    glyph: "♇",
    color: "#800020",
    description: "Transformation, power, and rebirth",
  },
};

export const ANGLES = {
  asc: { name: "asc", displayName: "Ascendant (ASC)", description: "How others perceive you in this location" },
  dsc: { name: "dsc", displayName: "Descendant (DSC)", description: "Relationships and partnerships here" },
  mc: { name: "mc", displayName: "Midheaven (MC)", description: "Career and public reputation" },
  ic: { name: "ic", displayName: "Imum Coeli (IC)", description: "Home, roots, and inner foundations" },
} as const;
