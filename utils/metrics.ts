export type EnergyData = {
  timestamp: number;
  marketPrice: number | null;
  renewableShare: number | null;
  isMarketPriceInterpolated?: boolean;
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
}

/**
 * Berechnet Metriken aus Energiedaten
 */
export function calculateMetrics(data: EnergyData[]): Metrics | null {
  if (data.length === 0) return null;

  const validRenewableData = data.filter(d => d.renewableShare !== null);
  const validPriceData = data.filter(d => d.marketPrice !== null);

  return {
    timeRange: {
      start: Math.min(...data.map(d => d.timestamp)),
      end: Math.max(...data.map(d => d.timestamp)),
    },
    renewable: {
      avg: validRenewableData.length > 0
        ? validRenewableData.reduce((sum, d) => sum + d.renewableShare!, 0) / validRenewableData.length
        : 0,
      min: validRenewableData.length > 0
        ? Math.min(...validRenewableData.map(d => d.renewableShare!))
        : 0,
      max: validRenewableData.length > 0
        ? Math.max(...validRenewableData.map(d => d.renewableShare!))
        : 0,
    },
    marketPrice: {
      avg: validPriceData.length > 0
        ? validPriceData.reduce((sum, d) => sum + d.marketPrice! * 0.1, 0) / validPriceData.length
        : 0,
      min: validPriceData.length > 0
        ? Math.min(...validPriceData.map(d => d.marketPrice!)) * 0.1
        : 0,
      max: validPriceData.length > 0
        ? Math.max(...validPriceData.map(d => d.marketPrice!)) * 0.1
        : 0,
    },
  };
}