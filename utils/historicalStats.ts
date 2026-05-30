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
 * Vergleich einer Serie (Preis oder Erneuerbare) zwischen aktueller und
 * vorangegangener Periode (Issue #311).
 */
export interface SeriesComparison {
  currentAvg: number;
  previousAvg: number;
  /** currentAvg - previousAvg (gleiche Einheit wie die Serie). */
  deltaAbs: number;
  /** Prozentuale Veränderung; null, wenn previousAvg == 0. */
  deltaPct: number | null;
  direction: Trend;
}

export interface PeriodComparison {
  /** Preis in ¢/kWh; null, wenn eine der Perioden keine Preisdaten hat. */
  price: SeriesComparison | null;
  /** Erneuerbaren-Anteil in %; null, wenn eine Periode keine Daten hat. */
  renewable: SeriesComparison | null;
}

/** Extrahiert Preis- (¢/kWh) und Erneuerbaren-Werte aus EnergyData[]. */
function extractValues(data: EnergyData[]): { price: number[]; renewable: number[] } {
  const price: number[] = [];
  const renewable: number[] = [];
  for (const d of data) {
    if (d.marketPrice !== null && d.marketPrice !== undefined) {
      price.push(d.marketPrice * 0.1);
    }
    if (d.renewableShare !== null && d.renewableShare !== undefined) {
      renewable.push(d.renewableShare);
    }
  }
  return { price, renewable };
}

function compareSeries(current: number[], previous: number[]): SeriesComparison | null {
  if (current.length === 0 || previous.length === 0) return null;

  const currentAvg = average(current);
  const previousAvg = average(previous);
  const deltaAbs = currentAvg - previousAvg;
  const deltaPct = previousAvg !== 0 ? (deltaAbs / Math.abs(previousAvg)) * 100 : null;

  // "flat" bei < 0.5% Änderung (bzw. ~0 absolut, falls previousAvg == 0)
  let direction: Trend = 'flat';
  if (deltaPct !== null) {
    if (deltaPct > 0.5) direction = 'up';
    else if (deltaPct < -0.5) direction = 'down';
  } else if (deltaAbs > 1e-9) {
    direction = 'up';
  } else if (deltaAbs < -1e-9) {
    direction = 'down';
  }

  return { currentAvg, previousAvg, deltaAbs, deltaPct, direction };
}

/**
 * Vergleicht die aktuelle Periode mit der unmittelbar vorangegangenen,
 * gleich langen Periode (Issue #311). Liefert je Serie die Veränderung des
 * Durchschnitts (absolut + prozentual) oder null, wenn Daten fehlen.
 */
export function computePeriodComparison(
  current: EnergyData[],
  previous: EnergyData[]
): PeriodComparison {
  const cur = extractValues(current);
  const prev = extractValues(previous);
  return {
    price: compareSeries(cur.price, prev.price),
    renewable: compareSeries(cur.renewable, prev.renewable),
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
