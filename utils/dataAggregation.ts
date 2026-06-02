import type { EnergyData } from './metrics';

/**
 * Aggregiert EnergyData-Punkte in Zeit-Buckets fester Breite (z.B. stündlich
 * oder täglich), damit längere Zeitbereiche lesbar dargestellt werden können.
 * Mittelt Preis/Erneuerbaren-Werte je Bucket. Issue #1 / #3.
 *
 * @param data     Eingabedaten (beliebige Reihenfolge)
 * @param bucketMs Bucket-Breite in Millisekunden (z.B. 3_600_000 = 1h)
 */
export function aggregateEnergyData(data: EnergyData[], bucketMs: number): EnergyData[] {
  if (bucketMs <= 0 || data.length === 0) return data;

  const buckets = new Map<number, EnergyData[]>();
  for (const d of data) {
    const bucketTs = Math.floor(d.timestamp / bucketMs) * bucketMs;
    const list = buckets.get(bucketTs);
    if (list) {
      list.push(d);
    } else {
      buckets.set(bucketTs, [d]);
    }
  }

  const avg = (values: number[]): number | null =>
    values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucketTs, items]) => {
      const prices = items
        .filter(i => i.marketPrice !== null && i.marketPrice !== undefined)
        .map(i => i.marketPrice as number);
      const renewable = items
        .filter(i => i.renewableShare !== null && i.renewableShare !== undefined)
        .map(i => i.renewableShare as number);
      const renewableRegional = items
        .filter(i => i.renewableShareRegional !== null && i.renewableShareRegional !== undefined)
        .map(i => i.renewableShareRegional as number);

      return {
        timestamp: bucketTs,
        marketPrice: avg(prices),
        renewableShare: avg(renewable),
        renewableShareRegional: renewableRegional.length ? avg(renewableRegional) : undefined,
        isMarketPriceInterpolated: items.some(i => i.isMarketPriceInterpolated),
        isRenewableShareInterpolated: items.some(i => i.isRenewableShareInterpolated),
      };
    });
}
