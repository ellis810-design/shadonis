export interface UserProfile {
  id: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthCity: string;
  birthCountryCode: string;
  birthLat: number;
  birthLng: number;
  birthTimezone: string;
  subscriptionTier: "free" | "premium";
  createdAt: string;
  updatedAt: string;
}

export interface PlanetaryLine {
  planet: Planet;
  angle: Angle;
  coordinates: Array<{ lat: number; lng: number }>;
  color: string;
}

export interface NatalChartSummary {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  shortSummary: string;
}

// API types matching astrology-api.io response shape
export type ApiPlanetName =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars"
  | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";

export type ApiLineType = "AC" | "DS" | "MC" | "IC";

/** API may return DS or DC for descendant. */
export type ApiLineTypeRaw = ApiLineType | "DC";

export interface ApiAstrocartographyLine {
  planet: ApiPlanetName | string;
  line_type?: ApiLineTypeRaw;
  angle?: ApiLineTypeRaw;
  points?: Array<{ latitude?: number; longitude?: number; lat?: number; lng?: number; lon?: number }>;
}

export interface ApiAstrocartographyResponse {
  success: boolean;
  lines: ApiAstrocartographyLine[];
}

export interface Interpretation {
  id: string;
  planet: Planet;
  angle: Angle;
  whatItFeelsLike: string;
  bestUseCases: string;
  watchOuts: string;
  shortTheme: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  userId: string;
  feelsAccurate: boolean | null;
  comment: string | null;
  screenContext: string;
  createdAt: string;
}

export interface UsageEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, unknown> | null;
  createdAt: string;
}

export interface CityResult {
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  timezone: string;
  countryCode: string;
}

/** Reference city marker for the 3D astrocartography globe. */
export interface GlobeCity {
  name: string;
  lat: number;
  lng: number;
  tier: 1 | 2 | 3;
}

export type Planet =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export type Angle = "asc" | "dsc" | "mc" | "ic";

export interface PlanetMeta {
  name: string;
  displayName: string;
  glyph: string;
  color: string;
  description: string;
}

export interface OnboardingData {
  birthDate: Date | null;
  birthTime: Date | null;
  birthTimeUnknown: boolean;
  birthCity: string;
  birthCountryCode: string;
  birthLat: number | null;
  birthLng: number | null;
  birthTimezone: string;
}
