import { useState, useEffect, useRef } from 'react';
import { fetchEnergyData, energyDataManager } from '../services/energyDataManager';
import { EnergyData } from '../utils/metrics';

/**
 * Hook for fetching and managing energy data
 * Handles loading states and errors
 * Invalidates cache when postal code changes
 */
export function useEnergyData(debouncedPostalCode: string) {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
// Invalidate cache on postal code change (but not on first mount)
        if (!isInitialMountRef.current) {
energyDataManager.invalidateCache();
          await energyDataManager.invalidateRegionalCache();
        } else {
          isInitialMountRef.current = false;
        }

        const data = await fetchEnergyData(debouncedPostalCode || undefined);
        setEnergyData(data);
      } catch (err) {
setError(err instanceof Error ? err : new Error('Unknown error loading energy data'));
        setEnergyData([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [debouncedPostalCode]);

  return { energyData, loading, error };
}
