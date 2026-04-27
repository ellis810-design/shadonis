/**
 * Shadonis design system — single source of truth.
 *
 * Mirrors shadonis.com: deep cosmic black backgrounds, hot-pink accents,
 * cyan secondary CTA accent, neon-glow card borders, pill buttons,
 * and big classical serif typography for hero / headline moments.
 */

export const PALETTE = {
  background: "#080510",          // deep cosmic black with a violet undertone
  backgroundAlt: "#0E0918",       // slightly lifted for layered surfaces
  surface: "#120B1C",             // card / panel fills
  surfaceBorder: "rgba(255, 124, 188, 0.55)",        // pink card border
  surfaceBorderStrong: "rgba(255, 124, 188, 0.85)",  // hovered / active border

  // Hot pink — primary brand accent. Used for borders, headlines, planet icons.
  accent: "#FF7CBC",
  accentBright: "#FF5DA8",
  accentSoft: "#E8AED6",
  accentMuted: "rgba(255, 124, 188, 0.10)",

  // Cyan — secondary accent. Used exclusively for CTA pills and the logo flourish.
  cyan: "#7FE7E5",
  cyanBright: "#5AD9DD",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#E8AED6",       // dusty pink body
  textTertiary: "#8C7A92",        // muted gray-violet for hints

  divider: "rgba(255, 255, 255, 0.07)",

  // Functional
  danger: "#FF6B7C",
  success: "#7FE7E5",
} as const;

/** Pink neon glow used on cards. Apply via View style: `boxShadow` (web). */
export const GLOW = {
  pinkSoft: "0 0 18px rgba(255, 124, 188, 0.35)",
  pinkMedium: "0 0 28px rgba(255, 93, 168, 0.55)",
  cyanSoft: "0 0 16px rgba(127, 231, 229, 0.45)",
} as const;

export const PLANET_COLORS = {
  sun: "#FFD66B",
  moon: "#CFE2F3",
  mercury: "#FFB48A",
  venus: "#FFB8E0",
  mars: "#FF7B7B",
  jupiter: "#A8E0A8",
  saturn: "#C9B8E8",
  uranus: "#E8E8FF",
  neptune: "#7FE7E5",
  pluto: "#D3A8FF",
  northNode: "#FF7CBC",
  chiron: "#D8B496",
} as const;

export const ELEMENT_COLORS = {
  fire: "#FF8A6B",
  earth: "#A8E0A8",
  air: "#CFE2F3",
  water: "#7FE7E5",
} as const;

export const FONTS = {
  display: "BodoniModa_700Bold",                  // SHADONIS hero wordmark
  displayItalic: "BodoniModa_400Regular_Italic",
  serif: "CormorantGaramond_400Regular",
  serifItalic: "CormorantGaramond_400Regular_Italic",
  serifMedium: "CormorantGaramond_500Medium",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemi: "Inter_600SemiBold",
} as const;

/**
 * Typography presets. Use directly: `style={TYPE.pageTitle}`.
 */
export const TYPE = {
  // Hero wordmark — Bodoni-style, ALL CAPS, very large
  hero: {
    fontFamily: FONTS.display,
    fontSize: 72,
    fontWeight: "700" as const,
    color: PALETTE.textPrimary,
    letterSpacing: 4,
    textTransform: "uppercase" as const,
  },
  // Page titles — pink decorative serif italic
  pageTitle: {
    fontFamily: FONTS.serifItalic,
    fontStyle: "italic" as const,
    fontSize: 36,
    fontWeight: "500" as const,
    color: PALETTE.accent,
    letterSpacing: 0.4,
    lineHeight: 44,
  },
  pageSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: "400" as const,
    color: PALETTE.textSecondary,
    lineHeight: 22,
  },
  sectionLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    fontWeight: "500" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.8,
    color: PALETTE.accent,
  },
  cardTitle: {
    fontFamily: FONTS.serifMedium,
    fontSize: 22,
    fontWeight: "500" as const,
    color: PALETTE.textPrimary,
    letterSpacing: 0.2,
  },
  cardTitleItalic: {
    fontFamily: FONTS.serifItalic,
    fontStyle: "italic" as const,
    fontSize: 22,
    fontWeight: "400" as const,
    color: PALETTE.accent,
  },
  body: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 23,
    color: PALETTE.textSecondary,
  },
  bodyPrimary: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 23,
    color: PALETTE.textPrimary,
  },
  small: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: "400" as const,
    color: PALETTE.textTertiary,
    lineHeight: 18,
  },
  smallItalic: {
    fontFamily: FONTS.serifItalic,
    fontStyle: "italic" as const,
    fontSize: 13,
    color: PALETTE.textSecondary,
    lineHeight: 19,
  },
  data: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: "400" as const,
    letterSpacing: 0.3,
    color: PALETTE.textSecondary,
  },
  navTab: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    fontWeight: "500" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.8,
  },
  // Pill button labels
  buttonLabel: {
    fontFamily: FONTS.sansSemi,
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 2.2,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/** Generous radius matches the rounded cards / pills on shadonis.com. */
export const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,        // cards
  pill: 9999,    // CTA buttons
} as const;

export const LAYOUT = {
  maxWidth: 1200,
  pagePadX: 48,
  pagePadXMobile: 20,
  headerHeight: 64,
  ribbonHeight: 44,
} as const;

export const MOTION = {
  fast: 150,
  base: 200,
  slow: 320,
} as const;
