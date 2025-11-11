/**
 * Linearly interpolates missing values in a time series dataset
 * @param data Array of data points with timestamps and potentially null values
 * @returns Data with interpolated values marked
 */

export interface InterpolatedDataPoint {
  timestamp: number;
  marketPrice: number | null;
  renewableShare: number | null;
  isMarketPriceInterpolated?: boolean;
  isRenewableShareInterpolated?: boolean;
}

/**
 * Linear interpolation between two known values
 */
function interpolate(
  value1: number,
  value2: number,
  timestamp1: number,
  timestamp2: number,
  targetTimestamp: number
): number {
  const ratio = (targetTimestamp - timestamp1) / (timestamp2 - timestamp1);
  return value1 + (value2 - value1) * ratio;
}

/**
 * Interpolates missing market price values in the dataset
 */
export function interpolateMarketPrices(
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>
): InterpolatedDataPoint[] {
  const result: InterpolatedDataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    if (current.marketPrice !== null) {
      // Value exists, keep as is
      result.push({
        ...current,
        isMarketPriceInterpolated: false,
        isRenewableShareInterpolated: false,
      });
    } else {
      // Value is missing, try to interpolate
      
      // Find previous non-null value
      let prevIndex = i - 1;
      while (prevIndex >= 0 && data[prevIndex].marketPrice === null) {
        prevIndex--;
      }

      // Find next non-null value
      let nextIndex = i + 1;
      while (nextIndex < data.length && data[nextIndex].marketPrice === null) {
        nextIndex++;
      }

      let interpolatedPrice: number | null = null;
      let isInterpolated = false;

      if (prevIndex >= 0 && nextIndex < data.length) {
        // We have both previous and next values, interpolate
        const prev = data[prevIndex];
        const next = data[nextIndex];
        
        interpolatedPrice = interpolate(
          prev.marketPrice!,
          next.marketPrice!,
          prev.timestamp,
          next.timestamp,
          current.timestamp
        );
        isInterpolated = true;
      } else if (prevIndex >= 0) {
        // Only previous value exists, use forward fill
        interpolatedPrice = data[prevIndex].marketPrice;
        isInterpolated = true;
      } else if (nextIndex < data.length) {
        // Only next value exists, use backward fill
        interpolatedPrice = data[nextIndex].marketPrice;
        isInterpolated = true;
      }
      // else: No surrounding values, keep as null

      result.push({
        timestamp: current.timestamp,
        marketPrice: interpolatedPrice,
        renewableShare: current.renewableShare,
        isMarketPriceInterpolated: isInterpolated,
        isRenewableShareInterpolated: false,
      });
    }
  }

  return result;
}

/**
 * Get statistics about interpolated data
 */
export function getInterpolationStats(data: InterpolatedDataPoint[]): {
  totalPoints: number;
  interpolatedMarketPriceCount: number;
  missingMarketPriceCount: number;
} {
  const totalPoints = data.length;
  const interpolatedMarketPriceCount = data.filter(d => d.isMarketPriceInterpolated).length;
  const missingMarketPriceCount = data.filter(d => d.marketPrice === null).length;

  return {
    totalPoints,
    interpolatedMarketPriceCount,
    missingMarketPriceCount,
  };
}
