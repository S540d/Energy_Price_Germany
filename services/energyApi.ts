// Cache für API-Daten (3 Stunden) - in-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 Stunden in Millisekunden

// Fetch real data from Energy Charts API with caching
export async function fetchEnergyData() {
  // Prüfe In-Memory Cache
  const age = Date.now() - cacheTimestamp;
  if (cachedData && age < CACHE_DURATION) {
    console.log('Using cached energy data (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
    return cachedData;
  }

  // Daten von API abrufen (via CORS-Proxy)
  console.log('Fetching fresh energy data from API...');
  const now = Date.now();

  // CORS-Proxy um die API-Blockierung zu umgehen
  const CORS_PROXY = 'https://corsproxy.io/?';

  try {
    const [priceRes, renewableRes] = await Promise.all([
      fetch(`${CORS_PROXY}${encodeURIComponent(`https://api.energy-charts.info/price?country=de&_t=${now}`)}`),
      fetch(`${CORS_PROXY}${encodeURIComponent(`https://api.energy-charts.info/ren_share_forecast?country=de&_t=${now}`)}`)
    ]);

    console.log('Price API status:', priceRes.status, priceRes.statusText);
    console.log('Renewable API status:', renewableRes.status, renewableRes.statusText);

    if (!priceRes.ok || !renewableRes.ok) {
      throw new Error(`API request failed - Price: ${priceRes.status}, Renewable: ${renewableRes.status}`);
    }

    const priceData = await priceRes.json();
    const renewableData = await renewableRes.json();

    console.log('Price data points:', priceData.unix_seconds?.length || 0);
    console.log('Renewable data points:', renewableData.unix_seconds?.length || 0);

    const dataMap = new Map();
    priceData.unix_seconds.forEach((ts: number, i: number) => {
      dataMap.set(ts * 1000, { timestamp: ts * 1000, marketPrice: priceData.price[i], renewableShare: null });
    });
    renewableData.unix_seconds.forEach((ts: number, i: number) => {
      const existing = dataMap.get(ts * 1000);
      if (existing) existing.renewableShare = renewableData.ren_share[i];
      else dataMap.set(ts * 1000, { timestamp: ts * 1000, marketPrice: null, renewableShare: renewableData.ren_share[i] });
    });

    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Speichere in In-Memory Cache
    cachedData = result;
    cacheTimestamp = Date.now();
    console.log('Cached fresh energy data:', result.length, 'data points');

    return result;
  } catch (error) {
    console.error('Detailed fetch error:', error);
    throw error;
  }
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
