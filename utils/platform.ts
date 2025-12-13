/**
 * Platform Utility Functions
 *
 * Zentrale Stelle für alle Platform-spezifischen Checks.
 * Verhindert direkte Verwendung von Web APIs ohne Platform-Check.
 */

import { Platform } from 'react-native';

// Platform Detection
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobile = isIOS || isAndroid;

/**
 * Prüft ob window.matchMedia verfügbar ist (nur Web)
 */
export function supportsMatchMedia(): boolean {
  return isWeb && typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

/**
 * Gibt das System Dark Mode Preference zurück
 * @returns boolean - true wenn Dark Mode bevorzugt wird
 */
export function getSystemDarkModePreference(): boolean {
  if (!supportsMatchMedia()) {
    // Fallback für Mobile: Könnte Appearance API verwenden
    // import { Appearance } from 'react-native';
    // return Appearance.getColorScheme() === 'dark';
    return false;
  }

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    console.warn('Failed to get system dark mode preference:', error);
    return false;
  }
}

/**
 * Registriert einen Listener für System Theme Änderungen (nur Web)
 * @param callback - Wird aufgerufen wenn sich das Theme ändert
 * @returns Cleanup-Funktion
 */
export function addSystemThemeChangeListener(
  callback: (isDark: boolean) => void
): () => void {
  if (!supportsMatchMedia()) {
    // Noop für Mobile - könnte Appearance.addChangeListener verwenden
    return () => {};
  }

  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  } catch (error) {
    console.warn('Failed to add system theme change listener:', error);
    return () => {};
  }
}

/**
 * Storage Adapter - verwendet localStorage auf Web, AsyncStorage auf Mobile
 */
export const Storage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      return AsyncStorage.default.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb && typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.removeItem(key);
    }
  },
};

/**
 * Prüft ob eine Web API sicher verwendet werden kann
 * Wirft einen Fehler wenn die API auf der aktuellen Plattform nicht verfügbar ist
 */
export function assertWebAPI(apiName: string): void {
  if (!isWeb) {
    throw new Error(
      `Web API "${apiName}" is not available on ${Platform.OS}. ` +
      `Use Platform-specific code or polyfills.`
    );
  }
}

/**
 * Sichere Web API Calls mit Fallback
 */
export function safeWebAPI<T>(
  callback: () => T,
  fallback: T,
  apiName?: string
): T {
  if (!isWeb) {
    if (apiName && __DEV__) {
      console.warn(`Web API "${apiName}" not available on ${Platform.OS}, using fallback`);
    }
    return fallback;
  }

  try {
    return callback();
  } catch (error) {
    if (__DEV__) {
      console.error(`Web API call failed:`, error);
    }
    return fallback;
  }
}
