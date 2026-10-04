import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Persist a setting whenever its serialized value changes (after initial load)
  const persist = useCallback(
    async (key: string, value: string) => {
      try {
        await setItem(key, value);
      } catch (error) {}
    },
    [setItem]
  );

  useEffect(() => {
    if (isInitialized) persist('postalCode', postalCode);
  }, [postalCode, isInitialized, persist]);

  useEffect(() => {
    if (isInitialized) persist('gridFees', gridFees.toString());
  }, [gridFees, isInitialized, persist]);

  useEffect(() => {
    if (isInitialized) persist('theme', theme);
  }, [theme, isInitialized, persist]);

  useEffect(() => {
    if (isInitialized)
      persist('priceAlertLow', priceAlertLow === null ? '' : priceAlertLow.toString());
  }, [priceAlertLow, isInitialized, persist]);

  useEffect(() => {
    if (isInitialized)
      persist('priceAlertHigh', priceAlertHigh === null ? '' : priceAlertHigh.toString());
  }, [priceAlertHigh, isInitialized, persist]);

  useEffect(() => {
    if (isInitialized) persist('priceDisplayMode', priceDisplayMode);
  }, [priceDisplayMode, isInitialized, persist]);

  useEffect(() => {
    if (isInitialized) persist('historyCacheLimitMb', historyCacheLimitMb.toString());
  }, [historyCacheLimitMb, isInitialized, persist]);

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
