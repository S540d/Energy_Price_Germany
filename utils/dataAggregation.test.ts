import { aggregateEnergyData } from './dataAggregation';
import type { EnergyData } from './metrics';

function point(ts: number, marketPrice: number | null, renewableShare: number | null): EnergyData {
  return {
    timestamp: ts,
    marketPrice,
    renewableShare,
    isMarketPriceInterpolated: false,
    isRenewableShareInterpolated: false,
  };
}

const HOUR = 3_600_000;

describe('aggregateEnergyData', () => {
  it('returns data unchanged for non-positive bucket size', () => {
    const data = [point(0, 10, 20)];
    expect(aggregateEnergyData(data, 0)).toBe(data);
  });

  it('averages points within the same hour bucket', () => {
    const base = HOUR; // bucket-aligned
    const data = [
      point(base, 100, 40),
      point(base + 15 * 60_000, 200, 60),
      point(base + HOUR, 300, 80), // next bucket
    ];
    const result = aggregateEnergyData(data, HOUR);

    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(base);
    expect(result[0].marketPrice).toBeCloseTo(150);
    expect(result[0].renewableShare).toBeCloseTo(50);
    expect(result[1].marketPrice).toBeCloseTo(300);
  });

  it('keeps null when no valid values in a bucket and sorts output', () => {
    const data = [point(2 * HOUR, null, null), point(HOUR, 100, 50)];
    const result = aggregateEnergyData(data, HOUR);
    expect(result[0].timestamp).toBe(HOUR);
    expect(result[1].marketPrice).toBeNull();
    expect(result[1].renewableShare).toBeNull();
  });
});
