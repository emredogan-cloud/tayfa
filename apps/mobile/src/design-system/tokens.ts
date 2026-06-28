/**
 * Design tokens — the typed mirror of tailwind.config.js, for the places
 * NativeWind className can't reach: shadow styles, StatusBar tints, icon colors,
 * Reanimated values. Warm + social + premium: ember energy, sand surfaces, teal
 * trust, grape for Tayfa+. Keep this in sync with tailwind.config.js.
 */

export const colors = {
  canvas: '#FFFBF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F2EB',
  surfaceSunken: '#F0E8DD',
  line: '#ECE3D7',
  lineStrong: '#DFD3C4',

  ink: '#1F1A17',
  inkMuted: '#5B524B',
  inkSubtle: '#94897E',
  inkInverse: '#FFFBF7',

  ember: '#FF5A3C',
  emberDark: '#E8431F',
  emberSoft: '#FFE7E0',

  amber: '#FF9F1C',
  amberSoft: '#FFF1D8',

  grape: '#7A5AF8',
  grapeSoft: '#EDE9FE',

  verified: '#0E9F8E',
  verifiedSoft: '#D7F2EE',

  success: '#1EA672',
  successSoft: '#DCF3E8',
  danger: '#E5484D',
  dangerSoft: '#FCE5E6',

  women: '#C24AAE',
  womenSoft: '#FBE6F4',

  overlay: 'rgba(20, 16, 14, 0.55)',
} as const;

export type ColorToken = keyof typeof colors;

/** 4pt spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  '2xl': 28,
  pill: 999,
} as const;

/** Soft, warm elevation — never harsh black drop shadows. */
export const shadows = {
  card: {
    shadowColor: '#3A2A1F',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#3A2A1F',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  subtle: {
    shadowColor: '#3A2A1F',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
} as const;

export const duration = {
  fast: 140,
  base: 220,
  slow: 360,
} as const;
