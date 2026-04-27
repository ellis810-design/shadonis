import {
  PlanetaryLine,
  NatalChartSummary,
  Planet,
  Angle,
  ApiPlanetName,
  ApiLineType,
  ApiAstrocartographyResponse,
} from "../types";
import { PLANETS } from "../constants/planets";

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

// Natal chart summary — kept as mock until a birth chart API endpoint is available
export async function getNatalSummary(
  _birthDate: Date,
  _birthTime: Date | null,
  _birthLat: number,
  _birthLng: number
): Promise<NatalChartSummary> {
  return {
    sunSign: "Aries",
    moonSign: "Cancer",
    risingSign: "Libra",
    shortSummary:
      "A fiery trailblazer with a tender emotional core and a natural gift for balancing opposites. You lead with courage but feel deeply.",
  };
}
