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

const API_ANGLE_TO_INTERNAL: Record<ApiLineType, Angle> = {
  AC: "asc", DS: "dsc", MC: "mc", IC: "ic",
};

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

export async function getPlanetaryLines(
  birthDate: Date,
  birthTime: Date | null,
  birthLat: number,
  birthLng: number,
  birthCity?: string,
  birthCountryCode?: string,
): Promise<PlanetaryLine[]> {
  const hour = birthTime ? birthTime.getHours() : 12;
  const minute = birthTime ? birthTime.getMinutes() : 0;

  const cityName = birthCity ? parseCityName(birthCity) : "New York";

  const body = {
    subject: {
      name: "User",
      birth_data: {
        year: birthDate.getFullYear(),
        month: birthDate.getMonth() + 1,
        day: birthDate.getDate(),
        hour,
        minute,
        second: 0,
        city: cityName,
        country_code: birthCountryCode || "US",
      },
    },
    options: {
      planets: API_PLANET_NAMES,
      line_types: API_LINE_TYPES,
      coordinate_precision: 4,
    },
    coordinate_density: 50,
    language: "en",
  };

  console.log("[Astrology] Fetching lines for", cityName, birthCountryCode);

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
    console.error("[Astrology] API error:", response.status, errorText);
    throw new Error(`Astrology API error (${response.status}): ${errorText}`);
  }

  const data: ApiAstrocartographyResponse = await response.json();

  if (!data.success || !data.lines) {
    console.error("[Astrology] Unsuccessful response:", data);
    throw new Error("Astrology API returned unsuccessful response");
  }

  console.log(`[Astrology] Received ${data.lines.length} raw lines from API`);

  const result: PlanetaryLine[] = [];

  for (const line of data.lines) {
    const planet = API_PLANET_TO_INTERNAL[line.planet];
    if (!planet) continue;

    const angle = API_ANGLE_TO_INTERNAL[line.angle || line.line_type];
    if (!angle) continue;

    const segments = splitIntoSegments(line.points);

    for (const segment of segments) {
      result.push({
        planet,
        angle,
        coordinates: segment,
        color: PLANETS[planet].color,
      });
    }
  }

  console.log(`[Astrology] Processed into ${result.length} drawable line segments`);
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
