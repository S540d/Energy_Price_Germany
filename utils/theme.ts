export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  chartLine: string;
  chartLine2: string;
  gridLine: string;
}

/**
 * Gibt die Farben für das aktuelle Theme zurück
 * Design System: "Soft & Modern" (Option 1)
 * - Sanftere Farbpalette (keine puren Schwarz/Weiß-Töne)
 * - Wärmere Surfaces für bessere Lesbarkeit
 * - Modernere Akzentfarben
 */
export function getThemeColors(theme: Theme, systemTheme: 'light' | 'dark'): ThemeColors {
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return isDark
    ? {
        // Soft Dark Mode: Dunkelgrau statt pures Schwarz
        background: '#0A0A0A',
        surface: '#1A1A1A',
        text: '#E8E8E8',
        textSecondary: '#A8A8A8',
        primary: '#90CAF9',
        chartLine: '#90CAF9',
        chartLine2: '#CE93D8',
        gridLine: '#404040', // Weicher für gestrichelte Linien
      }
    : {
        // Soft Light Mode: Cremeweiß statt pures Weiß
        background: '#FAFAFA',
        surface: '#EFEFEF',
        text: '#1A1A1A',
        textSecondary: '#666666',
        primary: '#1976D2',
        chartLine: '#1976D2',
        chartLine2: '#9C27B0',
        gridLine: '#D0D0D0', // Weicher für gestrichelte Linien
      };
}