import {
  PlanetaryLine,
  NatalChartSummary,
  Planet,
  Angle,
  ApiPlanetName,
  ApiLineType,
  ApiAstrocartographyResponse,
} from "../types";
import { PLANETS, SIGN_GLYPHS } from "../constants/planets";

const API_BASE = "https://api.astrology-api.io/api/v3";
const API_KEY = process.env.EXPO_PUBLIC_ASTROLOGY_API_KEY || "";

const API_PLANET_NAMES: ApiPlanetName[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

const API_LINE_TYPES: ApiLineType[] = ["AC", "MC", "DS", "IC"];

const API_PLANET_TO_INTERNAL: Record<ApiPlanetName, Planet> = {
  Sun: "sun", Moon: "moon", Mercury: "mercury", Venus: "venus", Mars: "mars",
  Jupiter: "jupiter", Saturn: "saturn", Uranus: "uranus", Neptune: "neptune", Pluto: "pluto",
};

const API_ANGLE_TO_INTERNAL: Record<string, Angle> = {
  AC: "asc",
  DS: "dsc",
  DC: "dsc",
  MC: "mc",
  IC: "ic",
};

const ALL_PLANETS: Planet[] = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
];

function normalizeApiPoint(p: {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  lon?: number;
}): { latitude: number; longitude: number } | null {
  const lat = p.latitude ?? p.lat;
  const longitude = p.longitude ?? p.lng ?? p.lon;
  if (typeof lat !== "number" || typeof longitude !== "number" || Number.isNaN(lat) || Number.isNaN(longitude)) {
    return null;
  }
  return { latitude: lat, longitude };
}

function normalizeApiLineType(raw: string | undefined): string | null {
  if (!raw) return null;
  return String(raw).toUpperCase();
}

function parseCityName(fullCityString: string): string {
  const parts = fullCityString.split(",").map((s) => s.trim());
  return parts[0] || fullCityString;
}

function normalizeLng(lng: number): number {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

function splitIntoSegments(
  points: Array<{ latitude: number; longitude: number }>
): Array<Array<{ lat: number; lng: number }>> {
  if (points.length === 0) return [];

  const normalized = points.map((p) => ({
    lat: p.latitude,
    lng: normalizeLng(p.longitude),
  }));

  const segments: Array<Array<{ lat: number; lng: number }>> = [];
  let current: Array<{ lat: number; lng: number }> = [normalized[0]];

  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1];
    const curr = normalized[i];

    const latJump = Math.abs(curr.lat - prev.lat);
    const lngJump = Math.abs(curr.lng - prev.lng);

    if (lngJump > 90 || latJump > 30) {
      if (current.length >= 2) segments.push(current);
      current = [curr];
    } else {
      current.push(curr);
    }
  }
  if (current.length >= 2) segments.push(current);

  return segments;
}

/* ------------------------------------------------------------------ */
/* Mock generator — used when no API key, or when the live API fails. */
/* ------------------------------------------------------------------ */

const PLANET_PHASE: Record<Planet, number> = {
  sun: 0, moon: 0.6, mercury: 1.2, venus: 1.8, mars: 2.4,
  jupiter: 3.0, saturn: 3.6, uranus: 4.2, neptune: 4.8, pluto: 5.4,
};

function planetBaseLng(planet: Planet, birthDate: Date): number {
  // Stable but birthday-dependent longitude offset per planet.
  const dayOfYear =
    (birthDate.getMonth() * 30 + birthDate.getDate()) % 360;
  const phaseDeg = (PLANET_PHASE[planet] * 30) % 360;
  return normalizeLng(dayOfYear + phaseDeg - 180);
}

function makeMcLine(planet: Planet, birthDate: Date): PlanetaryLine[] {
  const lng = planetBaseLng(planet, birthDate);
  const points: Array<{ lat: number; lng: number }> = [];
  for (let lat = -82; lat <= 82; lat += 2) points.push({ lat, lng });
  return [
    {
      planet,
      angle: "mc",
      coordinates: points,
      color: PLANETS[planet].color,
    },
  ];
}

