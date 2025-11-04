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
 */
export function getThemeColors(theme: Theme, systemTheme: 'light' | 'dark'): ThemeColors {
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return isDark
    ? {
        background: '#000000',
        surface: '#1E1E1E',
        text: '#E0E0E0',
        textSecondary: '#A0A0A0',
        primary: '#90CAF9',
        chartLine: '#90CAF9',
        chartLine2: '#CE93D8',
        gridLine: '#888888',
      }
    : {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#1976D2',
        chartLine: '#1976D2',
        chartLine2: '#9C27B0',
        gridLine: '#E0E0E0',
      };
}