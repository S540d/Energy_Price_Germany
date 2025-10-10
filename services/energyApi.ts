// Cache für API-Daten (15 Minuten) - in-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
let dataSource: 'energy-charts' | 'awattar' | 'none' = 'none';
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minuten in Millisekunden

// Gibt die aktuelle Datenquelle zurück
export function getCurrentDataSource(): 'energy-charts' | 'awattar' | 'none' {
  return dataSource;
}

// Fetch real data with caching - priorisiert Energy Charts, Fallback auf aWATTar
export async function fetchEnergyData() {
  // Prüfe In-Memory Cache
  const age = Date.now() - cacheTimestamp;
  if (cachedData && age < CACHE_DURATION) {
    console.log('Using cached energy data (age: ' + Math.round(age / 1000 / 60) + ' minutes, source: ' + dataSource + ')');
    return cachedData;
  }

  try {
    console.log('Loading energy data from marketdata.json...');

    // Primäre Datenquelle: marketdata.json (wird stündlich vom GitHub Actions Workflow aktualisiert)
    // Enthält priorisiert Energy Charts Daten, bei Ausfall aWATTar (interpoliert)
    const marketResponse = await fetch('/data/marketdata.json');
    if (marketResponse.ok) {
      const marketJson = await marketResponse.json();

      // Bestimme die Datenquelle aus den Metadaten (falls vorhanden)
      const source = marketJson.source || 'awattar';
      dataSource = source === 'energy-charts' ? 'energy-charts' : 'awattar';

      const marketData = marketJson.data.map((item: any) => ({
        timestamp: item.start_timestamp,
        marketPrice: item.marketprice, // Bereits in EUR/MWh
        renewableShare: item.renewable_share || null
      }));

      console.log(`Successfully loaded ${marketData.length} data points from marketdata.json (source: ${dataSource})`);
      cachedData = marketData;
      cacheTimestamp = Date.now();
      return marketData;
    } else {
      console.log(`Failed to load marketdata.json with status: ${marketResponse.status}`);
    }

  } catch (error) {
    console.error('Failed to load marketdata.json:', error);
  }

  // Keine Daten verfügbar
  console.log('No data available from marketdata.json');
  cachedData = [];
  cacheTimestamp = Date.now();
  dataSource = 'none';
  return [];
}

// Mock-Daten Generator für Fallback
export function generateMockData() {
  const mockData = [];
  const now = Date.now();
  for (let i = 0; i < 96; i++) {
    const hour = i / 4;
    mockData.push({
      timestamp: now - (96 - i) * 15 * 60 * 1000,
      marketPrice: 30 + Math.sin(hour / 24 * Math.PI * 2) * 20 + Math.random() * 10,
      renewableShare: 60 + Math.sin((hour - 6) / 24 * Math.PI * 2) * 30 + Math.random() * 10,
    });
  }
  return mockData;
}
