import { HistoricalDataStore, dayStringFromTimestamp } from './historicalDataStore';
import { Storage } from '../utils/platform';
import type { EnergyData } from '../utils/metrics';

jest.mock('../utils/platform');
global.fetch = jest.fn();

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

/**
 * Hilfsfunktion: Punkt an einem bestimmten Tag zu einer UTC-Stunde.
 * Bewusst über Date.UTC (zeitzonenunabhängig); Stunden 0..21 fallen sicher
 * auf denselben Europe/Berlin-Kalendertag, egal in welcher Test-Zeitzone.
 */
function pointAt(date: string, hour: number, marketPrice = 50, renewableShare = 60): EnergyData {
  const [y, m, d] = date.split('-').map(Number);
  const ts = Date.UTC(y, m - 1, d, hour, 0, 0);
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
    it('formats a timestamp as Europe/Berlin YYYY-MM-DD', () => {
      // 12:00 UTC im Sommer -> 14:00 Berlin (CEST) -> selber Kalendertag
      const ts = Date.UTC(2026, 4, 28, 12, 0, 0);
      expect(dayStringFromTimestamp(ts)).toBe('2026-05-28');
    });

    it('buckets a late-evening UTC instant into the next Berlin day', () => {
      // 23:30 UTC -> 01:30 Berlin (CET, Winter) -> nächster Kalendertag
      const ts = Date.UTC(2026, 0, 10, 23, 30, 0);
      expect(dayStringFromTimestamp(ts)).toBe('2026-01-11');
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

      const from = Date.UTC(2026, 4, 28, 0, 0, 0);
      const to = from + 24 * 60 * 60 * 1000;
      const range = await store.getRange(from, to, false);

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

      const from = Date.UTC(2026, 4, 27, 0, 0, 0);
      const to = Date.UTC(2026, 4, 27, 23, 59, 59);
      const range = await store.getRange(from, to, false);

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

  describe('getRange server fallback', () => {
    // Fenster komplett innerhalb EINES Berlin-Tages (unabhängig von der
    // Test-Zeitzone): 12:00 UTC ± 2h fällt im Sommer auf den 15.06.2020 Berlin.
    const noonUtc = Date.UTC(2020, 5, 15, 12, 0, 0);
    const fromTs = noonUtc - 2 * 60 * 60 * 1000;
    const toTs = noonUtc + 2 * 60 * 60 * 1000;

    const serverResponse = {
      date: '2020-06-15',
      source: 'energy-charts',
      data: [
        {
          start_timestamp: noonUtc,
          end_timestamp: noonUtc + 900000,
          marketprice: 42.0,
          renewable_share: 55.5,
          interpolated: false,
        },
      ],
    };

    it('fetches a missing past day from the server and caches it', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => serverResponse,
      });

      const range = await store.getRange(fromTs, toTs);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(range).toHaveLength(1);
      expect(range[0].marketPrice).toBe(42.0);

      // Tag ist nun im Cache -> kein erneuter Fetch
      const range2 = await store.getRange(fromTs, toTs);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(range2).toHaveLength(1);
    });

    it('ignores a 404 and does not refetch the same day in-session', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

      const range = await store.getRange(fromTs, toTs);
      expect(range).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // serverFetchAttempted verhindert erneuten Fetch
      await store.getRange(fromTs, toTs);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('does not fetch when server fallback is disabled', async () => {
      const range = await store.getRange(fromTs, toTs, false);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(range).toEqual([]);
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
