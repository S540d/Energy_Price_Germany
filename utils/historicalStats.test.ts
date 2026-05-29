import { computeHistoricalStats } from './historicalStats';
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

describe('computeHistoricalStats', () => {
  it('returns null series for empty data', () => {
    const stats = computeHistoricalStats([]);
    expect(stats.count).toBe(0);
    expect(stats.price).toBeNull();
    expect(stats.renewable).toBeNull();
  });

  it('computes avg/min/max/median in ¢/kWh for price', () => {
    // Marktpreise (EUR/MWh): 100, 200, 300 -> ¢/kWh: 10, 20, 30
    const data = [point(3000, 300, 30), point(1000, 100, 50), point(2000, 200, 40)];
    const stats = computeHistoricalStats(data);

    expect(stats.count).toBe(3);
    expect(stats.price?.avg).toBeCloseTo(20);
    expect(stats.price?.min.value).toBeCloseTo(10);
    expect(stats.price?.min.timestamp).toBe(1000);
    expect(stats.price?.max.value).toBeCloseTo(30);
    expect(stats.price?.max.timestamp).toBe(3000);
    expect(stats.price?.median).toBeCloseTo(20);
  });

  it('computes renewable stats and ignores null values', () => {
    const data = [point(1000, null, 40), point(2000, null, 60), point(3000, null, null)];
    const stats = computeHistoricalStats(data);
    expect(stats.price).toBeNull();
    expect(stats.renewable?.avg).toBeCloseTo(50);
    expect(stats.renewable?.min.value).toBe(40);
    expect(stats.renewable?.max.value).toBe(60);
  });

  it('detects an upward trend', () => {
    const data = [
      point(1000, 100, 10),
      point(2000, 110, 12),
      point(3000, 300, 80),
      point(4000, 320, 82),
    ];
    const stats = computeHistoricalStats(data);
    expect(stats.price?.trend).toBe('up');
    expect(stats.renewable?.trend).toBe('up');
  });

  it('detects a flat trend for stable values', () => {
    const data = [
      point(1000, 200, 50),
      point(2000, 201, 50),
      point(3000, 199, 50),
      point(4000, 200, 50),
    ];
    const stats = computeHistoricalStats(data);
    expect(stats.price?.trend).toBe('flat');
    expect(stats.renewable?.trend).toBe('flat');
  });
});
