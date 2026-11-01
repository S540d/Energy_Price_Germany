import { calculatePriceTrend } from '../priceTrend';
import type { EnergyData } from '../metrics';

const NOW = new Date(2026, 10, 1, 12, 0);

/** 24 Stundenwerte für den lokalen Tag `dayOffset` mit konstantem Preis (EUR/MWh). */
function day(dayOffset: number, price: number | null, count = 24): EnergyData[] {
  return Array.from({ length: count }, (_, h) => ({
    timestamp: new Date(2026, 10, 1 + dayOffset, h).getTime(),
    marketPrice: price,
    renewableShare: null,
  }));
}

describe('calculatePriceTrend', () => {
  it('erkennt einen günstigeren Folgetag', () => {
    const trend = calculatePriceTrend([...day(0, 100), ...day(1, 60)], NOW);
    expect(trend?.direction).toBe('cheaper');
    expect(trend?.todayAvg).toBeCloseTo(10);
    expect(trend?.tomorrowAvg).toBeCloseTo(6);
    expect(trend?.diff).toBeCloseTo(-4);
  });

  it('erkennt einen teureren Folgetag', () => {
    expect(calculatePriceTrend([...day(0, 60), ...day(1, 100)], NOW)?.direction).toBe('pricier');
  });

  it('meldet „ähnlich“ unterhalb der Schwelle', () => {
    expect(calculatePriceTrend([...day(0, 80), ...day(1, 82)], NOW)?.direction).toBe('similar');
  });

  it('liefert null, wenn morgen noch keine Preise vorliegen', () => {
    expect(calculatePriceTrend(day(0, 80), NOW)).toBeNull();
  });

  it('liefert null bei zu wenigen Punkten für morgen', () => {
    expect(calculatePriceTrend([...day(0, 80), ...day(1, 60, 6)], NOW)).toBeNull();
  });

  it('ignoriert Punkte ohne Preis', () => {
    expect(calculatePriceTrend([...day(0, 80), ...day(1, null)], NOW)).toBeNull();
  });
});