function makeIcLine(planet: Planet, birthDate: Date): PlanetaryLine[] {
  const lng = normalizeLng(planetBaseLng(planet, birthDate) + 180);
  const points: Array<{ lat: number; lng: number }> = [];
  for (let lat = -82; lat <= 82; lat += 2) points.push({ lat, lng });
  return [
    {
      planet,
      angle: "ic",
      coordinates: points,
      color: PLANETS[planet].color,
    },
  ];
}

function makeAscLine(planet: Planet, birthDate: Date): PlanetaryLine[] {
  const phase = PLANET_PHASE[planet];
  const baseLng = planetBaseLng(planet, birthDate);
  const amplitude = 70 + (phase * 4) % 30;     // 70 - 100 deg amplitude
  const yShift = ((phase * 17) % 40) - 20;     // small vertical bias
  const raw: Array<{ latitude: number; longitude: number }> = [];

  for (let lat = -78; lat <= 78; lat += 2) {
    const t = (lat + yShift) * (Math.PI / 180);
    const lng =
      baseLng + 90 + amplitude * Math.sin(t + phase);
    raw.push({ latitude: lat, longitude: lng });
  }

  const segments = splitIntoSegments(raw);
  return segments
    .filter((s) => s.length >= 2)
    .map((coords) => ({
      planet,
      angle: "asc",
      coordinates: coords,
      color: PLANETS[planet].color,
    }));
}

function makeDscLine(planet: Planet, birthDate: Date): PlanetaryLine[] {
  const phase = PLANET_PHASE[planet];
  const baseLng = planetBaseLng(planet, birthDate);
  const amplitude = 70 + (phase * 4) % 30;
  const yShift = ((phase * 17) % 40) - 20;
  const raw: Array<{ latitude: number; longitude: number }> = [];

  for (let lat = -78; lat <= 78; lat += 2) {
    const t = (lat + yShift) * (Math.PI / 180);
    const lng =
      baseLng - 90 + amplitude * Math.sin(t + phase + Math.PI);
    raw.push({ latitude: lat, longitude: lng });
  }

  const segments = splitIntoSegments(raw);
  return segments
    .filter((s) => s.length >= 2)
    .map((coords) => ({
      planet,
      angle: "dsc",
      coordinates: coords,
      color: PLANETS[planet].color,
    }));
}

