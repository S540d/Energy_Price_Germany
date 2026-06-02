import { useState, useEffect, useRef } from 'react';
import { usePersistence } from './usePersistence';
import type { Theme } from '../utils/theme';
import { GRID_FEES_AND_TAXES } from '../utils/metrics';

export type PriceDisplayMode = 'marketOnly' | 'withGridFees';

/** Auswählbare Cache-Obergrenzen für historische Daten (MB) – Issue #307. */
export const HISTORY_CACHE_LIMIT_OPTIONS_MB = [5, 10, 25, 50] as const;
/** Standard-Obergrenze für den Historie-Cache (MB). */
export const DEFAULT_HISTORY_CACHE_LIMIT_MB = 10;

/**
 * Hook for managing app settings (theme, postal code, grid fees)
 * Provides debounced postal code for API calls
 * Automatically persists changes to storage
 */
export function useSettings() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [postalCode, setPostalCode] = useState<string>('');
  const [debouncedPostalCode, setDebouncedPostalCode] = useState<string>('');
  const [gridFees, setGridFees] = useState<number>(GRID_FEES_AND_TAXES);
  const [priceAlertLow, setPriceAlertLow] = useState<number | null>(null);
  const [priceAlertHigh, setPriceAlertHigh] = useState<number | null>(null);
  const [priceDisplayMode, setPriceDisplayMode] = useState<PriceDisplayMode>('withGridFees');
  const [historyCacheLimitMb, setHistoryCacheLimitMb] = useState<number>(
    DEFAULT_HISTORY_CACHE_LIMIT_MB
  );
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

        // Load price alerts (value > 0 consistent with input validation)
        const savedAlertLow = await getItem('priceAlertLow');
        if (savedAlertLow !== null) {
          const value = parseFloat(savedAlertLow);
          if (!isNaN(value) && value > 0) setPriceAlertLow(value);
        }
        const savedAlertHigh = await getItem('priceAlertHigh');
        if (savedAlertHigh !== null) {
          const value = parseFloat(savedAlertHigh);
          if (!isNaN(value) && value > 0) setPriceAlertHigh(value);
        }

        // Load price display mode
        const savedPriceDisplayMode = await getItem('priceDisplayMode');
        if (savedPriceDisplayMode === 'marketOnly' || savedPriceDisplayMode === 'withGridFees') {
          setPriceDisplayMode(savedPriceDisplayMode);
        }

        // Load history cache limit (MB)
        const savedHistoryLimit = await getItem('historyCacheLimitMb');
        if (savedHistoryLimit) {
          const value = parseInt(savedHistoryLimit, 10);
          if (!isNaN(value) && value > 0) {
            setHistoryCacheLimitMb(value);
          }
        }
      } catch (error) {
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
      } catch (error) {}
    }

    savePostalCode();
  }, [postalCode, isInitialized, setItem]);

  // Save grid fees when they change
  useEffect(() => {
    if (!isInitialized) return;

    async function saveGridFees() {
      try {
        await setItem('gridFees', gridFees.toString());
      } catch (error) {}
    }

    saveGridFees();
  }, [gridFees, isInitialized, setItem]);

  // Save theme when it changes
  useEffect(() => {
    if (!isInitialized) return;

    async function saveTheme() {
      try {
        await setItem('theme', theme);
      } catch (error) {}
    }

    saveTheme();
  }, [theme, isInitialized, setItem]);

  // Save price alert low when it changes
  useEffect(() => {
    if (!isInitialized) return;

    async function saveAlertLow() {
      try {
        if (priceAlertLow === null) {
          await setItem('priceAlertLow', '');
        } else {
          await setItem('priceAlertLow', priceAlertLow.toString());
        }
      } catch (error) {}
    }

    saveAlertLow();
  }, [priceAlertLow, isInitialized, setItem]);

  // Save price alert high when it changes
  useEffect(() => {
    if (!isInitialized) return;

    async function saveAlertHigh() {
      try {
        if (priceAlertHigh === null) {
          await setItem('priceAlertHigh', '');
        } else {
          await setItem('priceAlertHigh', priceAlertHigh.toString());
        }
      } catch (error) {}
    }

    saveAlertHigh();
  }, [priceAlertHigh, isInitialized, setItem]);

  // Save price display mode when it changes
  useEffect(() => {
    if (!isInitialized) return;

    async function savePriceDisplayMode() {
      try {
        await setItem('priceDisplayMode', priceDisplayMode);
      } catch (error) {}
    }

    savePriceDisplayMode();
  }, [priceDisplayMode, isInitialized, setItem]);

  // Save history cache limit when it changes
  useEffect(() => {
    if (!isInitialized) return;

    async function saveHistoryCacheLimit() {
      try {
        await setItem('historyCacheLimitMb', historyCacheLimitMb.toString());
      } catch (error) {}
    }

    saveHistoryCacheLimit();
  }, [historyCacheLimitMb, isInitialized, setItem]);

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
    priceAlertLow,
    setPriceAlertLow,
    priceAlertHigh,
    setPriceAlertHigh,
    priceDisplayMode,
    setPriceDisplayMode,
    historyCacheLimitMb,
    setHistoryCacheLimitMb,
  };
}
