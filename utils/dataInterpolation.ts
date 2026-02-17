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
 * Interpolates missing values in the dataset for both marketPrice and renewableShare
 */
export function interpolateMarketPrices(
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>
): InterpolatedDataPoint[] {
  const result: InterpolatedDataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    // Interpolate market price
    let interpolatedPrice: number | null = current.marketPrice;
    let isPriceInterpolated = false;

    if (current.marketPrice === null) {
      // Find previous non-null value for marketPrice
      let prevIndex = i - 1;
      while (prevIndex >= 0 && data[prevIndex].marketPrice === null) {
        prevIndex--;
      }

      // Find next non-null value for marketPrice
      let nextIndex = i + 1;
      while (nextIndex < data.length && data[nextIndex].marketPrice === null) {
        nextIndex++;
      }

      if (prevIndex >= 0 && nextIndex < data.length) {
        // We have both previous and next values, interpolate
        const prev = data[prevIndex];
        const next = data[nextIndex];

        interpolatedPrice = interpolate(
          prev.marketPrice ?? 0,
          next.marketPrice ?? 0,
          prev.timestamp,
          next.timestamp,
          current.timestamp
        );
        isPriceInterpolated = true;
      } else if (prevIndex >= 0) {
        // Only previous value exists, use forward fill
        interpolatedPrice = data[prevIndex].marketPrice;
        isPriceInterpolated = true;
      } else if (nextIndex < data.length) {
        // Only next value exists, use backward fill
        interpolatedPrice = data[nextIndex].marketPrice;
        isPriceInterpolated = true;
      }
    }

    // Interpolate renewable share
    let interpolatedRenewableShare: number | null = current.renewableShare;
    let isRenewableShareInterpolated = false;

    if (current.renewableShare === null) {
      // Find previous non-null value for renewableShare
      let prevIndex = i - 1;
      while (prevIndex >= 0 && data[prevIndex].renewableShare === null) {
        prevIndex--;
      }

      // Find next non-null value for renewableShare
      let nextIndex = i + 1;
      while (nextIndex < data.length && data[nextIndex].renewableShare === null) {
        nextIndex++;
      }

      if (prevIndex >= 0 && nextIndex < data.length) {
        // We have both previous and next values, interpolate
        const prev = data[prevIndex];
        const next = data[nextIndex];

        interpolatedRenewableShare = interpolate(
          prev.renewableShare ?? 0,
          next.renewableShare ?? 0,
          prev.timestamp,
          next.timestamp,
          current.timestamp
        );
        isRenewableShareInterpolated = true;
      } else if (prevIndex >= 0) {
        // Only previous value exists, use forward fill
        interpolatedRenewableShare = data[prevIndex].renewableShare;
        isRenewableShareInterpolated = true;
      } else if (nextIndex < data.length) {
        // Only next value exists, use backward fill
        interpolatedRenewableShare = data[nextIndex].renewableShare;
        isRenewableShareInterpolated = true;
      }
    }

    result.push({
      timestamp: current.timestamp,
      marketPrice: interpolatedPrice,
      renewableShare: interpolatedRenewableShare,
      isMarketPriceInterpolated: isPriceInterpolated,
      isRenewableShareInterpolated: isRenewableShareInterpolated,
    });
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
  interpolatedRenewableShareCount: number;
  missingRenewableShareCount: number;
} {
  const totalPoints = data.length;
  const interpolatedMarketPriceCount = data.filter(d => d.isMarketPriceInterpolated).length;
  const missingMarketPriceCount = data.filter(d => d.marketPrice === null).length;
  const interpolatedRenewableShareCount = data.filter(d => d.isRenewableShareInterpolated).length;
  const missingRenewableShareCount = data.filter(d => d.renewableShare === null).length;

  return {
    totalPoints,
    interpolatedMarketPriceCount,
    missingMarketPriceCount,
    interpolatedRenewableShareCount,
    missingRenewableShareCount,
  };
}
