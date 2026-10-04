import { arrayMin, arrayMax } from './mathUtils';
import { eurPerMwhToCtPerKwh } from './priceUnits';

export type EnergyData = {
  timestamp: number;
  marketPrice: number | null;
  renewableShare: number | null;
  renewableShareRegional?: number | null;
  isMarketPriceInterpolated?: boolean;
  isRenewableShareInterpolated?: boolean;
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
  today?: {
    date: string;
    // Anzahl Datenpunkte heute mit vorhandenem marketPrice bzw. renewableShare.
    // Dient der Erkennung von Teilausfällen einer Metrik (Issue #417) – z.B. wenn
    // die API renewable_share als leeres Array liefert, marketprice aber vorhanden ist.
    coverage: {
      priceCount: number;
      renewableCount: number;
      total: number;
    };
    renewable: {
      // `null` (nicht 0) wenn es heute keinen einzigen Wert gibt. 0 wäre eine
      // Falschaussage: „keine Daten“ liest sich sonst als „keine Erneuerbaren
      // im Netz“ – genau das zeigte die Kachel beim Ausfall am 2026-09-08
      // als „Tages-Ø 0.0 %“.
      avg: number | null;
      min: number | null;
      max: number | null;
      current: number | null;
    };
    marketPrice: {
      avg: number;
      min: number;
      max: number;
      current: number | null;
    };
    endCustomerPrice: {
      avg: number;
      min: number;
      max: number;
      current: number | null;
    };
  };
}

// Constants
export const GRID_FEES_AND_TAXES = 20; // Cent/kWh - Netzentgelte und Steuern
/** Zeitfenster um „jetzt“, in dem ein Datenpunkt als aktueller Wert gilt. */
export const CURRENT_HOUR_TOLERANCE_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

/** Beginn des lokalen Kalendertags von `now` (ms). */
function startOfLocalDay(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/** Liegt `timestamp` im lokalen Kalendertag von `now`? */
export function isToday(timestamp: number, now: Date): boolean {
  const start = startOfLocalDay(now);
  return timestamp >= start && timestamp < start + 24 * 60 * 60 * 1000;
}

/** Nächstgelegener Punkt zu `nowMs` innerhalb der Toleranz (sonst `undefined`). */
export function findClosestSample<T extends { timestamp: number }>(
  samples: T[],
  nowMs: number,
  toleranceMs: number = CURRENT_HOUR_TOLERANCE_MS
): T | undefined {
  return samples
    .filter(s => Math.abs(s.timestamp - nowMs) < toleranceMs)
    .sort((a, b) => Math.abs(a.timestamp - nowMs) - Math.abs(b.timestamp - nowMs))[0];
}

/**
 * Berechnet Metriken aus Energiedaten
 */
export function calculateMetrics(data: EnergyData[]): Metrics | null {
  if (data.length === 0) return null;

  const validRenewableData = data.filter(d => d.renewableShare !== null);
  const validPriceData = data.filter(d => d.marketPrice !== null);

  // Get today's data (current day in local time)
  const now = new Date();
  const todayData = data.filter(d => isToday(d.timestamp, now));
  const todayValidRenewable = todayData.filter(d => d.renewableShare !== null);
  const todayValidPrice = todayData.filter(d => d.marketPrice !== null);

  // Find current hour's data (closest to now)
  const nowMs = now.getTime();
  const currentHourData = findClosestSample(data, nowMs);

  // Calculate today's market price stats (reused for end customer price)
  const todayMarketPriceAvg =
    todayValidPrice.length > 0
      ? todayValidPrice.reduce((sum, d) => sum + eurPerMwhToCtPerKwh(d.marketPrice ?? 0), 0) /
        todayValidPrice.length
      : 0;
  const todayMarketPriceMin =
    todayValidPrice.length > 0
      ? eurPerMwhToCtPerKwh(arrayMin(todayValidPrice.map(d => d.marketPrice ?? 0)))
      : 0;
  const todayMarketPriceMax =
    todayValidPrice.length > 0
      ? eurPerMwhToCtPerKwh(arrayMax(todayValidPrice.map(d => d.marketPrice ?? 0)))
      : 0;

  const todayMetrics =
    todayData.length > 0
      ? {
          date: now.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          coverage: {
            priceCount: todayValidPrice.length,
            renewableCount: todayValidRenewable.length,
            total: todayData.length,
          },
          renewable: {
            avg:
              todayValidRenewable.length > 0
                ? todayValidRenewable.reduce((sum, d) => sum + (d.renewableShare ?? 0), 0) /
                  todayValidRenewable.length
                : null,
            min:
              todayValidRenewable.length > 0
                ? arrayMin(todayValidRenewable.map(d => d.renewableShare ?? 0))
                : null,
            max:
              todayValidRenewable.length > 0
                ? arrayMax(todayValidRenewable.map(d => d.renewableShare ?? 0))
                : null,
            current: currentHourData?.renewableShare ?? null,
          },
          marketPrice: {
            avg: todayMarketPriceAvg,
            min: todayMarketPriceMin,
            max: todayMarketPriceMax,
            current:
              currentHourData?.marketPrice !== null && currentHourData?.marketPrice !== undefined
                ? eurPerMwhToCtPerKwh(currentHourData.marketPrice)
                : null,
          },
          endCustomerPrice: {
            avg: todayMarketPriceAvg + GRID_FEES_AND_TAXES,
            min: todayMarketPriceMin + GRID_FEES_AND_TAXES,
            max: todayMarketPriceMax + GRID_FEES_AND_TAXES,
            current:
              currentHourData?.marketPrice !== null && currentHourData?.marketPrice !== undefined
                ? eurPerMwhToCtPerKwh(currentHourData.marketPrice) + GRID_FEES_AND_TAXES
                : null,
          },
        }
      : undefined;

  return {
    timeRange: {
      start: arrayMin(data.map(d => d.timestamp)),
      end: arrayMax(data.map(d => d.timestamp)),
    },
    renewable: {
      avg:
        validRenewableData.length > 0
          ? validRenewableData.reduce((sum, d) => sum + (d.renewableShare ?? 0), 0) /
            validRenewableData.length
          : 0,
      min:
        validRenewableData.length > 0
          ? arrayMin(validRenewableData.map(d => d.renewableShare ?? 0))
          : 0,
      max:
        validRenewableData.length > 0
          ? arrayMax(validRenewableData.map(d => d.renewableShare ?? 0))
          : 0,
    },
    marketPrice: {
      avg:
        validPriceData.length > 0
          ? validPriceData.reduce((sum, d) => sum + eurPerMwhToCtPerKwh(d.marketPrice ?? 0), 0) /
            validPriceData.length
          : 0,
      min:
        validPriceData.length > 0
          ? eurPerMwhToCtPerKwh(arrayMin(validPriceData.map(d => d.marketPrice ?? 0)))
          : 0,
      max:
        validPriceData.length > 0
          ? eurPerMwhToCtPerKwh(arrayMax(validPriceData.map(d => d.marketPrice ?? 0)))
          : 0,
    },
    today: todayMetrics,
  };
}
