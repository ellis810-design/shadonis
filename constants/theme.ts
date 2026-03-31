export const COLORS = {
  background: "#0B0D17",
  surface: "#161B2E",
  surfaceLight: "#1E2540",
  gold: "#C9A84C",
  goldLight: "#E0C878",
  purple: "#6B4C9A",
  purpleLight: "#8B6CBB",
  cream: "#F5F0E8",
  creamMuted: "#B8B2A8",
  danger: "#E04B4B",
  success: "#4CAF50",
  transparent: "transparent",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  display: 40,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0B0D17" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0D17" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4A4E69" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1E2540" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0F1225" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2A2E45" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#161B2E" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#0E1020" }],
  },
];
