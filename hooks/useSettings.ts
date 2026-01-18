import { useState, useEffect, useRef } from 'react';
import { usePersistence } from './usePersistence';
import { Theme } from '../utils/theme';
import { GRID_FEES_AND_TAXES } from '../utils/metrics';
import { logger } from '../utils/logger';

/**
 * Hook for managing app settings (theme, postal code, grid fees)
 * Provides debounced postal code for API calls
 * Automatically persists changes to storage
 */
export function useSettings() {
  const [theme, setTheme] = useState<Theme>('system');
  const [postalCode, setPostalCode] = useState<string>('');
  const [debouncedPostalCode, setDebouncedPostalCode] = useState<string>('');
  const [gridFees, setGridFees] = useState<number>(GRID_FEES_AND_TAXES);
  const [isInitialized, setIsInitialized] = useState(false);
  const { getItem, setItem } = usePersistence();
  const initRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from storage on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function loadSettings() {
      try {
        // Load postal code
        const savedPostalCode = (await getItem('postalCode')) || '';
        setPostalCode(savedPostalCode);
        if (savedPostalCode.length === 5) {
          setDebouncedPostalCode(savedPostalCode);
        }

        // Load grid fees
        const savedGridFees = await getItem('gridFees');
        if (savedGridFees) {
          const value = parseFloat(savedGridFees);
          if (!isNaN(value) && value > 0) {
            setGridFees(value);
          }
        }

        // Load theme
        const savedTheme = (await getItem('theme')) as Theme | null;
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setTheme(savedTheme);
        }
      } catch (error) {
        logger.error('[useSettings] Failed to load settings:', error);
      } finally {
        setIsInitialized(true);
      }
    }

    loadSettings();
  }, [getItem]);

  // Save postal code when it changes
  useEffect(() => {
    if (!isInitialized) return;

    async function savePostalCode() {
      try {
        await setItem('postalCode', postalCode);
      } catch (error) {
        logger.error('[useSettings] Failed to save postal code:', error);
      }
    }

    savePostalCode();
  }, [postalCode, isInitialized, setItem]);

  // Save grid fees when they change
  useEffect(() => {
    if (!isInitialized) return;

    async function saveGridFees() {
      try {
        await setItem('gridFees', gridFees.toString());
      } catch (error) {
        logger.error('[useSettings] Failed to save grid fees:', error);
      }
    }

    saveGridFees();
  }, [gridFees, isInitialized, setItem]);

  // Save theme when it changes
  useEffect(() => {
    if (!isInitialized) return;

    async function saveTheme() {
      try {
        await setItem('theme', theme);
      } catch (error) {
        logger.error('[useSettings] Failed to save theme:', error);
      }
    }

    saveTheme();
  }, [theme, isInitialized, setItem]);

  // Debounce postal code for API calls
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (postalCode.length === 5 || postalCode.length === 0) {
        setDebouncedPostalCode(postalCode);
      }
    }, 1000);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [postalCode]);

  return {
    theme,
    setTheme,
    postalCode,
    setPostalCode,
    debouncedPostalCode,
    gridFees,
    setGridFees,
  };
}
