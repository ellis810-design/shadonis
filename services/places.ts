/**
 * Place autocomplete + place-details for the welcome form.
 *
 * Resolution order:
 *   1. Google Places (New) — if `EXPO_PUBLIC_GOOGLE_PLACES_KEY` is set
 *   2. OpenStreetMap Nominatim — free, no key, worldwide coverage
 *   3. Local mock cities — last-resort fallback
 *
 * Nominatim's TOS asks for a User-Agent and a max 1 req/sec. We debounce in
 * the input component, and the focus-group volume is well within their
 * acceptable use bounds.
 */

import { searchCities, getCityTimezone } from "./geocoding";

export interface PlaceSuggestion {
  id: string;
  primaryText: string;
  secondaryText: string;
  /** Optional pre-resolved coordinates (mock + Nominatim paths). */
  preResolved?: ResolvedPlace;
}

export interface ResolvedPlace {
  fullName: string;
  shortName: string;
  lat: number;
  lng: number;
  timezone: string;
  countryCode: string;
}

const KEY =
  (typeof process !== "undefined" &&
    (process.env?.EXPO_PUBLIC_GOOGLE_PLACES_KEY ||
      process.env?.NEXT_PUBLIC_GOOGLE_PLACES_KEY)) ||
  "";

const GOOGLE_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_DETAILS_URL = (id: string) =>
  `https://places.googleapis.com/v1/places/${id}`;

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export function isPlacesConfigured(): boolean {
  // Always true now — Nominatim works without a key.
  return true;
}

export function placesProviderLabel(): "google" | "nominatim" {
  return KEY ? "google" : "nominatim";
}

/* ----------------------- Public API ----------------------- */

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 2) return [];

  if (KEY) {
    try {
      const g = await searchGoogle(query);
      if (g.length > 0) return g;
    } catch {
      // fall through to Nominatim
    }
  }

  try {
    const n = await searchNominatim(query);
    if (n.length > 0) return n;
  } catch {
    // fall through to mocks
  }

  return mockSuggestions(await searchCities(query));
}

export async function resolvePlace(
  suggestion: PlaceSuggestion
): Promise<ResolvedPlace> {
  if (suggestion.preResolved) return suggestion.preResolved;

  if (suggestion.id.startsWith("google:")) {
    return resolveGoogle(suggestion);
  }
  throw new Error("Unable to resolve place — no provider matched.");
}

/* ----------------------- Google Places ----------------------- */

async function searchGoogle(query: string): Promise<PlaceSuggestion[]> {
  const res = await fetch(GOOGLE_AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
    },
    body: JSON.stringify({
      input: query,
      includedPrimaryTypes: [
        "locality",
        "administrative_area_level_3",
        "sublocality",
      ],
    }),
  });

  if (!res.ok) throw new Error(`Google ${res.status}`);
  const data = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId: string;
        structuredFormat?: {
          mainText?: { text: string };
          secondaryText?: { text: string };
        };
        text?: { text: string };
      };
    }>;
  };

  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      id: `google:${p.placeId}`,
      primaryText:
        p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

async function resolveGoogle(s: PlaceSuggestion): Promise<ResolvedPlace> {
  const placeId = s.id.replace(/^google:/, "");
  const res = await fetch(GOOGLE_DETAILS_URL(placeId), {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,location,addressComponents",
    },
  });
  if (!res.ok) throw new Error(`Google details ${res.status}`);

  const data = (await res.json()) as {
    displayName?: { text: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    addressComponents?: Array<{
      shortText?: string;
      longText?: string;
      types?: string[];
    }>;
  };

  const lat = data.location?.latitude ?? 0;
  const lng = data.location?.longitude ?? 0;
  const country = data.addressComponents?.find((c) =>
    c.types?.includes("country")
  );

  return {
    fullName: data.formattedAddress ?? s.primaryText,
    shortName: data.displayName?.text ?? s.primaryText,
    lat,
    lng,
    timezone: await getCityTimezone(lat, lng),
    countryCode: country?.shortText ?? "",
  };
}

/* ----------------------- Nominatim (OSM) ----------------------- */

interface NominatimResult {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  type?: string;
  class?: string;
}

async function searchNominatim(query: string): Promise<PlaceSuggestion[]> {
  const url =
    `${NOMINATIM_URL}` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json` +
    `&addressdetails=1` +
    `&limit=8` +
    `&accept-language=en`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);

  const data = (await res.json()) as NominatimResult[];

  return data
    .filter((r) => {
      // Keep cities, towns, villages, admin-areas — drop streets / POIs.
      const t = (r.type ?? "").toLowerCase();
      const c = (r.class ?? "").toLowerCase();
      return (
        c === "place" ||
        c === "boundary" ||
        ["city", "town", "village", "hamlet", "municipality", "administrative"].includes(t)
      );
    })
    .map((r) => {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      const cityPart =
        r.name ||
        r.address?.city ||
        r.address?.town ||
        r.address?.village ||
        r.address?.municipality ||
        r.display_name.split(",")[0]?.trim() ||
        "";
      const restParts = [
        r.address?.state,
        r.address?.country,
      ]
        .filter(Boolean)
        .join(", ");
      const countryCode = (r.address?.country_code ?? "").toUpperCase();

      const resolved: ResolvedPlace = {
        fullName: r.display_name,
        shortName: cityPart,
        lat,
        lng,
        timezone: "",
        countryCode,
      };

      return {
        id: `osm:${r.place_id}`,
        primaryText: cityPart,
        secondaryText: restParts || r.display_name,
        preResolved: resolved,
      };
    });
}

/* ----------------------- Mock fallback ----------------------- */

function mockSuggestions(
  cities: Awaited<ReturnType<typeof searchCities>>
): PlaceSuggestion[] {
  return cities.map((m, i) => ({
    id: `mock:${i}`,
    primaryText: m.name,
    secondaryText: m.fullName.replace(`${m.name}, `, ""),
    preResolved: {
      fullName: m.fullName,
      shortName: m.name,
      lat: m.lat,
      lng: m.lng,
      timezone: m.timezone,
      countryCode: m.countryCode,
    },
  }));
}

/* ----------------------- Timezone helper ----------------------- */

/**
 * Nominatim doesn't return timezone, so resolve it lazily. Callers
 * (the welcome form) await this when building the chart.
 */
export async function ensureTimezone(place: ResolvedPlace): Promise<ResolvedPlace> {
  if (place.timezone && place.timezone.length > 0) return place;
  const tz = await getCityTimezone(place.lat, place.lng);
  return { ...place, timezone: tz };
}
