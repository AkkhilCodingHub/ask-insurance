import '@/global.css';
import { Platform } from 'react-native';

// ASK Insurance Broker — brand tokens from logo
// Ring core #1580FF · Ring halo #4DB8FF · Chrome #9DAAB8

export const Colors = {
  primary:       '#1580FF',
  primaryDark:   '#0D60CC',
  primaryDeep:   '#083A8C',
  primaryLight:  '#E8F2FF',

  accent:        '#4DB8FF',
  accentLight:   '#E0F5FF',

  silver:        '#9DAAB8',
  silverLight:   '#DFE8F0',
  silverDark:    '#647585',

  text:          '#0A1628',
  textMuted:     '#5A6B80',
  textLight:     '#8C9DB0',

  border:        '#DDE4EC',
  bg:            '#F6F9FC',
  bgWarm:        '#EFF3F8',
  white:         '#FFFFFF',
  bgDark:        '#0A1628',

  success:       '#059669',
  successLight:  '#ECFDF5',
  error:         '#DC2626',
  warning:       '#D97706',

  // light / dark theme wrappers kept for ThemeProvider compat
  light: {
    text:              '#0A1628',
    textMuted:         '#5A6B80',
    textLight:         '#8C9DB0',
    background:        '#F6F9FC',
    bg:                '#F6F9FC',
    bgWarm:            '#EFF3F8',
    white:             '#FFFFFF',
    card:              '#FFFFFF',
    border:            '#DDE4EC',
    primaryLight:      '#E8F2FF',
    backgroundElement: '#EFF3F8',
    backgroundSelected:'#DDE4EC',
    textSecondary:     '#5A6B80',
  },
  dark: {
    text:              '#F8FAFC',
    textMuted:         '#9CA3AF',
    textLight:         '#6B7280',
    background:        '#090D16',
    bg:                '#090D16',
    bgWarm:            '#111827',
    white:             '#111827',
    card:              '#111827',
    border:            '#1F2937',
    primaryLight:      'rgba(21, 128, 255, 0.15)',
    backgroundElement: '#111827',
    backgroundSelected:'#1F2937',
    textSecondary:     '#9CA3AF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios:     { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal',    serif: 'serif',    rounded: 'normal',     mono: 'monospace'    },
  web:     { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64,
} as const;

// Base height (52) + safe area bottom (34 iPhone, ~24 Android gesture nav)
export const BottomTabInset = Platform.select({ ios: 86, android: 76 }) ?? 52;
export const MaxContentWidth = 800;

export {
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  wp,
  hp,
  isTablet,
  isSmallDevice,
  useResponsive,
} from '@/utils/scaling';
