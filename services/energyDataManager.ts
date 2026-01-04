import { EnergyData } from '../utils/metrics';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import { isValidPostalCode } from '../utils/postalCodeUtils';

/**
 * Datenquelle-Typen
 */
export type DataSource = 'energy-charts' | 'awattar' | 'none';

/**
 * API Response Types
 */
interface MarketDataItem {
  start_timestamp: number;
  end_timestamp: number;
  marketprice: number | null;
  renewable_share: number | null;
  interpolated?: boolean;
}

interface MarketDataResponse {
  source: string;
  data: MarketDataItem[];
}

/**
 * Regional Data API Response Type
 * Response from Energy Charts Signal API
 */
interface RegionalDataResponse {
  unix_seconds: number[];  // Timestamps in seconds since epoch
  share: number[];         // Renewable energy share percentages
}

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
  postalCode: string;        // PLZ für diese Cache-Einträge
  data: RegionalDataResponse; // Tatsächliche regionale Daten
  cachedDate: string;        // YYYY-MM-DD Format (Datum der Cache-Erstellung)
  timestamp: number;         // Exakter Zeitstempel für Debugging
}

/**
 * Cache-Konfiguration
 */
interface CacheConfig {
  duration: number; // in Millisekunden
  maxAge: number; // maximale Cache-Alter in Millisekunden
}

/**
 * Daten-Manager für Energie-Daten
 * Zentralisiert Laden, Verarbeiten und Cachen der Daten
 */
export class EnergyDataManager {
  private static instance: EnergyDataManager;
  private cachedData: EnergyData[] | null = null;
  private cacheTimestamp: number = 0;
  private currentDataSource: DataSource = 'none';
  private isLoading: boolean = false;
  private loadingPromise: Promise<EnergyData[]> | null = null;
  
  // Regional data cache (in-memory)
  private regionalCache: Map<string, RegionalCacheEntry> = new Map();
  private readonly regionalCacheDuration = 15 * 60 * 1000; // 15 minutes

  // Persistent regional cache storage key
  private readonly REGIONAL_CACHE_STORAGE_KEY = 'energy_regional_cache_v1';

  // Cache-Konfiguration
  private readonly cacheConfig: CacheConfig = {
    duration: 15 * 60 * 1000, // 15 Minuten
    maxAge: 60 * 60 * 1000, // 1 Stunde
  };

  private constructor() {}

  /**
   * Singleton-Instanz
   */
  public static getInstance(): EnergyDataManager {
    if (!EnergyDataManager.instance) {
      EnergyDataManager.instance = new EnergyDataManager();
    }
    return EnergyDataManager.instance;
  }

  /**
   * Gibt die aktuelle Datenquelle zurück
   */
  public getCurrentDataSource(): DataSource {
    return this.currentDataSource;
  }

  /**
   * Prüft ob Cache gültig ist
   */
  private isCacheValid(): boolean {
    if (!this.cachedData) return false;
    const age = Date.now() - this.cacheTimestamp;
    return age < this.cacheConfig.duration;
  }

  /**
   * Returns current date in YYYY-MM-DD format (local time)
   * Used for daily cache validation
   */
  private getCurrentDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Loads regional cache from persistent storage (localStorage/AsyncStorage)
   * Returns null if no valid cache exists
   * Validates: correct postal code and same day
   */
  private async loadRegionalCacheFromStorage(postalCode: string): Promise<RegionalDataResponse | null> {
    try {
      // Dynamically import Storage to avoid issues with platform detection
      const StorageModule = await import('../utils/platform');
      const { Storage } = StorageModule;

      const cached = await Storage.getItem(this.REGIONAL_CACHE_STORAGE_KEY);

      if (!cached) {
        logger.debug('[loadRegionalCacheFromStorage] No cached data found in storage');
        return null;
      }

      const parsedCache: PersistentRegionalCacheEntry = JSON.parse(cached);
      const currentDate = this.getCurrentDateString();

      // Validate: correct postal code
      if (parsedCache.postalCode !== postalCode) {
        logger.debug(`[loadRegionalCacheFromStorage] Postal code mismatch: cached=${parsedCache.postalCode}, requested=${postalCode}`);
        return null;
      }

      // Validate: same day
      if (parsedCache.cachedDate !== currentDate) {
        logger.debug(`[loadRegionalCacheFromStorage] Cache expired (day changed): cached=${parsedCache.cachedDate}, current=${currentDate}`);
        return null;
      }

      logger.debug(`[loadRegionalCacheFromStorage] Valid cache found for PLZ ${postalCode} from ${parsedCache.cachedDate}`);
      return parsedCache.data;

    } catch (error) {
      logger.error('[loadRegionalCacheFromStorage] Error loading from storage:', error);
      return null;
    }
  }

