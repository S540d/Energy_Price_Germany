export type EnergyData = {
  timestamp: number;
  marketPrice: number | null;
  renewableShare: number | null;
  renewableShareRegional?: number | null;
  isMarketPriceInterpolated?: boolean;
  isRenewableShareInterpolated?: boolean;
};

export interface Metrics {
  timeRange: {
    start: number;
    end: number;
  };
  renewable: {
    avg: number;
    min: number;
    max: number;
  };
  marketPrice: {
    avg: number;
    min: number;
    max: number;
  };
  today?: {
    date: string;
    renewable: {
      avg: number;
      min: number;
      max: number;
      current: number | null;
    };
    marketPrice: {
      avg: number;
      min: number;
      max: number;
      current: number | null;
    };
    endCustomerPrice: {
      avg: number;
      min: number;
      max: number;
      current: number | null;
    };
  };
}

// Constants
export const GRID_FEES_AND_TAXES = 20; // Cent/kWh - Netzentgelte und Steuern
const CURRENT_HOUR_TOLERANCE_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Berechnet Metriken aus Energiedaten
 */
export function calculateMetrics(data: EnergyData[]): Metrics | null {
  if (data.length === 0) return null;

  const validRenewableData = data.filter(d => d.renewableShare !== null);
  const validPriceData = data.filter(d => d.marketPrice !== null);

  // Get today's data (current day in local time)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const todayData = data.filter(d => d.timestamp >= todayStart && d.timestamp < todayEnd);
  const todayValidRenewable = todayData.filter(d => d.renewableShare !== null);
  const todayValidPrice = todayData.filter(d => d.marketPrice !== null);

  // Find current hour's data (closest to now)
  const nowMs = now.getTime();
  const currentHourData = data
    .filter(d => Math.abs(d.timestamp - nowMs) < CURRENT_HOUR_TOLERANCE_MS)
    .sort((a, b) => Math.abs(a.timestamp - nowMs) - Math.abs(b.timestamp - nowMs))[0];

  // Calculate today's market price stats (reused for end customer price)
  const todayMarketPriceAvg =
    todayValidPrice.length > 0
      ? todayValidPrice.reduce((sum, d) => sum + (d.marketPrice ?? 0) * 0.1, 0) /
        todayValidPrice.length
      : 0;
  const todayMarketPriceMin =
    todayValidPrice.length > 0
      ? Math.min(...todayValidPrice.map(d => d.marketPrice ?? 0)) * 0.1
      : 0;
  const todayMarketPriceMax =
    todayValidPrice.length > 0
      ? Math.max(...todayValidPrice.map(d => d.marketPrice ?? 0)) * 0.1
      : 0;

  const todayMetrics =
    todayData.length > 0
      ? {
          date: now.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          renewable: {
            avg:
              todayValidRenewable.length > 0
                ? todayValidRenewable.reduce((sum, d) => sum + (d.renewableShare ?? 0), 0) /
                  todayValidRenewable.length
                : 0,
            min:
              todayValidRenewable.length > 0
                ? Math.min(...todayValidRenewable.map(d => d.renewableShare ?? 0))
                : 0,
            max:
              todayValidRenewable.length > 0
                ? Math.max(...todayValidRenewable.map(d => d.renewableShare ?? 0))
                : 0,
            current: currentHourData?.renewableShare ?? null,
          },
          marketPrice: {
            avg: todayMarketPriceAvg,
            min: todayMarketPriceMin,
            max: todayMarketPriceMax,
            current:
              currentHourData?.marketPrice !== null && currentHourData?.marketPrice !== undefined
                ? currentHourData.marketPrice * 0.1
                : null,
          },
          endCustomerPrice: {
            avg: todayMarketPriceAvg + GRID_FEES_AND_TAXES,
            min: todayMarketPriceMin + GRID_FEES_AND_TAXES,
            max: todayMarketPriceMax + GRID_FEES_AND_TAXES,
            current:
              currentHourData?.marketPrice !== null && currentHourData?.marketPrice !== undefined
                ? currentHourData.marketPrice * 0.1 + GRID_FEES_AND_TAXES
                : null,
          },
        }
      : undefined;

  return {
    timeRange: {
      start: Math.min(...data.map(d => d.timestamp)),
      end: Math.max(...data.map(d => d.timestamp)),
    },
    renewable: {
      avg:
        validRenewableData.length > 0
          ? validRenewableData.reduce((sum, d) => sum + (d.renewableShare ?? 0), 0) /
            validRenewableData.length
          : 0,
      min:
        validRenewableData.length > 0
          ? Math.min(...validRenewableData.map(d => d.renewableShare ?? 0))
          : 0,
      max:
        validRenewableData.length > 0
          ? Math.max(...validRenewableData.map(d => d.renewableShare ?? 0))
          : 0,
    },
    marketPrice: {
      avg:
        validPriceData.length > 0
          ? validPriceData.reduce((sum, d) => sum + (d.marketPrice ?? 0) * 0.1, 0) /
            validPriceData.length
          : 0,
      min:
        validPriceData.length > 0
          ? Math.min(...validPriceData.map(d => d.marketPrice ?? 0)) * 0.1
          : 0,
      max:
        validPriceData.length > 0
          ? Math.max(...validPriceData.map(d => d.marketPrice ?? 0)) * 0.1
          : 0,
    },
    today: todayMetrics,
  };
}
