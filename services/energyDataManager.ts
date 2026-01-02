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
 * Regional Data Cache Entry
 */
interface RegionalCacheEntry {
  data: RegionalDataResponse;
  timestamp: number;
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
  
  // Regional data cache
  private regionalCache: Map<string, RegionalCacheEntry> = new Map();
  private readonly regionalCacheDuration = 15 * 60 * 1000; // 15 minutes

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
   * Fetches regional renewable data from Energy Charts Signal API
   * @returns Regional data or null if fetch fails
   */
  private async fetchRegionalData(postalCode: string): Promise<RegionalDataResponse | null> {
    try {
      // Check regional cache first
      const cached = this.regionalCache.get(postalCode);
      if (cached && Date.now() - cached.timestamp < this.regionalCacheDuration) {
        logger.debug(`Using cached regional data for PLZ ${postalCode}`);
        return cached.data;
      }

      logger.debug(`Fetching regional data for postal code: ${postalCode}`);
      const url = `https://api.energy-charts.info/signal?country=de&postal_code=${postalCode}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Regional API HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RegionalDataResponse = await response.json();
      logger.debug(`Regional data fetched successfully for PLZ ${postalCode}`);
      
      // Cache the regional data
      this.regionalCache.set(postalCode, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      // Check if it's a CORS error (common on localhost)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('CORS') || errorMessage.includes('Load failed')) {
        logger.warn(
          `⚠️ Regional data blocked by CORS policy. This is expected on localhost. ` +
          `Regional data will work on production (GitHub Pages). PLZ: ${postalCode}`
        );
      } else {
        logger.error(`Failed to fetch regional data for PLZ ${postalCode}:`, error);
      }
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
   * - This allows O(1) lookups when merging data by timestamp
   */
  private mergeRegionalData(nationalData: EnergyData[], regionalData: RegionalDataResponse | null): EnergyData[] {
    if (!regionalData || !regionalData.unix_seconds || !regionalData.share) {
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
      // Create a map of regional data by timestamp for O(1) lookup
      const regionalMap = new Map<number, number>();
      
      // Safe to iterate as we've validated array lengths are equal
      for (let i = 0; i < regionalData.unix_seconds.length; i++) {
        // Convert unix_seconds (from API) to milliseconds (used internally)
        const timestampMs = regionalData.unix_seconds[i] * 1000;
        let share = regionalData.share[i];

        if (share !== null && share !== undefined) {
          // Validate and cap share values to 0-100 range
          // The API sometimes returns values > 100, which we need to cap
          share = Math.max(0, Math.min(100, share));
          regionalMap.set(timestampMs, share);
        }
      }

      logger.debug(`Merging ${regionalMap.size} regional data points into national data`);
      logger.debug(`National data timestamps - first:`, nationalData[0]?.timestamp, 'last:', nationalData[nationalData.length - 1]?.timestamp);
      logger.debug(`Regional data timestamps - first:`, Array.from(regionalMap.keys())[0], 'last:', Array.from(regionalMap.keys()).pop());

      // Merge regional data into national data by matching timestamps
      const merged = nationalData.map(item => {
        const regionalShare = regionalMap.get(item.timestamp);
        return {
          ...item,
          renewableShareRegional: regionalShare !== undefined ? regionalShare : null,
        };
      });

      const matchedCount = merged.filter(item => item.renewableShareRegional !== null).length;
      logger.debug(`Matched ${matchedCount} out of ${nationalData.length} national data points with regional data`);

      return merged;
    } catch (error) {
      logger.error('Error merging regional data:', error);
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