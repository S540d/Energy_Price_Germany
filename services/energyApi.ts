// Cache für API-Daten (15 Minuten) - in-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
let dataSource: 'energy-charts' | 'awattar' | 'none' = 'none';
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minuten in Millisekunden

// Gibt die aktuelle Datenquelle zurück
export function getCurrentDataSource(): 'energy-charts' | 'awattar' | 'none' {
  return dataSource;
}

// Fetch real data from marketdata.json with caching
export async function fetchEnergyData() {
  // Prüfe In-Memory Cache
  const age = Date.now() - cacheTimestamp;
  if (cachedData && age < CACHE_DURATION) {
    console.log('Using cached energy data (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
    return cachedData;
  }

  try {
    console.log('Loading energy data from marketdata.json...');
    
    // Primäre Datenquelle: marketdata.json (wird täglich vom GitHub Actions Workflow aktualisiert)
    const marketResponse = await fetch('/data/marketdata.json');
    if (marketResponse.ok) {
      const marketJson = await marketResponse.json();
      const marketData = marketJson.data.map((item: any) => ({
        timestamp: item.start_timestamp,
        marketPrice: item.marketprice, // Bereits in EUR/MWh
        renewableShare: null
      }));
      console.log(`Successfully loaded ${marketData.length} data points from marketdata.json`);
      cachedData = marketData;
      cacheTimestamp = Date.now();
      dataSource = 'awattar';
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
