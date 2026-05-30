import { computeHistoricalStats, computePeriodComparison } from './historicalStats';
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

describe('computePeriodComparison', () => {
  it('returns null series when a period has no data', () => {
    const result = computePeriodComparison([point(1000, 100, 40)], []);
    expect(result.price).toBeNull();
    expect(result.renewable).toBeNull();
  });

  it('computes absolute and percentage delta of the averages', () => {
    // current price avg (¢/kWh): (10 + 30)/2 = 20 ; previous: (10 + 10)/2 = 10
    const current = [point(3000, 100, 60), point(4000, 300, 80)];
    const previous = [point(1000, 100, 40), point(2000, 100, 40)];
    const result = computePeriodComparison(current, previous);

    expect(result.price?.currentAvg).toBeCloseTo(20);
    expect(result.price?.previousAvg).toBeCloseTo(10);
    expect(result.price?.deltaAbs).toBeCloseTo(10);
    expect(result.price?.deltaPct).toBeCloseTo(100);
    expect(result.price?.direction).toBe('up');

    // renewable: current avg 70, previous 40 -> +30, +75%
    expect(result.renewable?.deltaAbs).toBeCloseTo(30);
    expect(result.renewable?.deltaPct).toBeCloseTo(75);
    expect(result.renewable?.direction).toBe('up');
  });

  it('reports a downward direction', () => {
    const current = [point(3000, 100, 30)];
    const previous = [point(1000, 300, 90)];
    const result = computePeriodComparison(current, previous);
    expect(result.price?.direction).toBe('down');
    expect(result.renewable?.direction).toBe('down');
  });

  it('reports flat for sub-0.5% change and null deltaPct when previous avg is 0', () => {
    const current = [point(3000, 1000, 50.1)];
    const previous = [point(1000, 1000, 50.0)];
    const flat = computePeriodComparison(current, previous);
    expect(flat.price?.direction).toBe('flat');

    // previous renewable avg 0 -> deltaPct null, direction by absolute sign
    const zeroPrev = computePeriodComparison([point(2, 100, 5)], [point(1, 100, 0)]);
    expect(zeroPrev.renewable?.deltaPct).toBeNull();
    expect(zeroPrev.renewable?.direction).toBe('up');
  });
});
