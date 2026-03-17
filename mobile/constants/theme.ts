/**
 * constants/theme.ts — PULSE unified design system
 *
 * Single source of truth. Replaces both the old theme.ts (teal) and colors.js (red/black).
 * Import from this file everywhere — both .tsx and .js screens.
 *
 * Brand: soft red · warm white · charcoal · muted warmth
 * Mood:  polished · youthful · calm · trustworthy · healthcare-adjacent
 */

// ─── Color palette ────────────────────────────────────────────────────────────

export const Colors = {
  // ── Core brand ──────────────────────────────────────────────────────────────
  red:          '#C94040',   // muted brand red — not harsh, not neon
  redLight:     '#F7ECEC',   // soft blush tint for badges / backgrounds
  redMid:       '#E07070',   // mid-tone for gradients
  redDark:      '#8B2A2A',   // deep red for text on light bg

  // ── Neutrals ────────────────────────────────────────────────────────────────
  black:        '#1C1C1E',   // warm near-black (not pure #000)
  charcoal:     '#2C2C2E',   // slightly lighter charcoal for dark surfaces
  graphite:     '#48484A',   // muted dark for secondary text on dark bg
  white:        '#FFFFFF',
  offWhite:     '#FAF9F7',   // warm off-white — main bg
  surface:      '#FFFFFF',   // card surface
  surface2:     '#F4F2F0',   // subtle second surface
  surface3:     '#EDE9E6',   // pressed / input background

  // ── Text ────────────────────────────────────────────────────────────────────
  text:         '#1C1C1E',   // primary text (warm near-black)
  textMuted:    '#6C6060',   // secondary text (warm grey)
  textFaint:    '#A89A9A',   // placeholder / very muted

  // ── Borders ─────────────────────────────────────────────────────────────────
  border:       '#EAE4E4',   // subtle warm border
  borderStrong: '#D4CBCB',   // more visible border

  // ── Status / urgency ────────────────────────────────────────────────────────
  urgent:       '#C94040',   // high urgency = brand red
  urgentLight:  '#F7ECEC',
  warning:      '#C97B30',   // medium urgency = warm amber
  warningLight: '#FBF0E6',
  ok:           '#4A9B6F',   // low / healthy = muted sage green
  okLight:      '#EAF5EF',

  // ── Dark surfaces (hero sections, modals) ────────────────────────────────────
  darkBg:       '#1C1C1E',
  darkSurface:  '#2C2C2E',
  darkBorder:   'rgba(255,255,255,0.10)',
  darkText:     'rgba(255,255,255,0.92)',
  darkTextMuted:'rgba(255,255,255,0.50)',
  darkTextFaint:'rgba(255,255,255,0.28)',

  // ── IBM brand accent (used sparingly for "powered by IBM" moments) ───────────
  ibmBlue:      '#0F62FE',
  ibmBlueMid:   '#4589FF',
  ibmBlueLight: '#EDF4FF',

  // ── Gradient stops (used in LinearGradient) ──────────────────────────────────
  gradStart:    '#C94040',
  gradMid:      '#D96060',
  gradEnd:      '#E8A0A0',
};

// ─── Shorthand alias (for files using C.xxx pattern) ─────────────────────────

export const C = {
  // brand
  red:       Colors.red,
  redDark:   Colors.redDark,
  redLight:  Colors.redLight,
  // neutrals
  black:     Colors.black,
  white:     Colors.white,
  offWhite:  Colors.offWhite,
  // greys
  gray100:   Colors.surface2,
  gray200:   Colors.border,
  gray400:   Colors.textMuted,
  gray800:   Colors.charcoal,
  gray900:   Colors.black,
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const Fonts = {
  // Display / hero titles
  display:      'BebasNeue_400Regular',
  // Serif (section headings, card titles)
  serif:        'DMSerifDisplay_400Regular',
  // Body / UI
  sans:         'DMSans_400Regular',
  sansLight:    'DMSans_300Light',
  sansMedium:   'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
};

// Shorthand alias for files using FONTS.xxx pattern
export const FONTS = {
  display:    Fonts.display,
  body:       Fonts.sans,
  bodyMedium: Fonts.sansMedium,
  bodySemi:   Fonts.sansSemiBold,
};

// ─── Font sizes ───────────────────────────────────────────────────────────────

export const FontSize = {
  micro:   10,
  tiny:    11,
  small:   12,
  body:    14,
  regular: 15,
  medium:  17,
  large:   20,
  title:   26,
  display: 38,
  hero:    48,
};

// ─── Border radius ────────────────────────────────────────────────────────────

export const Radius = {
  xs:   6,
  sm:   10,
  md:   16,
  lg:   24,
  xl:   32,
  pill: 999,
};

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const Shadow = {
  sm: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#C94040',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─── Specialist categories ────────────────────────────────────────────────────

export const SPECIALIST_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Primary Care':   { bg: '#F0F4FF', text: '#2A4FD1', dot: '#4A6FE1' },
  'Dentist':        { bg: '#F0FBF5', text: '#1A6B40', dot: '#2E9660' },
  'Dermatologist':  { bg: '#FFF5F0', text: '#8B3A15', dot: '#C94040' },
  'Mental Health':  { bg: '#F5F0FF', text: '#5A2D9A', dot: '#8B5CF6' },
  'Gynecologist':   { bg: '#FFF0F5', text: '#8B1A4A', dot: '#C94070' },
  'Optometrist':    { bg: '#F0F8FF', text: '#1A4A8B', dot: '#3B82F6' },
  'Urgent Care':    { bg: '#FFF0F0', text: Colors.redDark, dot: Colors.red },
  'Orthopedics':    { bg: '#FFF8F0', text: '#7A4A10', dot: Colors.warning },
  'General':        { bg: Colors.surface2, text: Colors.textMuted, dot: Colors.textFaint },
};