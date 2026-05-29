import type { EnergyData } from './metrics';

/**
 * Statistik-Auswertung für historische Energiedaten (Issue #3).
 * Reine Funktionen über EnergyData[] – keine Seiteneffekte.
 */

export type Trend = 'up' | 'down' | 'flat';

export interface SeriesStat {
  avg: number;
  min: { value: number; timestamp: number };
  max: { value: number; timestamp: number };
  median: number;
  trend: Trend;
}

export interface HistoricalStats {
  count: number;
  /** Preis in ¢/kWh (Marktpreis), null wenn keine Preisdaten vorhanden. */
  price: SeriesStat | null;
  /** Erneuerbaren-Anteil in %, null wenn keine Daten vorhanden. */
  renewable: SeriesStat | null;
}

interface Point {
  value: number;
  timestamp: number;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeSeries(points: Point[]): SeriesStat | null {
  if (points.length === 0) return null;

  const values = points.map(p => p.value);
  const avg = average(values);

  let min = points[0];
  let max = points[0];
  for (const p of points) {
    if (p.value < min.value) min = p;
    if (p.value > max.value) max = p;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Trend: Mittelwert der ersten vs. zweiten Hälfte (Schwelle: 5% des Mittels)
  let trend: Trend = 'flat';
  const half = Math.floor(points.length / 2);
  if (half > 0) {
    const firstAvg = average(points.slice(0, half).map(p => p.value));
    const secondAvg = average(points.slice(points.length - half).map(p => p.value));
    const diff = secondAvg - firstAvg;
    const threshold = Math.abs(avg) * 0.05;
    if (diff > threshold) trend = 'up';
    else if (diff < -threshold) trend = 'down';
  }

  return {
    avg,
    min: { value: min.value, timestamp: min.timestamp },
    max: { value: max.value, timestamp: max.timestamp },
    median,
    trend,
  };
}

/**
 * Berechnet Preis- und Erneuerbaren-Statistiken über den gegebenen Datensatz.
 * Preis wird in ¢/kWh ausgegeben (Marktpreis * 0.1).
 */
export function computeHistoricalStats(data: EnergyData[]): HistoricalStats {
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);

  const pricePoints: Point[] = [];
  const renewablePoints: Point[] = [];
  for (const d of sorted) {
    if (d.marketPrice !== null && d.marketPrice !== undefined) {
      pricePoints.push({ value: d.marketPrice * 0.1, timestamp: d.timestamp });
    }
    if (d.renewableShare !== null && d.renewableShare !== undefined) {
      renewablePoints.push({ value: d.renewableShare, timestamp: d.timestamp });
    }
  }

  return {
    count: sorted.length,
    price: computeSeries(pricePoints),
    renewable: computeSeries(renewablePoints),
  };
}
