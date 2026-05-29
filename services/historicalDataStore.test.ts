import { HistoricalDataStore, dayStringFromTimestamp } from './historicalDataStore';
import { Storage } from '../utils/platform';
import type { EnergyData } from '../utils/metrics';

jest.mock('../utils/platform');

/**
 * In-Memory-Fake für die Storage-Abstraktion, damit Reads/Writes
 * realistisch interagieren (recordSnapshot liest, was es schrieb).
 */
function installStorageFake() {
  const map = new Map<string, string>();
  (Storage.getItem as jest.Mock).mockImplementation(async (k: string) => map.get(k) ?? null);
  (Storage.setItem as jest.Mock).mockImplementation(async (k: string, v: string) => {
    map.set(k, v);
  });
  (Storage.removeItem as jest.Mock).mockImplementation(async (k: string) => {
    map.delete(k);
  });
  return map;
}

/** Hilfsfunktion: Punkt an einem bestimmten Tag (lokal) zu einer Stunde. */
function pointAt(date: string, hour: number, marketPrice = 50, renewableShare = 60): EnergyData {
  const ts = new Date(`${date}T00:00:00`).getTime() + hour * 60 * 60 * 1000;
  return {
    timestamp: ts,
    marketPrice,
    renewableShare,
    isMarketPriceInterpolated: false,
    isRenewableShareInterpolated: false,
  };
}

describe('HistoricalDataStore', () => {
  let store: HistoricalDataStore;

  beforeEach(() => {
    jest.clearAllMocks();
    installStorageFake();
    store = new HistoricalDataStore();
  });

  describe('dayStringFromTimestamp', () => {
    it('formats a timestamp as local YYYY-MM-DD', () => {
      const ts = new Date('2026-05-28T10:00:00').getTime();
      expect(dayStringFromTimestamp(ts)).toBe('2026-05-28');
    });
  });

  describe('recordSnapshot', () => {
    it('stores points grouped by day and updates the index', async () => {
      await store.recordSnapshot([
        pointAt('2026-05-27', 10),
        pointAt('2026-05-28', 11),
        pointAt('2026-05-28', 12),
      ]);

      const info = await store.getStorageInfo();
      expect(info.dayCount).toBe(2);
      expect(info.oldestDate).toBe('2026-05-27');
      expect(info.newestDate).toBe('2026-05-28');
      expect(info.totalBytes).toBeGreaterThan(0);
    });

    it('merges new points into an existing day, deduping by timestamp', async () => {
      await store.recordSnapshot([pointAt('2026-05-28', 10, 50)]);
      // Gleicher Timestamp, neuer Preis -> soll überschreiben
      await store.recordSnapshot([pointAt('2026-05-28', 10, 99), pointAt('2026-05-28', 11, 40)]);

      const from = new Date('2026-05-28T00:00:00').getTime();
      const to = from + 24 * 60 * 60 * 1000;
      const range = await store.getRange(from, to);

      expect(range).toHaveLength(2);
      expect(range[0].marketPrice).toBe(99); // überschrieben
      expect(range[1].marketPrice).toBe(40);
    });

    it('ignores empty input', async () => {
      await store.recordSnapshot([]);
      const info = await store.getStorageInfo();
      expect(info.dayCount).toBe(0);
    });
  });

  describe('getRange', () => {
    it('returns only points within the requested range, sorted', async () => {
      await store.recordSnapshot([
        pointAt('2026-05-26', 12),
        pointAt('2026-05-27', 8),
        pointAt('2026-05-27', 20),
        pointAt('2026-05-28', 6),
      ]);

      const from = new Date('2026-05-27T00:00:00').getTime();
      const to = new Date('2026-05-27T23:59:59').getTime();
      const range = await store.getRange(from, to);

      expect(range).toHaveLength(2);
      expect(range[0].timestamp).toBeLessThan(range[1].timestamp);
    });

    it('returns empty array for inverted range', async () => {
      await store.recordSnapshot([pointAt('2026-05-27', 8)]);
      const result = await store.getRange(2000, 1000);
      expect(result).toEqual([]);
    });
  });

  describe('enforceLimit', () => {
    it('evicts the oldest days until under the byte budget, keeping at least one', async () => {
      // Drei Tage anlegen
      await store.recordSnapshot([pointAt('2026-05-26', 1)]);
      await store.recordSnapshot([pointAt('2026-05-27', 1)]);
      await store.recordSnapshot([pointAt('2026-05-28', 1)]);

      const before = await store.getStorageInfo();
      expect(before.dayCount).toBe(3);

      // Sehr kleines Limit erzwingt Eviction der ältesten Tage
      await store.enforceLimit(1);

      const after = await store.getStorageInfo();
      expect(after.dayCount).toBe(1);
      expect(after.newestDate).toBe('2026-05-28'); // jüngster Tag bleibt
    });
  });

  describe('clear', () => {
    it('removes all days and the index', async () => {
      await store.recordSnapshot([pointAt('2026-05-27', 8), pointAt('2026-05-28', 9)]);
      await store.clear();

      const info = await store.getStorageInfo();
      expect(info.dayCount).toBe(0);
      expect(info.totalBytes).toBe(0);
    });
  });
});
