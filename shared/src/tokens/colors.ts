// ASK Insurance Broker — color tokens derived from brand logo
// Logo: silver metallic hands, electric-blue neon ring, silver shield on warm grey background

export const COLORS = {
  // Primary — electric blue from the neon ring
  primary: "#1A6BF5",
  primaryDark: "#1452C8",
  primaryDeep: "#0D3A9E",
  primaryLight: "#EBF2FF",
  primaryGlow: "#3B8BFF",

  // Silver / metallic — from the hands & shield
  silver: "#94A3B8",
  silverLight: "#CBD5E1",
  silverDark: "#64748B",
  metallic: "#E2E8F0",

  // Accent — cyan glow edge of the ring
  accent: "#38BDF8",
  accentDark: "#0EA5E9",
  accentLight: "#E0F6FF",

  // Neutrals
  text: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  border: "#E2E8F0",
  borderDark: "#CBD5E1",
  bg: "#F8FAFC",
  bgWarm: "#F1F5F9",
  white: "#FFFFFF",

  // Semantic
  success: "#059669",
  successLight: "#ECFDF5",
  error: "#DC2626",
  errorLight: "#FEF2F2",
  warning: "#D97706",
  warningLight: "#FFFBEB",

  // Gradient stops
  gradientFrom: "#1A6BF5",
  gradientTo: "#38BDF8",
} as const;

export type ColorKey = keyof typeof COLORS;

// Tailwind-compatible CSS custom property map
export const CSS_VARS = {
  "--color-primary": COLORS.primary,
  "--color-primary-dark": COLORS.primaryDark,
  "--color-accent": COLORS.accent,
  "--color-silver": COLORS.silver,
  "--color-bg": COLORS.bg,
  "--color-text": COLORS.text,
} as const;
