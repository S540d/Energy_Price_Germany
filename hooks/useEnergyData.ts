import { useState, useEffect, useRef } from 'react';
import { fetchEnergyData, energyDataManager } from '../services/energyDataManager';
import { EnergyData } from '../utils/metrics';
import { logger } from '../utils/logger';

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
        logger.debug('[useEnergyData] Loading with postalCode:', debouncedPostalCode);

        // Invalidate cache on postal code change (but not on first mount)
        if (!isInitialMountRef.current) {
          logger.debug('[useEnergyData] Invalidating caches due to postal code change');
          energyDataManager.invalidateCache();
          await energyDataManager.invalidateRegionalCache();
        } else {
          isInitialMountRef.current = false;
        }

        const data = await fetchEnergyData(debouncedPostalCode || undefined);
        setEnergyData(data);
      } catch (err) {
        logger.error('[useEnergyData] Failed to load energy data:', err);
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
