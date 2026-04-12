// ASK Insurance Broker — color tokens extracted from brand logo
//
// Logo elements:
//   Ring core      → #1580FF  pure electric blue
//   Ring glow      → #4DB8FF  sky blue halo
//   Ring outer     → #7DCFFF  ice-blue ambient
//   Chrome hands   → #9DAAB8  cool steel silver (mid-tone)
//   Chrome hi      → #DFE8F0  bright metallic highlight
//   Chrome shadow  → #647585  deep steel shadow
//   Logo bg        → #C4BAB2  warm taupe (not used in UI)
//   ASK text       → #DDE4EC  silver-white 3D letters

export const COLORS = {
  // ── Primary — electric blue neon ring ──────────────────────────
  primary:      "#1580FF",   // ring core — pure royal blue
  primaryDark:  "#0D60CC",   // deeper press / active state
  primaryDeep:  "#083A8C",   // navy — dark backgrounds
  primaryLight: "#E8F2FF",   // tint for cards / backgrounds
  primaryGlow:  "#4DB8FF",   // ring halo — hover glows

  // ── Silver / Chrome — metallic hands & shield ──────────────────
  silver:        "#9DAAB8",  // mid-tone chrome
  silverLight:   "#DFE8F0",  // bright metallic highlight
  silverDark:    "#647585",  // deep steel shadow
  silverText:    "#DDE4EC",  // ASK 3D letter face colour
  chrome:        "#C8D2DC",  // general chrome surface

  // ── Accent — outer glow / ice-blue edge ────────────────────────
  accent:      "#4DB8FF",    // inner halo
  accentBright:"#7DCFFF",    // outer ambient glow
  accentDark:  "#0EA5E9",    // saturated accent for CTAs
  accentLight: "#E0F5FF",    // tinted background wash

  // ── UI Neutrals ────────────────────────────────────────────────
  text:       "#0A1628",     // near-black with blue undertone
  textMuted:  "#5A6B80",     // secondary labels
  textLight:  "#8C9DB0",     // placeholders / hints
  border:     "#DDE4EC",     // default borders (matches chrome)
  borderDark: "#C0CAD6",     // stronger dividers
  bg:         "#F6F9FC",     // page background — cool white
  bgWarm:     "#EFF3F8",     // section alternates
  bgDark:     "#0A1628",     // footer / dark sections
  white:      "#FFFFFF",

  // ── Semantic ───────────────────────────────────────────────────
  success:      "#059669",
  successLight: "#ECFDF5",
  error:        "#DC2626",
  errorLight:   "#FEF2F2",
  warning:      "#D97706",
  warningLight: "#FFFBEB",

  // ── Gradient helpers ───────────────────────────────────────────
  gradientFrom: "#1580FF",   // primary ring blue
  gradientTo:   "#4DB8FF",   // halo blue
  gradientDark: "#083A8C",   // deep navy start
} as const;

export type ColorKey = keyof typeof COLORS;

export const CSS_VARS = {
  "--color-primary":       COLORS.primary,
  "--color-primary-dark":  COLORS.primaryDark,
  "--color-primary-deep":  COLORS.primaryDeep,
  "--color-primary-light": COLORS.primaryLight,
  "--color-primary-glow":  COLORS.primaryGlow,
  "--color-silver":        COLORS.silver,
  "--color-silver-light":  COLORS.silverLight,
  "--color-silver-dark":   COLORS.silverDark,
  "--color-chrome":        COLORS.chrome,
  "--color-accent":        COLORS.accent,
  "--color-accent-bright": COLORS.accentBright,
  "--color-accent-dark":   COLORS.accentDark,
  "--color-accent-light":  COLORS.accentLight,
  "--color-text":          COLORS.text,
  "--color-text-muted":    COLORS.textMuted,
  "--color-bg":            COLORS.bg,
  "--color-bg-dark":       COLORS.bgDark,
} as const;
