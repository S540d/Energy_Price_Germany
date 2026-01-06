import { colorScales, semanticColors } from './designSystem';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background & Surfaces
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // UI Elements
  border: string;
  borderLight: string;
  disabled: string;

  // Brand colors
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;

  // Chart colors
  chartLine: string;
  chartLine2: string;
  gridLine: string;
  chartOverlay: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;
  pending: string;
}

/**
 * Modernes, konsistentes Design System
 * - Verbesserte Farbkontraste für bessere Zugänglichkeit
 * - Konsistente Farbpalette auf allen Geräten
 * - Semantische Farben für Zustände
 */
export function getThemeColors(theme: Theme, systemTheme: 'light' | 'dark'): ThemeColors {
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return isDark
    ? {
        // Dark Mode - moderne tiefe Farben
        background: colorScales.neutral[950],     // #0A0A0A
        surface: colorScales.neutral[900],         // #1A1A1A
        surfaceSecondary: colorScales.neutral[800], // #333333
        card: colorScales.neutral[800],            // #333333

        text: colorScales.neutral[50],             // #FAFAFA
        textSecondary: colorScales.neutral[400],   // #D0D0D0
        textTertiary: colorScales.neutral[500],    // #A8A8A8

        border: colorScales.neutral[700],          // #666666
        borderLight: colorScales.neutral[600],     // #888888
        disabled: colorScales.neutral[500],        // #A8A8A8

        // Modern vibrant brand colors
        primary: colorScales.blue[400],            // #60A5FA
        primaryLight: colorScales.blue[300],       // #93C5FD
        secondary: colorScales.purple[400],        // #C084FC
        secondaryLight: colorScales.purple[300],   // #D8B4FE

        chartLine: colorScales.blue[400],          // #60A5FA
        chartLine2: colorScales.purple[400],       // #C084FC
        gridLine: colorScales.neutral[700],        // #666666

        chartOverlay: 'rgba(96, 165, 250, 0.1)',

        // Semantic colors
        success: colorScales.green[400],           // #4ADE80
        warning: colorScales.orange[400],          // #FB923C
        error: colorScales.red[400],               // #F87171
        info: colorScales.blue[400],               // #60A5FA
        pending: colorScales.orange[300],          // #FDBA74
      }
    : {
        // Light Mode - frische, moderne Farben
        background: colorScales.neutral[50],      // #FAFAFA
        surface: colorScales.neutral[100],        // #F5F5F5
        surfaceSecondary: colorScales.neutral[300], // #E5E5E5 (darker for better contrast)
        card: '#FFFFFF',                          // Weiß für Karten

        text: colorScales.neutral[900],           // #1A1A1A
        textSecondary: colorScales.neutral[700],  // #666666
        textTertiary: colorScales.neutral[500],   // #A8A8A8

        border: colorScales.neutral[300],         // #E5E5E5
        borderLight: colorScales.neutral[200],    // #EFEFEF
        disabled: colorScales.neutral[400],       // #D0D0D0

        // Vibrant brand colors
        primary: colorScales.blue[600],           // #2563EB
        primaryLight: colorScales.blue[100],      // #DBEAFE
        secondary: colorScales.purple[600],       // #9333EA
        secondaryLight: colorScales.purple[100],  // #F3E8FF

        chartLine: colorScales.blue[600],         // #2563EB
        chartLine2: colorScales.purple[600],      // #9333EA
        gridLine: colorScales.neutral[300],       // #E5E5E5

        chartOverlay: 'rgba(37, 99, 235, 0.1)',

        // Semantic colors
        success: colorScales.green[600],          // #16A34A
        warning: colorScales.orange[500],         // #F97316
        error: colorScales.red[600],              // #DC2626
        info: colorScales.blue[600],              // #2563EB
        pending: colorScales.orange[400],         // #FB923C
      };
}