import { eurPerMwhToCtPerKwh } from './priceUnits';
import type { EnergyData } from './metrics';

export type PriceTrendDirection = 'cheaper' | 'pricier' | 'similar';

export interface PriceTrend {
  direction: PriceTrendDirection;
  todayAvg: number; // ¢/kWh
  tomorrowAvg: number; // ¢/kWh
  diff: number; // tomorrowAvg - todayAvg in ¢/kWh
}

/** Unterhalb dieser Differenz (¢/kWh) gilt der Tag als „ähnlich“. */
export const SIMILAR_THRESHOLD_CT = 0.3;
/** Mindestanzahl Preispunkte pro Tag, damit der Tagesdurchschnitt aussagekräftig ist. */
export const MIN_POINTS_PER_DAY = 20;

function localDayStart(now: Date, offsetDays: number): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays).getTime();
}

function dayAverage(data: EnergyData[], start: number, end: number): number | null {
  const prices = data
    .filter(d => d.marketPrice !== null && d.timestamp >= start && d.timestamp < end)
    .map(d => d.marketPrice as number);
  if (prices.length < MIN_POINTS_PER_DAY) return null;
  return eurPerMwhToCtPerKwh(prices.reduce((sum, p) => sum + p, 0) / prices.length);
}

/**
 * Vergleicht den durchschnittlichen Börsenpreis von morgen mit dem von heute.
 * Gibt `null` zurück, solange für einen der beiden Tage zu wenige Preise vorliegen
 * (Day-Ahead-Preise für morgen sind erst ab dem Nachmittag verfügbar).
 * Die Tagesgrenzen sind lokale Kalendertage (nicht UTC) – DST-Tage haben 23/25 h,
 * daher wird der Tagesbeginn per Date-Konstruktor statt `+ DAY_MS` bestimmt.
 */
export function calculatePriceTrend(data: EnergyData[], now: Date = new Date()): PriceTrend | null {
  const todayStart = localDayStart(now, 0);
  const tomorrowStart = localDayStart(now, 1);
  const dayAfterStart = localDayStart(now, 2);

  const todayAvg = dayAverage(data, todayStart, tomorrowStart);
  const tomorrowAvg = dayAverage(data, tomorrowStart, dayAfterStart);
  if (todayAvg === null || tomorrowAvg === null) return null;

  const diff = tomorrowAvg - todayAvg;
  const direction: PriceTrendDirection =
    Math.abs(diff) < SIMILAR_THRESHOLD_CT ? 'similar' : diff < 0 ? 'cheaper' : 'pricier';
  return { direction, todayAvg, tomorrowAvg, diff };
}
