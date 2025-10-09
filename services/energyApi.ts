// Cache für API-Daten (15 Minuten) - in-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
let dataSource: 'energy-charts' | 'awattar' | 'none' = 'none';
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minuten in Millisekunden

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

    // Hole aktuelle Zeit und berechne Zeitbereich (letzte 48 Stunden)
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (48 * 60 * 60); // 48 Stunden zurück

    // API-Endpunkte für Energy Charts
    const renewableUrl = `https://api.energy-charts.info/ren_share_forecast?country=de`;
    const priceUrl = `https://api.energy-charts.info/price?country=de`;

    let renewableData = null;
    let priceData = null;

    try {
      console.log('Fetching renewable data...');
      const renewableResponse = await fetch(renewableUrl);
      if (renewableResponse.ok) {
        renewableData = await renewableResponse.json();
        console.log(`Successfully loaded renewable data: ${renewableData?.ren_share?.length || 0} points`);
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
        console.log(`Successfully loaded price data: ${priceData?.price?.length || 0} points`);
      } else {
        console.log(`Price API failed with status: ${priceResponse.status}`);
      }
    } catch (error) {
      console.log('Error fetching price data:', error);
    }

    // Kombiniere die verfügbaren Daten
    const combinedData = combineEnergyDataNew(renewableData, priceData);

    if (combinedData.length > 0) {
      console.log(`Successfully loaded ${combinedData.length} real data points from Energy Charts`);
      cachedData = combinedData;
      cacheTimestamp = Date.now();
      dataSource = 'energy-charts';
      return combinedData;
    }

    // Fallback: Versuche marketdata.json zu laden
    console.log('No data from Energy Charts API, trying marketdata.json fallback...');
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

// Hilfsfunktion zum Kombinieren der neuen API-Daten
function combineEnergyDataNew(renewableData: any, priceData: any) {
  const combined = new Map<number, { timestamp: number; renewableShare: number | null; marketPrice: number | null }>();

  // Verarbeite Erneuerbare Energien Daten (ren_share_forecast)
  if (renewableData && renewableData.unix_seconds && renewableData.ren_share && Array.isArray(renewableData.unix_seconds) && Array.isArray(renewableData.ren_share)) {
    renewableData.unix_seconds.forEach((timestamp: number, index: number) => {
      const share = renewableData.ren_share[index];
      if (typeof share === 'number') {
        combined.set(timestamp, {
          timestamp: timestamp * 1000, // API gibt Sekunden zurück, wir brauchen Millisekunden
          renewableShare: share,
          marketPrice: null
        });
      }
    });
  }

  // Verarbeite Preisdaten (price)
  if (priceData && priceData.unix_seconds && priceData.price && Array.isArray(priceData.unix_seconds) && Array.isArray(priceData.price)) {
    priceData.unix_seconds.forEach((timestamp: number, index: number) => {
      const price = priceData.price[index];
      if (typeof price === 'number') {
        const existing = combined.get(timestamp);
        if (existing) {
          existing.marketPrice = price / 10; // EUR/MWh zu Cent/kWh konvertieren
        } else {
          combined.set(timestamp, {
            timestamp: timestamp * 1000,
            renewableShare: null,
            marketPrice: price / 10
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
