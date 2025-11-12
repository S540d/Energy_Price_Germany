import { EnergyData } from '../utils/metrics';

/**
 * Datenquelle-Typen
 */
export type DataSource = 'energy-charts' | 'awattar' | 'none';

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
   */
  private async fetchRawData(): Promise<any> {
    try {
      console.log('Loading energy data from marketdata.json...');

      // Cache-busting Parameter hinzufügen
      const cacheBust = Date.now();
      // Use relative path to work with GitHub Pages baseUrl
      const response = await fetch(`./data/marketdata.json?v=${cacheBust}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Successfully loaded raw data with ${data.data?.length || 0} entries`);
      return data;
    } catch (error) {
      console.error('Failed to load marketdata.json:', error);
      throw error;
    }
  }

  /**
   * Verarbeitet Rohdaten in das interne Format
   */
  private processRawData(rawData: any): EnergyData[] {
    if (!rawData.data || !Array.isArray(rawData.data)) {
      console.warn('Invalid data format received');
      return [];
    }

    // Bestimme Datenquelle
    const source = rawData.source || 'awattar';
    this.currentDataSource = source === 'energy-charts' ? 'energy-charts' : 'awattar';

    // Transformiere Daten
    const processedData: EnergyData[] = rawData.data.map((item: any) => ({
      timestamp: item.start_timestamp,
      marketPrice: item.marketprice || null, // EUR/MWh
      renewableShare: item.renewable_share || null, // Prozent
      isMarketPriceInterpolated: item.interpolated || false
    }));

    console.log(`Processed ${processedData.length} data points (source: ${this.currentDataSource})`);
    return processedData;
  }

  /**
   * Generiert Mock-Daten für Fallback
   */
  private generateMockData(): EnergyData[] {
    console.log('Generating mock data as fallback');
    const mockData: EnergyData[] = [];
    const now = Date.now();

    for (let i = 0; i < 96; i++) {
      const hour = i / 4;
      mockData.push({
        timestamp: now - (96 - i) * 15 * 60 * 1000,
        marketPrice: 30 + Math.sin(hour / 24 * Math.PI * 2) * 20 + Math.random() * 10,
        renewableShare: 60 + Math.sin((hour - 6) / 24 * Math.PI * 2) * 30 + Math.random() * 10,
      });
    }

    this.currentDataSource = 'none';
    return mockData;
  }

  /**
   * Lädt und verarbeitet Energiedaten
   * Verwendet Cache wenn verfügbar und gültig
   */
  public async loadEnergyData(): Promise<EnergyData[]> {
    // Wenn bereits ein Ladevorgang läuft, warte darauf
    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    // Prüfe Cache
    if (this.isCacheValid()) {
      const age = Date.now() - this.cacheTimestamp;
      console.log(`Using cached energy data (age: ${Math.round(age / 1000 / 60)} minutes, source: ${this.currentDataSource})`);
      return this.cachedData!;
    }

    // Starte Ladevorgang
    this.isLoading = true;
    this.loadingPromise = this.performDataLoad();

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
  private async performDataLoad(): Promise<EnergyData[]> {
    try {
      // Lade Rohdaten
      const rawData = await this.fetchRawData();

      // Verarbeite Daten
      const processedData = this.processRawData(rawData);

      // Cache die verarbeiteten Daten
      this.cachedData = processedData;
      this.cacheTimestamp = Date.now();

      return processedData;

    } catch (error) {
      console.error('Data loading failed, using mock data:', error);

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
    console.log('Cache invalidated');
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
export async function fetchEnergyData(): Promise<EnergyData[]> {
  return energyDataManager.loadEnergyData();
}

export function getCurrentDataSource(): DataSource {
  return energyDataManager.getCurrentDataSource();
}

export function generateMockData(): EnergyData[] {
  return energyDataManager['generateMockData']();
}