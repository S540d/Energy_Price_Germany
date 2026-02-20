import { Storage } from '../utils/platform';
import { validateRegionalDataResponse, fetchWithTimeout } from '../utils/apiValidation';
import type { RegionalDataResponse } from '../utils/apiValidation';
export type { RegionalDataResponse } from '../utils/apiValidation';

/**
 * Regional Data Cache Entry (In-Memory)
 */
interface RegionalCacheEntry {
  data: RegionalDataResponse;
  timestamp: number;
}

/**
 * Persistent Regional Cache Entry (localStorage/AsyncStorage)
 * Stored as JSON with date-based validation
 */
interface PersistentRegionalCacheEntry {
  postalCode: string; // PLZ für diese Cache-Einträge
  data: RegionalDataResponse; // Tatsächliche regionale Daten
  cachedDate: string; // YYYY-MM-DD Format (Datum der Cache-Erstellung)
  timestamp: number; // Exakter Zeitstempel für Debugging
}

const REGIONAL_CACHE_STORAGE_KEY = 'energy_regional_cache_v1';
const REGIONAL_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const SERVERLESS_PROXY_URL = 'https://energypricegermany.sven4321.workers.dev/';

/**
 * Returns current date in YYYY-MM-DD format (local time)
 * Used for daily cache validation
 */
function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Regional Data Cache
 * Manages dual-layer caching: persistent storage (daily) + memory (15 min)
 */
export class RegionalDataCache {
  private memoryCache: Map<string, RegionalCacheEntry> = new Map();

  /**
   * Loads regional cache from persistent storage (localStorage/AsyncStorage)
   * Validates: correct postal code and same day
   */
  async loadFromStorage(postalCode: string): Promise<RegionalDataResponse | null> {
    try {
      const cached = await Storage.getItem(REGIONAL_CACHE_STORAGE_KEY);
      if (!cached) return null;

      const parsedCache: PersistentRegionalCacheEntry = JSON.parse(cached);

      if (parsedCache.postalCode !== postalCode) return null;
      if (parsedCache.cachedDate !== getCurrentDateString()) return null;

      return parsedCache.data;
    } catch {
      return null;
    }
  }

  /**
   * Saves regional cache to persistent storage
   * Fire-and-forget: errors don't block execution
   */
  async saveToStorage(postalCode: string, data: RegionalDataResponse): Promise<void> {
    try {
      const cacheEntry: PersistentRegionalCacheEntry = {
        postalCode,
        data,
        cachedDate: getCurrentDateString(),
        timestamp: Date.now(),
      };
      await Storage.setItem(REGIONAL_CACHE_STORAGE_KEY, JSON.stringify(cacheEntry));
    } catch {
      // Non-blocking
    }
  }

  /**
   * Fetches regional renewable data via serverless proxy
   * Uses dual-layer caching: persistent storage (daily) + memory (15 min)
   */
  async fetchRegionalData(postalCode: string): Promise<RegionalDataResponse | null> {
    try {
      // STEP 1: Check in-memory cache first (fastest, 15-minute TTL)
      const memoryCacheEntry = this.memoryCache.get(postalCode);
      if (memoryCacheEntry && Date.now() - memoryCacheEntry.timestamp < REGIONAL_CACHE_DURATION) {
        return memoryCacheEntry.data;
      }

      // STEP 2: Check persistent storage cache (daily validation)
      const persistentCache = await this.loadFromStorage(postalCode);
      if (persistentCache) {
        this.memoryCache.set(postalCode, { data: persistentCache, timestamp: Date.now() });
        return persistentCache;
      }

      // STEP 3: Fetch from API with timeout (8 seconds)
      const url = `${SERVERLESS_PROXY_URL}?plz=${encodeURIComponent(postalCode)}`;
      const response = await fetchWithTimeout(url, {}, 8000);

      if (!response.ok) {
        throw new Error(`Regional API HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = validateRegionalDataResponse(data);

      // STEP 4: Save to both caches
      await this.saveToStorage(postalCode, validatedData);
      this.memoryCache.set(postalCode, { data: validatedData, timestamp: Date.now() });

      return validatedData;
    } catch {
      return null;
    }
  }

  /**
   * Invalidates both memory and persistent caches
   */
  async invalidate(): Promise<void> {
    try {
      this.memoryCache.clear();
      await Storage.removeItem(REGIONAL_CACHE_STORAGE_KEY);
    } catch {
      // Non-blocking
    }
  }
}
