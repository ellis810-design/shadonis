/**
 * Legacy COLORS export — kept so existing imports keep compiling.
 * New code should import from `constants/designSystem.ts` instead.
 */
import { PALETTE } from "./designSystem";

export const COLORS = {
  background: PALETTE.background,
  globeBackground: "#000000",
  globeCardSurface: "rgba(10, 10, 10, 0.94)",
  globeCardBorder: PALETTE.surfaceBorderStrong,
  surface: PALETTE.surface,
  surfaceLight: PALETTE.backgroundAlt,
  gold: PALETTE.accent,
  goldLight: PALETTE.accentBright,
  purple: "#6B4C9A",
  purpleLight: "#8B6CBB",
  cream: PALETTE.textPrimary,
  creamMuted: PALETTE.textSecondary,
  danger: PALETTE.danger,
  success: PALETTE.success,
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
  sm: 2,
  md: 4,
  lg: 6,
  xl: 6,
  full: 9999,
} as const;

export const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0A0A0A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0A0A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5A564E" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1A1A1A" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#050505" }],
  },
  { featureType: "road", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#0A0A0A" }],
  },
];
