// Cache für API-Daten (3 Stunden) - in-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
let dataSource: 'energy-charts' | 'awattar' | 'none' = 'none';
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 Stunden in Millisekunden

// Gibt die aktuelle Datenquelle zurück
export function getCurrentDataSource(): 'energy-charts' | 'awattar' | 'none' {
  return dataSource;
}

// Fetch real data from Energy Charts API with caching
export async function fetchEnergyData() {
  // Prüfe In-Memory Cache
  const age = Date.now() - cacheTimestamp;
  if (cachedData && age < CACHE_DURATION) {
    console.log('Using cached energy data (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
    return cachedData;
  }

  try {
    console.log('Fetching real energy data from Energy Charts API...');

    // Hole aktuelle Zeit und berechne Zeitbereich (letzte 24 Stunden)
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (24 * 60 * 60); // 24 Stunden zurück

    // API-Endpunkte für Energy Charts
    const renewableUrl = `https://api.energy-charts.info/renewable_power?country=de&start=${startTime}&end=${endTime}`;
    const priceUrl = `https://api.energy-charts.info/price_spot_market?country=de&start=${startTime}&end=${endTime}`;

    let renewableData = null;
    let priceData = null;

    try {
      console.log('Fetching renewable data...');
      const renewableResponse = await fetch(renewableUrl);
      if (renewableResponse.ok) {
        renewableData = await renewableResponse.json();
        console.log(`Successfully loaded renewable data: ${renewableData?.data?.length || 0} points`);
      } else {
        console.log(`Renewable API failed with status: ${renewableResponse.status}`);
      }
    } catch (error) {
      console.log('Error fetching renewable data:', error);
    }

    try {
      console.log('Fetching price data...');
      const priceResponse = await fetch(priceUrl);
      if (priceResponse.ok) {
        priceData = await priceResponse.json();
        console.log(`Successfully loaded price data: ${priceData?.data?.length || 0} points`);
      } else {
        console.log(`Price API failed with status: ${priceResponse.status}`);
      }
    } catch (error) {
      console.log('Error fetching price data:', error);
    }

    // Kombiniere die verfügbaren Daten
    const combinedData = combineEnergyData(renewableData, priceData);

    if (combinedData.length === 0) {
      console.log('No real data available from APIs, trying marketdata.json fallback...');
      // Fallback auf marketdata.json für Preise, wenn keine API-Daten verfügbar
      try {
        const marketResponse = await fetch('/data/marketdata.json');
        if (marketResponse.ok) {
          const marketJson = await marketResponse.json();
          const fallbackData = marketJson.data.map((item: any) => ({
            timestamp: item.start_timestamp,
            marketPrice: item.marketprice, // Bereits in EUR/MWh
            renewableShare: null
          }));
          console.log(`Using marketdata.json fallback: ${fallbackData.length} data points`);
          cachedData = fallbackData;
          cacheTimestamp = Date.now();
          dataSource = 'awattar';
          return fallbackData;
        }
      } catch (fallbackError) {
        console.log('marketdata.json fallback also failed:', fallbackError);
      }

      // Wenn gar keine Daten verfügbar sind, leeres Array zurückgeben
      console.log('No data available from any source');
      cachedData = [];
      cacheTimestamp = Date.now();
      dataSource = 'none';
      return [];
    }

    console.log(`Successfully loaded ${combinedData.length} real data points`);
    cachedData = combinedData;
    cacheTimestamp = Date.now();
    dataSource = 'energy-charts';
    return combinedData;

  } catch (error) {
    console.error('Failed to fetch any data:', error);

    // Versuche marketdata.json als letzten Fallback
    try {
      const marketResponse = await fetch('/data/marketdata.json');
      if (marketResponse.ok) {
        const marketJson = await marketResponse.json();
        const fallbackData = marketJson.data.map((item: any) => ({
          timestamp: item.start_timestamp,
          marketPrice: item.marketprice,
          renewableShare: null
        }));
        console.log(`Using marketdata.json fallback after error: ${fallbackData.length} data points`);
        cachedData = fallbackData;
        cacheTimestamp = Date.now();
        dataSource = 'awattar';
        return fallbackData;
      }
    } catch (fallbackError) {
      console.log('All data sources failed');
    }

    // Keine Daten verfügbar
    cachedData = [];
    cacheTimestamp = Date.now();
    dataSource = 'none';
    return [];
  }
}

// Hilfsfunktion zum Kombinieren der API-Daten
function combineEnergyData(renewableData: any, priceData: any) {
  const combined = new Map<number, { timestamp: number; renewableShare: number | null; marketPrice: number | null }>();

  // Verarbeite Erneuerbare Energien Daten
  if (renewableData && renewableData.data && Array.isArray(renewableData.data)) {
    renewableData.data.forEach((item: any) => {
      if (item.timestamp && typeof item.renewable_share === 'number') {
        combined.set(item.timestamp, {
          timestamp: item.timestamp * 1000, // API gibt Sekunden zurück, wir brauchen Millisekunden
          renewableShare: item.renewable_share,
          marketPrice: null
        });
      }
    });
  }

  // Verarbeite Preisdaten
  if (priceData && priceData.data && Array.isArray(priceData.data)) {
    priceData.data.forEach((item: any) => {
      if (item.timestamp && typeof item.price === 'number') {
        const existing = combined.get(item.timestamp);
        if (existing) {
          existing.marketPrice = item.price / 10; // EUR/MWh zu Cent/kWh konvertieren
        } else {
          combined.set(item.timestamp, {
            timestamp: item.timestamp * 1000,
            renewableShare: null,
            marketPrice: item.price / 10
          });
        }
      }
    });
  }

  // Konvertiere Map zu Array und sortiere nach Zeitstempel
  return Array.from(combined.values()).sort((a, b) => a.timestamp - b.timestamp);
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
