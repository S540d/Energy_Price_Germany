/**
 * Platform Utility Functions
 *
 * Zentrale Stelle für alle Platform-spezifischen Checks.
 * Verhindert direkte Verwendung von Web APIs ohne Platform-Check.
 */

import { Platform } from 'react-native';

type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

// AsyncStorage wird erst beim ersten nativen Zugriff geladen (nie auf Web).
let asyncStorageCache: AsyncStorageLike | null | undefined;
function getAsyncStorage(): AsyncStorageLike | null {
  if (asyncStorageCache === undefined) {
    try {
      const mod = require('@react-native-async-storage/async-storage');
      asyncStorageCache = mod.default ?? mod;
    } catch (e) {
      asyncStorageCache = null;
    }
  }
  return asyncStorageCache ?? null;
}

// Platform Detection
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobile = isIOS || isAndroid;

/**
 * Prüft ob matchMedia verfügbar ist (nur Web) // platform-safe
 */
export function supportsMatchMedia(): boolean {
  return isWeb && typeof window !== 'undefined' && typeof window.matchMedia === 'function'; // platform-safe
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
    return window.matchMedia('(prefers-color-scheme: dark)').matches; // platform-safe
  } catch (error) {
    return false;
  }
}

/**
 * Registriert einen Listener für System Theme Änderungen (nur Web)
 * @param callback - Wird aufgerufen wenn sich das Theme ändert
 * @returns Cleanup-Funktion
 */
export function addSystemThemeChangeListener(callback: (isDark: boolean) => void): () => void {
  if (!supportsMatchMedia()) {
    // Noop für Mobile - könnte Appearance.addChangeListener verwenden
    return () => {};
  }

  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)'); // platform-safe
    const handler = (e: MediaQueryListEvent) => callback(e.matches);

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  } catch (error) {
    return () => {};
  }
}

/**
 * Storage Adapter - verwendet localStorage auf Web, AsyncStorage auf Mobile
 * Fixes: No dynamic imports, static import of AsyncStorage on mobile only
 */
export const Storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; // platform-safe
    }
    return (await getAsyncStorage()?.getItem(key)) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); // platform-safe
      return;
    }
    await getAsyncStorage()?.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key); // platform-safe
      return;
    }
    await getAsyncStorage()?.removeItem(key);
  },
};