  /**
   * Saves regional cache to persistent storage (localStorage/AsyncStorage)
   * Fire-and-forget: errors are logged but don't block execution
   */
  private async saveRegionalCacheToStorage(
    postalCode: string,
    data: RegionalDataResponse
  ): Promise<void> {
    try {
      const StorageModule = await import('../utils/platform');
      const { Storage } = StorageModule;

      const cacheEntry: PersistentRegionalCacheEntry = {
        postalCode,
        data,
        cachedDate: this.getCurrentDateString(),
        timestamp: Date.now(),
      };

      await Storage.setItem(
        this.REGIONAL_CACHE_STORAGE_KEY,
        JSON.stringify(cacheEntry)
      );

      logger.debug(`[saveRegionalCacheToStorage] Saved cache for PLZ ${postalCode} (${this.getCurrentDateString()})`);

    } catch (error) {
      // Non-blocking: just log the error
      logger.error('[saveRegionalCacheToStorage] Error saving to storage:', error);
    }
  }

  /**
   * Fetches regional renewable data via a serverless proxy function
   * Uses dual-layer caching: persistent storage (daily) + memory (15 min)
   * This avoids CORS issues and API rate limits by caching requests on the server side
   * @returns Regional data or null if fetch fails
   */
  private async fetchRegionalData(postalCode: string): Promise<RegionalDataResponse | null> {
    try {
      // STEP 1: Check persistent storage cache first (daily validation)
      const persistentCache = await this.loadRegionalCacheFromStorage(postalCode);
      if (persistentCache) {
        logger.debug(`[fetchRegionalData] Using persistent storage cache for PLZ ${postalCode}`);
        // Also populate memory cache for faster subsequent access
        this.regionalCache.set(postalCode, { data: persistentCache, timestamp: Date.now() });
        return persistentCache;
      }

      // STEP 2: Check in-memory cache (15-minute fallback)
      const memoryCache = this.regionalCache.get(postalCode);
      if (memoryCache && Date.now() - memoryCache.timestamp < this.regionalCacheDuration) {
        logger.debug(`[fetchRegionalData] Using memory cache for PLZ ${postalCode}`);
        return memoryCache.data;
      }

      // STEP 3: Fetch from API
      logger.debug(`[fetchRegionalData] No valid cache found, fetching regional data for postal code: ${postalCode}`);

      const SERVERLESS_PROXY_URL = 'https://energypricegermany.sven4321.workers.dev/';
      const url = `${SERVERLESS_PROXY_URL}?plz=${postalCode}`;

      logger.debug(`[fetchRegionalData] Fetching from proxy: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Regional API HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RegionalDataResponse = await response.json();

      logger.debug(`[fetchRegionalData] Regional data fetched successfully for PLZ ${postalCode}`);
      logger.debug(`[fetchRegionalData] Response data points: ${data.unix_seconds?.length || 0}`);

      if (data.unix_seconds && data.unix_seconds.length > 0) {
        const first = new Date(data.unix_seconds[0] * 1000).toISOString();
        const last = new Date(data.unix_seconds[data.unix_seconds.length - 1] * 1000).toISOString();
        logger.debug(`[fetchRegionalData] Time range: ${first} to ${last}`);
      }

      // STEP 4: Save to both caches
      // Persistent cache (daily): survives app restart
      await this.saveRegionalCacheToStorage(postalCode, data);
      // Memory cache (15-min): faster for repeated access
      this.regionalCache.set(postalCode, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      logger.error(`[fetchRegionalData] Failed to fetch regional data for PLZ ${postalCode}:`, error);
      logger.warn(`[fetchRegionalData] Regional renewable data could not be loaded. Check if the serverless proxy is deployed and accessible.`);
      return null;
    }
  }

  /**
   * Merges regional data into the national energy data
   *
   * Note on timestamp conversion:
   * - Energy Charts Signal API returns timestamps in unix_seconds (seconds since epoch)
   * - The rest of the system uses JavaScript timestamps (milliseconds since epoch)
   * - We convert by multiplying by 1000 to ensure proper timestamp matching
   * - Uses fuzzy matching (within 60 seconds) to handle timing offsets
   */
  private mergeRegionalData(nationalData: EnergyData[], regionalData: RegionalDataResponse | null): EnergyData[] {
    if (!regionalData || !regionalData.unix_seconds || !regionalData.share) {
      logger.debug('[mergeRegionalData] No regional data provided, returning national data unchanged');
      return nationalData;
    }

    // Validate that both arrays have the same length to prevent index mismatches
    if (regionalData.unix_seconds.length !== regionalData.share.length) {
      logger.warn(
        `Regional data array length mismatch: unix_seconds=${regionalData.unix_seconds.length}, share=${regionalData.share.length}. Skipping regional data merge.`
      );
      return nationalData;
    }

    try {
      // Create a list of regional data with timestamps for fuzzy matching
      const regionalList: Array<{ timestamp: number; share: number }> = [];

      for (let i = 0; i < regionalData.unix_seconds.length; i++) {
        // Convert unix_seconds (from API) to milliseconds (used internally)
        const timestampMs = regionalData.unix_seconds[i] * 1000;
        let share = regionalData.share[i];

        if (share !== null && share !== undefined) {
          // Validate and cap share values to 0-100 range
          // The API sometimes returns values > 100, which we need to cap
          share = Math.max(0, Math.min(100, share));
          regionalList.push({ timestamp: timestampMs, share });
        }
      }

      logger.debug(`[mergeRegionalData] Received ${regionalList.length} regional data points`);
      if (regionalList.length > 0) {
        logger.debug(`[mergeRegionalData] Regional timestamps: first=${regionalList[0].timestamp}, last=${regionalList[regionalList.length - 1].timestamp}`);
      }
      if (nationalData.length > 0) {
        logger.debug(`[mergeRegionalData] National timestamps: first=${nationalData[0].timestamp}, last=${nationalData[nationalData.length - 1].timestamp}`);
      }

      // Merge regional data into national data using fuzzy matching (within 60 seconds)
      const TIMESTAMP_TOLERANCE_MS = 60 * 1000; // 60 seconds tolerance

      const merged = nationalData.map(item => {
        // Try exact match first
        let regional = regionalList.find(r => r.timestamp === item.timestamp);

        // If no exact match, try fuzzy match (within tolerance)
        if (!regional) {
          regional = regionalList.find(r =>
            Math.abs(r.timestamp - item.timestamp) <= TIMESTAMP_TOLERANCE_MS
          );
        }

        return {
          ...item,
          renewableShareRegional: regional ? regional.share : null,
        };
      });

      const matchedCount = merged.filter(item => item.renewableShareRegional !== null).length;
      logger.debug(`[mergeRegionalData] Successfully matched ${matchedCount} out of ${nationalData.length} national data points with regional data`);

      if (matchedCount === 0 && regionalList.length > 0) {
        logger.warn(`[mergeRegionalData] ⚠️ No timestamp matches found! Regional data may be from different time range.`);
        logger.warn(`[mergeRegionalData] Sample national timestamp: ${nationalData[0]?.timestamp}`);
        logger.warn(`[mergeRegionalData] Sample regional timestamp: ${regionalList[0]?.timestamp}`);
        logger.warn(`[mergeRegionalData] Difference: ${Math.abs((nationalData[0]?.timestamp || 0) - (regionalList[0]?.timestamp || 0))} ms`);
      }

      return merged;
    } catch (error) {
      logger.error('[mergeRegionalData] Error merging regional data:', error);
      return nationalData;
    }
  }

  /**
   * Lädt Rohdaten von der API
   */
  private async fetchRawData(): Promise<MarketDataResponse> {
    try {
      logger.debug('Loading energy data from marketdata.json...');
      logger.debug('Platform.OS:', Platform.OS);

      // Cache-busting Parameter hinzufügen
      const cacheBust = Date.now();

      // For native apps (iOS/Android), use full URL to GitHub Pages
      // For web, use relative path
      const dataUrl = Platform.OS === 'web'
        ? `./data/marketdata.json?v=${cacheBust}`
        : `https://s540d.github.io/Energy_Price_Germany/data/marketdata.json?v=${cacheBust}`;

      logger.debug(`Fetching from: ${dataUrl}`);
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.debug(`Successfully loaded raw data with ${data.data?.length || 0} entries`);
      logger.debug('Data source:', data.source);
      return data;
    } catch (error) {
      logger.error('Failed to load marketdata.json:', error);
      throw error;
    }
  }

  /**
   * Verarbeitet Rohdaten in das interne Format
   */
  private processRawData(rawData: MarketDataResponse): EnergyData[] {
    if (!rawData.data || !Array.isArray(rawData.data)) {
      logger.warn('Invalid data format received');
      return [];
    }

    // Bestimme Datenquelle
    const source = rawData.source || 'awattar';
    this.currentDataSource = source === 'energy-charts' ? 'energy-charts' : 'awattar';

    // Transformiere Daten
    const processedData: EnergyData[] = rawData.data.map((item) => {
      const isInterpolated = item.interpolated || false;
      return {
        timestamp: item.start_timestamp,
        // Use nullish coalescing to preserve 0 and negative values
        marketPrice: item.marketprice ?? null, // EUR/MWh
        renewableShare: item.renewable_share ?? null, // Prozent
        isMarketPriceInterpolated: isInterpolated,
        // Renewable data is NEVER interpolated - it's either real EC data or null (missing)
        isRenewableShareInterpolated: false,
      };
    });

    logger.debug(`Processed ${processedData.length} data points (source: ${this.currentDataSource})`);
    return processedData;
  }

  /**
   * Generiert Mock-Daten für Fallback
   */
  private generateMockData(): EnergyData[] {
    logger.debug('Generating mock data as fallback');
    const mockData: EnergyData[] = [];
    const now = Date.now();

    for (let i = 0; i < 96; i++) {
      const hour = i / 4;
      mockData.push({
        timestamp: now - (96 - i) * 15 * 60 * 1000,
        marketPrice: 30 + Math.sin(hour / 24 * Math.PI * 2) * 20 + Math.random() * 10,
        renewableShare: 60 + Math.sin((hour - 6) / 24 * Math.PI * 2) * 30 + Math.random() * 10,
        isMarketPriceInterpolated: false,
        isRenewableShareInterpolated: false,
      });
    }

    this.currentDataSource = 'none';
    return mockData;
  }

  /**
   * Lädt und verarbeitet Energiedaten
   * Verwendet Cache wenn verfügbar und gültig
   * @param postalCode Optional postal code for regional data
   */
  public async loadEnergyData(postalCode?: string): Promise<EnergyData[]> {
    // Wenn bereits ein Ladevorgang läuft, warte darauf
    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    // Prüfe Cache
    if (this.isCacheValid()) {
      const age = Date.now() - this.cacheTimestamp;
      logger.debug(`Using cached energy data (age: ${Math.round(age / 1000 / 60)} minutes, source: ${this.currentDataSource})`);
      
      // If postal code is provided, merge regional data
      if (isValidPostalCode(postalCode)) {
        const regionalData = await this.fetchRegionalData(postalCode!);
        if (regionalData) {
          return this.mergeRegionalData(this.cachedData!, regionalData);
        }
      }
      
      return this.cachedData!;
    }

    // Starte Ladevorgang
    this.isLoading = true;
    this.loadingPromise = this.performDataLoad(postalCode);

    try {
      const data = await this.loadingPromise;
      return data;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  /**
   * Führt den eigentlichen Datenlade-Vorgang aus
   */
  private async performDataLoad(postalCode?: string): Promise<EnergyData[]> {
    try {
      logger.debug('[DataManager] performDataLoad called with postalCode:', postalCode);

      // Lade Rohdaten
      const rawData = await this.fetchRawData();
      logger.debug('[DataManager] Raw data loaded, items:', rawData.data?.length || 0);

      // Verarbeite Daten
      let processedData = this.processRawData(rawData);
      logger.debug('[DataManager] Processed data length:', processedData.length);

      // Cache die verarbeiteten Daten
      this.cachedData = processedData;
      this.cacheTimestamp = Date.now();

      // If postal code is provided, fetch and merge regional data
      if (isValidPostalCode(postalCode)) {
        logger.debug('[DataManager] Valid postal code, fetching regional data:', postalCode);
        const regionalData = await this.fetchRegionalData(postalCode!);
        if (regionalData) {
          logger.debug('[DataManager] Merging regional data');
          processedData = this.mergeRegionalData(processedData, regionalData);
        }
      } else {
        logger.debug('[DataManager] No valid postal code, skipping regional data');
      }

      logger.debug('[DataManager] Returning processed data length:', processedData.length);
      return processedData;

    } catch (error) {
      logger.error('[DataManager] Data loading failed, using mock data:', error);

      // Fallback auf Mock-Daten
      const mockData = this.generateMockData();
      this.cachedData = mockData;
      this.cacheTimestamp = Date.now();

      return mockData;
    }
  }

  /**
   * Invalidiert den Cache (für manuelles Neuladen)
   */
  public invalidateCache(): void {
    this.cachedData = null;
    this.cacheTimestamp = 0;
    this.currentDataSource = 'none';
    logger.debug('Cache invalidated');
  }

  /**
   * Invalidates regional cache (both memory and persistent storage)
   * Called when postal code changes
   */
  public async invalidateRegionalCache(): Promise<void> {
    try {
      // Clear in-memory regional cache
      this.regionalCache.clear();
      logger.debug('[invalidateRegionalCache] Memory cache cleared');

      // Clear persistent storage cache
      const StorageModule = await import('../utils/platform');
      const { Storage } = StorageModule;
      await Storage.removeItem(this.REGIONAL_CACHE_STORAGE_KEY);
      logger.debug('[invalidateRegionalCache] Persistent storage cache cleared');
    } catch (error) {
      logger.error('[invalidateRegionalCache] Error clearing regional cache:', error);
    }
  }

  /**
   * Gibt Cache-Informationen zurück
   */
  public getCacheInfo() {
    return {
      hasData: this.cachedData !== null,
      dataPoints: this.cachedData?.length || 0,
      age: this.cachedData ? Date.now() - this.cacheTimestamp : 0,
      isValid: this.isCacheValid(),
      dataSource: this.currentDataSource,
      isLoading: this.isLoading,
    };
  }
}

// Exportiere Singleton-Instanz
export const energyDataManager = EnergyDataManager.getInstance();

// Legacy-Funktionen für Abwärtskompatibilität
export async function fetchEnergyData(postalCode?: string): Promise<EnergyData[]> {
  return energyDataManager.loadEnergyData(postalCode);
}

export function getCurrentDataSource(): DataSource {
  return energyDataManager.getCurrentDataSource();
}

export function generateMockData(): EnergyData[] {
  return energyDataManager['generateMockData']();
}