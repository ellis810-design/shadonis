import { CityResult } from "../types";

const MOCK_CITIES: CityResult[] = [
  { name: "New York", fullName: "New York, NY, USA", lat: 40.7128, lng: -74.006, timezone: "America/New_York", countryCode: "US" },
  { name: "Los Angeles", fullName: "Los Angeles, CA, USA", lat: 34.0522, lng: -118.2437, timezone: "America/Los_Angeles", countryCode: "US" },
  { name: "London", fullName: "London, England, UK", lat: 51.5074, lng: -0.1278, timezone: "Europe/London", countryCode: "GB" },
  { name: "Paris", fullName: "Paris, France", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris", countryCode: "FR" },
  { name: "Tokyo", fullName: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo", countryCode: "JP" },
  { name: "Sydney", fullName: "Sydney, NSW, Australia", lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney", countryCode: "AU" },
  { name: "Berlin", fullName: "Berlin, Germany", lat: 52.52, lng: 13.405, timezone: "Europe/Berlin", countryCode: "DE" },
  { name: "São Paulo", fullName: "São Paulo, Brazil", lat: -23.5505, lng: -46.6333, timezone: "America/Sao_Paulo", countryCode: "BR" },
  { name: "Mumbai", fullName: "Mumbai, Maharashtra, India", lat: 19.076, lng: 72.8777, timezone: "Asia/Kolkata", countryCode: "IN" },
  { name: "Cairo", fullName: "Cairo, Egypt", lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo", countryCode: "EG" },
  { name: "Dubai", fullName: "Dubai, UAE", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai", countryCode: "AE" },
  { name: "Toronto", fullName: "Toronto, ON, Canada", lat: 43.6532, lng: -79.3832, timezone: "America/Toronto", countryCode: "CA" },
  { name: "Mexico City", fullName: "Mexico City, Mexico", lat: 19.4326, lng: -99.1332, timezone: "America/Mexico_City", countryCode: "MX" },
  { name: "Bangkok", fullName: "Bangkok, Thailand", lat: 13.7563, lng: 100.5018, timezone: "Asia/Bangkok", countryCode: "TH" },
  { name: "Buenos Aires", fullName: "Buenos Aires, Argentina", lat: -34.6037, lng: -58.3816, timezone: "America/Argentina/Buenos_Aires", countryCode: "AR" },
  { name: "Rome", fullName: "Rome, Italy", lat: 41.9028, lng: 12.4964, timezone: "Europe/Rome", countryCode: "IT" },
  { name: "Barcelona", fullName: "Barcelona, Spain", lat: 41.3874, lng: 2.1686, timezone: "Europe/Madrid", countryCode: "ES" },
  { name: "Amsterdam", fullName: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041, timezone: "Europe/Amsterdam", countryCode: "NL" },
  { name: "San Francisco", fullName: "San Francisco, CA, USA", lat: 37.7749, lng: -122.4194, timezone: "America/Los_Angeles", countryCode: "US" },
  { name: "Chicago", fullName: "Chicago, IL, USA", lat: 41.8781, lng: -87.6298, timezone: "America/Chicago", countryCode: "US" },
  { name: "Miami", fullName: "Miami, FL, USA", lat: 25.7617, lng: -80.1918, timezone: "America/New_York", countryCode: "US" },
  { name: "Seattle", fullName: "Seattle, WA, USA", lat: 47.6062, lng: -122.3321, timezone: "America/Los_Angeles", countryCode: "US" },
  { name: "Denver", fullName: "Denver, CO, USA", lat: 39.7392, lng: -104.9903, timezone: "America/Denver", countryCode: "US" },
  { name: "Nashville", fullName: "Nashville, TN, USA", lat: 36.1627, lng: -86.7816, timezone: "America/Chicago", countryCode: "US" },
  { name: "Austin", fullName: "Austin, TX, USA", lat: 30.2672, lng: -97.7431, timezone: "America/Chicago", countryCode: "US" },
];

export async function searchCities(query: string): Promise<CityResult[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  return MOCK_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(lowerQuery) ||
      city.fullName.toLowerCase().includes(lowerQuery)
  ).slice(0, 8);
}

export async function getCityTimezone(lat: number, lng: number): Promise<string> {
  const nearest = MOCK_CITIES.reduce((closest, city) => {
    const dist = Math.sqrt(
      Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
    );
    const closestDist = Math.sqrt(
      Math.pow(closest.lat - lat, 2) + Math.pow(closest.lng - lng, 2)
    );
    return dist < closestDist ? city : closest;
  });
  return nearest.timezone;
}
