import type { EnergyData } from '../utils/metrics';
import { Platform } from 'react-native';
import { isValidPostalCode } from '../utils/postalCodeUtils';
import { validateMarketDataResponse, fetchWithTimeout } from '../utils/apiValidation';
import { RegionalDataCache } from './regionalDataCache';
import { mergeRegionalData } from './dataMerger';

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
 * Cache-Konfiguration
 */
interface CacheConfig {
  duration: number; // in Millisekunden
  maxAge: number; // maximale Cache-Alter in Millisekunden
}

/**
 * Daten-Manager für Energie-Daten
 * Orchestrates data loading, processing, and caching
 */
export class EnergyDataManager {
  private static instance: EnergyDataManager;
  private cachedData: EnergyData[] | null = null;
  private cacheTimestamp: number = 0;
  private currentDataSource: DataSource = 'none';
  private isLoading: boolean = false;
  private loadingPromise: Promise<EnergyData[]> | null = null;

  // Regional data cache (delegated to dedicated module)
  private regionalCache = new RegionalDataCache();

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
   * Lädt Rohdaten von der API
   * Includes timeout protection and response validation
   */
  private async fetchRawData(): Promise<MarketDataResponse> {
    // Cache-busting Parameter
    const cacheBust = Date.now();

    // For native apps, use full URL; for web, use relative path
    const dataUrl =
      Platform.OS === 'web'
        ? `./data/marketdata.json?v=${cacheBust}`
        : `https://s540d.github.io/Energy_Price_Germany/data/marketdata.json?v=${cacheBust}`;

    const response = await fetchWithTimeout(dataUrl, {}, 10000);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return validateMarketDataResponse(data);
  }

  /**
   * Verarbeitet Rohdaten in das interne Format
   */
  private processRawData(rawData: MarketDataResponse): EnergyData[] {
    if (!rawData.data || !Array.isArray(rawData.data)) {
      return [];
    }

    // Bestimme Datenquelle
    const source = rawData.source || 'awattar';
    this.currentDataSource = source === 'energy-charts' ? 'energy-charts' : 'awattar';

    return rawData.data.map(item => {
      const isInterpolated = item.interpolated || false;
      return {
        timestamp: item.start_timestamp,
        marketPrice: item.marketprice ?? null,
        renewableShare: item.renewable_share ?? null,
        isMarketPriceInterpolated: isInterpolated,
        isRenewableShareInterpolated: false,
      };
    });
  }

  /**
   * Generiert Mock-Daten für Fallback
   */
  private generateMockData(): EnergyData[] {
    const mockData: EnergyData[] = [];
    const now = Date.now();

    for (let i = 0; i < 96; i++) {
      const hour = i / 4;
      mockData.push({
        timestamp: now - (96 - i) * 15 * 60 * 1000,
        marketPrice: 30 + Math.sin((hour / 24) * Math.PI * 2) * 20 + Math.random() * 10,
        renewableShare: 60 + Math.sin(((hour - 6) / 24) * Math.PI * 2) * 30 + Math.random() * 10,
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
      // If postal code is provided, merge regional data
      if (isValidPostalCode(postalCode) && postalCode) {
        const regionalData = await this.regionalCache.fetchRegionalData(postalCode);
        if (regionalData && this.cachedData) {
          return mergeRegionalData(this.cachedData, regionalData);
        }
      }

      return this.cachedData ?? [];
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
      const rawData = await this.fetchRawData();
      let processedData = this.processRawData(rawData);

      // Cache die verarbeiteten Daten
      this.cachedData = processedData;
      this.cacheTimestamp = Date.now();

      // If postal code is provided, fetch and merge regional data
      if (isValidPostalCode(postalCode) && postalCode) {
        const regionalData = await this.regionalCache.fetchRegionalData(postalCode);
        if (regionalData) {
          processedData = mergeRegionalData(processedData, regionalData);
        }
      }

      return processedData;
    } catch {
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
  }

  /**
   * Invalidates regional cache (both memory and persistent storage)
   * Called when postal code changes
   */
  public async invalidateRegionalCache(): Promise<void> {
    await this.regionalCache.invalidate();
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
  return energyDataManager.generateMockData();
}
