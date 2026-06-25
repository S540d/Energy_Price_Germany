import type { EnergyData } from '../utils/metrics';
import { Platform } from 'react-native';
import { isValidPostalCode } from '../utils/postalCodeUtils';
import { validateMarketDataResponse, fetchWithTimeout } from '../utils/apiValidation';
import { RegionalDataCache } from './regionalDataCache';
import { mergeRegionalData } from './dataMerger';
import { historicalDataStoreForCountry } from './historicalDataStore';
import type { CountryCode } from '../utils/countries';
import { COUNTRIES, DEFAULT_COUNTRY } from '../utils/countries';

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
  // Country the cached data belongs to – switching country invalidates the cache.
  private dataCountry: CountryCode | null = null;
  private currentDataSource: DataSource = 'none';
  private isLoading: boolean = false;
  private loadingPromise: Promise<EnergyData[]> | null = null;
  // Scope of the in-flight load – an identical request may de-dupe onto the
  // running promise, but a request for a DIFFERENT country/postal code must not
  // (otherwise the initial DE load would hand its data back to an NL request).
  private loadingCountry: CountryCode | null = null;
  private loadingPostalCode: string | undefined = undefined;

  // Regional data cache (delegated to dedicated module)
  private regionalCache = new RegionalDataCache();

  // Nutzer-konfiguriertes Limit für die persistente Historie (Bytes).
  // Wird von der App nach dem Laden der Einstellungen gesetzt (#307).
  private historyLimitBytes: number | undefined = undefined;

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
  private async fetchRawData(country: CountryCode): Promise<MarketDataResponse> {
    // Cache-busting Parameter
    const cacheBust = Date.now();

    // Country-specific data path (Germany stays on legacy flat path).
    const dataPath = COUNTRIES[country].marketDataPath;

    // For native apps, use full URL; for web, use relative path
    const dataUrl =
      Platform.OS === 'web'
        ? `./${dataPath}?v=${cacheBust}`
        : `https://s540d.github.io/Energy_Price_Germany/${dataPath}?v=${cacheBust}`;

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
  public generateMockData(): EnergyData[] {
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
   * @param country Active country (determines data source + regional availability)
   * @param postalCode Optional postal code for regional data (DE only)
   */
  public async loadEnergyData(
    country: CountryCode = DEFAULT_COUNTRY,
    postalCode?: string
  ): Promise<EnergyData[]> {
    // Wenn bereits ein Ladevorgang läuft: nur dann darauf warten, wenn es
    // exakt dieselbe Anfrage ist (gleiches Land + PLZ). Eine Anfrage für ein
    // ANDERES Land darf nicht das laufende Promise zurückbekommen – sonst gibt
    // der initiale DE-Ladevorgang (Default, solange das persistierte Land noch
    // lädt) seine deutschen Daten an eine NL-Anfrage zurück.
    if (this.isLoading && this.loadingPromise) {
      if (this.loadingCountry === country && this.loadingPostalCode === postalCode) {
        return this.loadingPromise;
      }
      // Anderer Ladevorgang in flight – erst abwarten (dessen Cache-Write
      // abschließen lassen), dann einen frischen, korrekt zugeordneten starten.
      try {
        await this.loadingPromise;
      } catch {
        // egal – wir laden unten ohnehin neu
      }
    }

    const regionalEnabled = COUNTRIES[country].hasRegionalData;

    // Prüfe Cache – nur gültig, wenn er zum selben Land gehört
    if (this.dataCountry === country && this.isCacheValid()) {
      // If postal code is provided (regional countries only), merge regional data
      if (regionalEnabled && isValidPostalCode(postalCode) && postalCode) {
        const regionalData = await this.regionalCache.fetchRegionalData(postalCode);
        if (regionalData && this.cachedData) {
          return mergeRegionalData(this.cachedData, regionalData);
        }
      }

      return this.cachedData ?? [];
    }

    // Starte Ladevorgang
    this.isLoading = true;
    this.loadingCountry = country;
    this.loadingPostalCode = postalCode;
    const promise = this.performDataLoad(country, postalCode);
    this.loadingPromise = promise;

    try {
      return await promise;
    } finally {
      // Nur aufräumen, wenn unser Promise noch das aktuelle ist (ein neuerer
      // Ladevorgang könnte es bereits ersetzt haben).
      if (this.loadingPromise === promise) {
        this.isLoading = false;
        this.loadingPromise = null;
        this.loadingCountry = null;
        this.loadingPostalCode = undefined;
      }
    }
  }

  /**
   * Führt den eigentlichen Datenlade-Vorgang aus
   */
  private async performDataLoad(country: CountryCode, postalCode?: string): Promise<EnergyData[]> {
    const regionalEnabled = COUNTRIES[country].hasRegionalData;
    try {
      const rawData = await this.fetchRawData(country);
      let processedData = this.processRawData(rawData);

      // Cache die verarbeiteten Daten
      this.cachedData = processedData;
      this.cacheTimestamp = Date.now();
      this.dataCountry = country;

      // Persistente Historie aktualisieren (fire-and-forget, nationale Daten) – #307.
      // Per Microtask verzögert, damit das Snapshotting nicht mit den
      // Storage-Lesezugriffen des Regional-Caches im selben Tick verschachtelt.
      // Länder-namespaced seit #356 Step 3: jedes Land schreibt in eigene Keys.
      Promise.resolve()
        .then(() =>
          historicalDataStoreForCountry(country).recordSnapshot(
            processedData,
            this.historyLimitBytes
          )
        )
        .catch(() => {});

      // If postal code is provided (regional countries only), fetch + merge regional data
      if (regionalEnabled && isValidPostalCode(postalCode) && postalCode) {
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
      this.dataCountry = country;

      return mockData;
    }
  }

  /**
   * Setzt das Speicher-Limit (Bytes) für die persistente Historie (#307).
   * Wird von der App gesetzt, sobald die Einstellungen geladen sind.
   */
  public setHistoryLimitBytes(bytes: number): void {
    this.historyLimitBytes = bytes;
  }

  /**
   * Invalidiert den Cache (für manuelles Neuladen)
   */
  public invalidateCache(): void {
    this.cachedData = null;
    this.cacheTimestamp = 0;
    this.dataCountry = null;
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
export async function fetchEnergyData(
  country: CountryCode = DEFAULT_COUNTRY,
  postalCode?: string
): Promise<EnergyData[]> {
  return energyDataManager.loadEnergyData(country, postalCode);
}

export function getCurrentDataSource(): DataSource {
  return energyDataManager.getCurrentDataSource();
}

export function generateMockData(): EnergyData[] {
  return energyDataManager.generateMockData();
}
