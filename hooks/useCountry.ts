import { useState, useEffect, useRef } from 'react';
import { usePersistence } from './usePersistence';
import type { CountryCode } from '../utils/countries';
import { DEFAULT_COUNTRY, isCountryCode } from '../utils/countries';

const STORAGE_KEY = 'country';

/**
 * Hook for managing the active country with persistence.
 * Loads from storage on mount, defaults to {@link DEFAULT_COUNTRY}, and
 * automatically saves changes. Country is independent from the UI language
 * (a user may view NL data with the German UI).
 */
export function useCountry(): [CountryCode, (country: CountryCode) => void] {
  const [country, setCountryState] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [isInitialized, setIsInitialized] = useState(false);
  const { getItem, setItem } = usePersistence();
  const initRef = useRef(false);

  // Load country on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function loadCountry() {
      try {
        const saved = await getItem(STORAGE_KEY);
        if (isCountryCode(saved)) {
          setCountryState(saved);
        }
      } catch (error) {
      } finally {
        setIsInitialized(true);
      }
    }

    loadCountry();
  }, [getItem]);

  // Save country when it changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    async function saveCountry() {
      try {
        await setItem(STORAGE_KEY, country);
      } catch (error) {}
    }

    saveCountry();
  }, [country, isInitialized, setItem]);

  return [country, setCountryState];
}
