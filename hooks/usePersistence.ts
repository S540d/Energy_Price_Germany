import { useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook for cross-platform storage abstraction
 * Handles both Web (localStorage) and React Native (AsyncStorage) automatically
 */
export function usePersistence() {
  const getItem = useCallback(async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? window.localStorage?.getItem(key) || null : null; // platform-safe
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`[usePersistence] Error getting item ${key}:`, error);
      return null;
    }
  }, []);

  const setItem = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem(key, value); // platform-safe
        }
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`[usePersistence] Error setting item ${key}:`, error);
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem(key); // platform-safe
        }
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`[usePersistence] Error removing item ${key}:`, error);
    }
  }, []);

  return { getItem, setItem, removeItem };
}
