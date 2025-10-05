// Energy Charts API Integration
// Source: https://api.energy-charts.info/

interface PriceResponse {
  unix_seconds: number[];
  price: number[];
}

interface RenewableShareResponse {
  unix_seconds: number[];
  ren_share: number[];
  solar_share?: number[];
  wind_onshore_share?: number[];
  wind_offshore_share?: number[];
}

export interface EnergyDataPoint {
  timestamp: number; // milliseconds
  marketPrice: number | null;
  renewableShare: number | null;
}

const API_BASE = 'https://api.energy-charts.info';

export async function fetchEnergyData(): Promise<EnergyDataPoint[]> {
  try {
    const now = Date.now();

    // Fetch price data
    const priceResponse = await fetch(`${API_BASE}/price?country=de&_t=${now}`);
    const priceData: PriceResponse = await priceResponse.json();

    // Fetch renewable share forecast
    const renewableResponse = await fetch(`${API_BASE}/ren_share_forecast?country=de&_t=${now}`);
    const renewableData: RenewableShareResponse = await renewableResponse.json();

    // Merge data by timestamp
    const dataMap = new Map<number, EnergyDataPoint>();

    // Add price data
    priceData.unix_seconds.forEach((unixSeconds, index) => {
      const timestamp = unixSeconds * 1000; // convert to milliseconds
      dataMap.set(timestamp, {
        timestamp,
        marketPrice: priceData.price[index] || null,
        renewableShare: null,
      });
    });

    // Add renewable data
    renewableData.unix_seconds.forEach((unixSeconds, index) => {
      const timestamp = unixSeconds * 1000;
      const existing = dataMap.get(timestamp);
      if (existing) {
        existing.renewableShare = renewableData.ren_share[index] || null;
      } else {
        dataMap.set(timestamp, {
          timestamp,
          marketPrice: null,
          renewableShare: renewableData.ren_share[index] || null,
        });
      }
    });

    // Convert to array and sort by timestamp
    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Filter to relevant time window (last 6 hours + next 18 hours)
    const sixHoursAgo = now - 6 * 3600000;
    const eighteenHoursLater = now + 18 * 3600000;

    return result.filter(
      (d) => d.timestamp >= sixHoursAgo && d.timestamp <= eighteenHoursLater
    );
  } catch (error) {
    console.error('Failed to fetch energy data:', error);
    throw new Error('Fehler beim Laden der Energiedaten');
  }
}

// Fallback: Generate mock data
export function generateMockData(): EnergyDataPoint[] {
  const data: EnergyDataPoint[] = [];
  const now = Date.now();

  for (let i = -6; i <= 18; i++) {
    const timestamp = now + i * 3600000;
    data.push({
      timestamp,
      marketPrice: 30 + Math.random() * 40 + Math.sin(i / 3) * 15,
      renewableShare: 40 + Math.random() * 30 + Math.cos(i / 4) * 20,
    });
  }

  return data;
}
