import { useCallback } from 'react';
import { Storage } from '../utils/platform';

/**
 * Hook for cross-platform storage access with error logging.
 * Thin wrapper around the `Storage` adapter (localStorage on web, AsyncStorage on native).
 */
export function usePersistence() {
  const getItem = useCallback(async (key: string): Promise<string | null> => {
    try {
      return await Storage.getItem(key);
    } catch (error) {
      console.error(`[usePersistence] Error getting item ${key}:`, error);
      return null;
    }
  }, []);

  const setItem = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      await Storage.setItem(key, value);
    } catch (error) {
      console.error(`[usePersistence] Error setting item ${key}:`, error);
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      await Storage.removeItem(key);
    } catch (error) {
      console.error(`[usePersistence] Error removing item ${key}:`, error);
    }
  }, []);

  return { getItem, setItem, removeItem };
}
