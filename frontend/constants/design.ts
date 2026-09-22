// Design System Tokens for Porta a Porta
// A distinctive visual identity for residential community commerce

export const colors = {
  // Core palette - 6 named values
  portaNavy: '#1B2A3A',       // Deep navy - primary brand, headers, CTAs
  morningFog: '#E8EBEF',      // Cool light gray - surfaces, dividers, inactive states
  warmTerracotta: '#C65D3B',  // Terracotta accent - active states, CTAs, signature elements
  creamPaper: '#FDFBF7',      // Warm off-white - page background, card backgrounds
  charcoalInk: '#2D2D2D',     // Near-black - body text, high-contrast readable
  mutedSlate: '#6B7A8A',      // Muted blue-gray - secondary text, placeholders, disabled

  // Semantic aliases for clarity
  primary: '#1B2A3A',
  primaryLight: '#2A4A6A',
  accent: '#C65D3B',
  accentLight: '#D97A5C',
  background: '#FDFBF7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E8EBEF',
  borderStrong: '#D0D8DE',
  textPrimary: '#2D2D2D',
  textSecondary: '#6B7A8A',
  textMuted: '#9AA8B8',
  textOnPrimary: '#FDFBF7',
  textOnAccent: '#FFFFFF',
  error: '#DC3545',
  errorLight: '#FDECEA',
  success: '#28A745',
  successLight: '#E8F5E9',
  warning: '#FFC107',
  warningLight: '#FFF8E1',
  focus: '#C65D3B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const typography = {
  // Display - Fraunces (characterful, used with restraint)
  displayLarge: {
    fontFamily: 'Fraunces_72pt-SemiBold',
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.5,
    fontWeight: '600' as const,
  },
  displayMedium: {
    fontFamily: 'Fraunces_72pt-SemiBold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
    fontWeight: '600' as const,
  },
  displaySmall: {
    fontFamily: 'Fraunces_72pt-Medium',
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
    fontWeight: '500' as const,
  },

  // Body - DM Sans (clean, readable, versatile)
  bodyLarge: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontFamily: 'DM-Sans',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
    fontWeight: '400' as const,
  },

  // Utility - JetBrains Mono (data, prices, codes)
  utilityLarge: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '500' as const,
  },
  utilityMedium: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: '500' as const,
  },
  utilitySmall: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.3,
    fontWeight: '400' as const,
  },

  // Label - DM Sans medium/semibold for UI labels
  labelLarge: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: '600' as const,
  },
  labelMedium: {
    fontFamily: 'DM-Sans',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.3,
    fontWeight: '600' as const,
  },
  labelSmall: {
    fontFamily: 'DM-Sans',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: '600' as const,
  },
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#1B2A3A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1B2A3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1B2A3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

export const layout = {
  screenPadding: 16,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 16,
  chipGap: 8,
} as const;

// Signature: Door Tag dimensions
export const doorTag = {
  width: 36,
  height: 16,
  borderRadius: 4,
  fontSize: 10,
  lineHeight: 16,
  paddingHorizontal: 6,
} as const;

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type TypographyKey = keyof typeof typography;