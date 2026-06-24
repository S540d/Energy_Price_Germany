import { useState, useEffect, useRef } from 'react';
import { fetchEnergyData, energyDataManager } from '../services/energyDataManager';
import type { EnergyData } from '../utils/metrics';
import type { CountryCode } from '../utils/countries';
import { DEFAULT_COUNTRY } from '../utils/countries';

/**
 * Hook for fetching and managing energy data
 * Handles loading states and errors
 * Invalidates cache when postal code or country changes
 */
export function useEnergyData(debouncedPostalCode: string, country: CountryCode = DEFAULT_COUNTRY) {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Invalidate the regional cache on postal code / country change (but
        // not on first mount). The national cache is keyed by country inside
        // the data manager, so switching country reloads it automatically.
        if (!isInitialMountRef.current) {
          await energyDataManager.invalidateRegionalCache();
        } else {
          isInitialMountRef.current = false;
        }

        const data = await fetchEnergyData(country, debouncedPostalCode || undefined);
        setEnergyData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error loading energy data'));
        setEnergyData([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [debouncedPostalCode, country]);

  return { energyData, loading, error };
}