export function getMockPlanetaryLines(birthDate: Date): PlanetaryLine[] {
  const out: PlanetaryLine[] = [];
  for (const p of ALL_PLANETS) {
    out.push(...makeMcLine(p, birthDate));
    out.push(...makeIcLine(p, birthDate));
    out.push(...makeAscLine(p, birthDate));
    out.push(...makeDscLine(p, birthDate));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Public entry — tries the live API, falls back to mocks on failure. */
/* ------------------------------------------------------------------ */

export async function getPlanetaryLines(
  birthDate: Date,
  birthTime: Date | null,
  birthLat: number,
  birthLng: number,
  birthCity?: string,
  birthCountryCode?: string,
  birthTimezone?: string,
): Promise<PlanetaryLine[]> {
  if (!API_KEY) {
    console.info("[Astrology] No API key — using mock lines.");
    return getMockPlanetaryLines(birthDate);
  }

  try {
    const live = await fetchLiveLines(
      birthDate, birthTime, birthLat, birthLng,
      birthCity, birthCountryCode, birthTimezone,
    );
    if (live.length > 0) return live;
    console.warn("[Astrology] API returned no lines — falling back to mocks.");
    return getMockPlanetaryLines(birthDate);
  } catch (err) {
    console.warn("[Astrology] API call failed, using mock lines.", err);
    return getMockPlanetaryLines(birthDate);
  }
}

async function fetchLiveLines(
  birthDate: Date,
  birthTime: Date | null,
  birthLat: number,
  birthLng: number,
  birthCity?: string,
  birthCountryCode?: string,
  birthTimezone?: string,
): Promise<PlanetaryLine[]> {
  const hour = birthTime ? birthTime.getHours() : 12;
  const minute = birthTime ? birthTime.getMinutes() : 0;

  const cityName = birthCity ? parseCityName(birthCity) : "New York";
  const hasCoords = Number.isFinite(birthLat) && Number.isFinite(birthLng);

  const birth_data: Record<string, unknown> = {
    year: birthDate.getFullYear(),
    month: birthDate.getMonth() + 1,
    day: birthDate.getDate(),
    hour,
    minute,
    second: 0,
    city: cityName,
    country_code: birthCountryCode || "US",
  };
  if (hasCoords) {
    birth_data.latitude = birthLat;
    birth_data.longitude = birthLng;
  }
  if (birthTimezone && birthTimezone.trim().length > 0) {
    birth_data.timezone = birthTimezone.trim();
  }

  const body = {
    subject: { name: "User", birth_data },
    options: {
      planets: API_PLANET_NAMES,
      line_types: API_LINE_TYPES,
      coordinate_precision: 4,
      zodiac_type: "Tropic",
      house_system: "P",
    },
    coordinate_density: 50,
    language: "en",
  };

  const response = await fetch(`${API_BASE}/astrocartography/lines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Astrology API error (${response.status}): ${errorText}`);
  }

  const data: ApiAstrocartographyResponse = await response.json();
  if (!data.success || !data.lines) {
    throw new Error("Astrology API returned unsuccessful response");
  }

  const result: PlanetaryLine[] = [];
  for (const line of data.lines) {
    const raw = String(line.planet ?? "").trim();
    if (!raw) continue;
    const titled =
      raw.length > 1
        ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
        : raw.toUpperCase();
    const planet = API_PLANET_TO_INTERNAL[titled as ApiPlanetName];
    if (!planet) continue;

    const angleKey = normalizeApiLineType(line.angle ?? line.line_type) ?? "";
    const angle = API_ANGLE_TO_INTERNAL[angleKey];
    if (!angle) continue;

    const rawPoints = line.points ?? [];
    const points: Array<{ latitude: number; longitude: number }> = [];
    for (const rp of rawPoints) {
      const n = normalizeApiPoint(rp);
      if (n) points.push(n);
    }
    if (points.length < 2) continue;

    const segments = splitIntoSegments(points);
    for (const segment of segments) {
      result.push({
        planet,
        angle,
        coordinates: segment,
        color: PLANETS[planet].color,
      });
    }
  }
  return result;
}

// Natal chart summary — derived from the live positions endpoint.
export async function getNatalSummary(
  birthDate: Date,
  birthTime: Date | null,
  birthLat: number,
  birthLng: number,
  birthCity?: string,
  birthCountryCode?: string,
  birthTimezone?: string
): Promise<NatalChartSummary> {
  try {
    const positions = await getNatalPositions(
      birthDate, birthTime, birthLat, birthLng,
      birthCity, birthCountryCode, birthTimezone,
    );
    const sun = positions.find((p) => p.planet === "sun");
    const moon = positions.find((p) => p.planet === "moon");
    const asc = positions.find((p) => p.body === "Ascendant");
    return {
      sunSign: sun ? capitalize(sun.sign) : "—",
      moonSign: moon ? capitalize(moon.sign) : "—",
      risingSign: asc ? capitalize(asc.sign) : "—",
      shortSummary: `Sun in ${sun?.sign ?? "—"}, Moon in ${moon?.sign ?? "—"}, ${asc?.sign ?? "—"} rising.`,
    };
  } catch {
    return {
      sunSign: "—", moonSign: "—", risingSign: "—",
      shortSummary: "Natal chart could not be calculated.",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Natal positions — tropical zodiac, Swiss Ephemeris precision       */
/* ------------------------------------------------------------------ */

export interface NatalPosition {
  /** Internal planet name when this body maps to one of our planets,
      otherwise null (e.g. for Ascendant / Medium_Coeli). */
  planet: Planet | null;
  /** API body name as returned by the live endpoint
      ("Sun" | "Moon" | "Ascendant" | "Medium_Coeli" | ...). */
  body: string;
  /** Lower-case full sign name ("leo", "cancer", ...). */
  sign: string;
  signAbbr: string;          // "LEO"
  signGlyph: string;         // "♌"
  degree: number;            // 0-29 integer degree-within-sign
  minute: number;            // 0-59 integer minute-within-degree
  absoluteLongitude: number; // 0-360
  house: number;
  retrograde: boolean;
}

const ACTIVE_POSITION_POINTS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
  "Ascendant", "Medium_Coeli",
];

const SIGN_FROM_API: Record<string, { full: string; abbr: string }> = {
  Ari: { full: "aries",       abbr: "ARI" },
  Tau: { full: "taurus",      abbr: "TAU" },
  Gem: { full: "gemini",      abbr: "GEM" },
  Can: { full: "cancer",      abbr: "CAN" },
  Leo: { full: "leo",         abbr: "LEO" },
  Vir: { full: "virgo",       abbr: "VIR" },
  Lib: { full: "libra",       abbr: "LIB" },
  Sco: { full: "scorpio",     abbr: "SCO" },
  Sag: { full: "sagittarius", abbr: "SAG" },
  Cap: { full: "capricorn",   abbr: "CAP" },
  Aqu: { full: "aquarius",    abbr: "AQU" },
  Pis: { full: "pisces",      abbr: "PIS" },
};

const BODY_TO_PLANET: Record<string, Planet> = {
  Sun: "sun", Moon: "moon", Mercury: "mercury", Venus: "venus", Mars: "mars",
  Jupiter: "jupiter", Saturn: "saturn", Uranus: "uranus", Neptune: "neptune", Pluto: "pluto",
};

interface ApiPositionsResponse {
  success: boolean;
  data?: {
    positions?: Array<{
      name: string;
      sign: string;          // 3-letter ("Leo", "Aqu")
      degree: number;        // decimal 0.0 - 29.99
      absolute_longitude: number;
      house: number;
      is_retrograde: boolean;
      speed: number | null;
    }>;
  };
}

export async function getNatalPositions(
  birthDate: Date,
  birthTime: Date | null,
  birthLat: number,
  birthLng: number,
  birthCity?: string,
  birthCountryCode?: string,
  birthTimezone?: string,
): Promise<NatalPosition[]> {
  if (!API_KEY) {
    throw new Error("Astrology API key not configured");
  }

  const hour = birthTime ? birthTime.getHours() : 12;
  const minute = birthTime ? birthTime.getMinutes() : 0;
  const cityName = birthCity ? parseCityName(birthCity) : "New York";
  const hasCoords = Number.isFinite(birthLat) && Number.isFinite(birthLng);

  const birth_data: Record<string, unknown> = {
    year: birthDate.getFullYear(),
    month: birthDate.getMonth() + 1,
    day: birthDate.getDate(),
    hour, minute, second: 0,
    city: cityName,
    country_code: birthCountryCode || "US",
  };
  if (hasCoords) {
    birth_data.latitude = birthLat;
    birth_data.longitude = birthLng;
  }
  if (birthTimezone && birthTimezone.trim().length > 0) {
    birth_data.timezone = birthTimezone.trim();
  }

  const body = {
    subject: { name: "User", birth_data },
    options: {
      house_system: "P",         // Placidus
      language: "en",
      tradition: "universal",
      detail_level: "standard",
      zodiac_type: "Tropic",     // tropical zodiac
      active_points: ACTIVE_POSITION_POINTS,
      precision: 2,
    },
  };

  const res = await fetch(`${API_BASE}/data/positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Positions API error (${res.status}): ${text}`);
  }
  const data = (await res.json()) as ApiPositionsResponse;
  if (!data.success || !data.data?.positions) {
    throw new Error("Positions API returned no data");
  }

  return data.data.positions.map((p) => {
    const signMeta = SIGN_FROM_API[p.sign] ?? { full: p.sign.toLowerCase(), abbr: p.sign.toUpperCase() };
    const degInt = Math.floor(p.degree);
    const minInt = Math.round((p.degree - degInt) * 60);
    return {
      body: p.name,
      planet: BODY_TO_PLANET[p.name] ?? null,
      sign: signMeta.full,
      signAbbr: signMeta.abbr,
      signGlyph: SIGN_GLYPHS[signMeta.full] ?? "",
      degree: degInt,
      minute: Math.min(minInt, 59),
      absoluteLongitude: p.absolute_longitude,
      house: p.house,
      retrograde: p.is_retrograde,
    };
  });
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
