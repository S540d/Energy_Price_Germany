/**
 * Modern Design System
 * Zentrale Verwaltung von Design-Tokens für konsistentes, modernes UI
 */

// ============ SPACING ============
// 8px Grid System
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ============ BORDER RADIUS ============
// Modern rounded corners
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

// ============ SHADOWS / ELEVATION ============
// Subtle, modern elevation system
export const elevation = {
  none: { shadowColor: 'transparent', shadowOpacity: 0 },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ============ SEMANTIC COLOR SCALES ============
// Modern semantic colors with better saturation and contrast
export const colorScales = {
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  purple: {
    50: '#F9F5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBEF63',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#145231',
  },
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#92400E',
    900: '#78350F',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EFEFEF',
    300: '#E5E5E5',
    400: '#D0D0D0',
    500: '#A8A8A8',
    600: '#888888',
    700: '#666666',
    800: '#333333',
    900: '#1A1A1A',
    950: '#0A0A0A',
  },
  navy: {
    800: '#0a1628',
    900: '#0d1a2e',
    950: '#0a0f1e',
  },
  amber: {
    400: '#eab308',
    500: '#ca8a04',
  },
} as const;

// ============ DATA-VIZ / BRAND COLORS ============
// Feste Markenfarbe für "Erneuerbare Energien" — unabhängig vom semantischen
// Success-Grün, da sie eine Datenkategorie (Chart-Legende, Icon-Akzent)
// kennzeichnet statt eines UI-Zustands. War zuvor an 3 Stellen hartkodiert
// (RenewableBarChart, MetricsView, ChartSection – Issue #468).
export const colors = {
  renewable: '#4CAF50',
} as const;
