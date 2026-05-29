import { Storage } from '../utils/platform';
import type { EnergyData } from '../utils/metrics';

/**
 * Historical Data Store
 *
 * Persistiert Energiedaten tagesweise auf dem Gerät (localStorage/AsyncStorage),
 * damit historische Werte bei Bedarf wieder angezeigt werden können (Issue #307).
 *
 * Layout (versioniert wie energy_regional_cache_v1):
 *   energy_history_v1:<YYYY-MM-DD>  -> HistoryDayEntry (JSON)
 *   energy_history_index_v1         -> HistoryIndex (JSON)
 *
 * Der Index hält Datum + Größe pro Tag vor, damit Bereichs- und
 * Speicher-Abfragen ohne Laden aller Tage funktionieren. Tag-Schlüssel sind
 * lokale Tage (Europe/Berlin), konsistent mit dem RegionalDataCache.
 */

const HISTORY_DAY_KEY_PREFIX = 'energy_history_v1:';
const HISTORY_INDEX_KEY = 'energy_history_index_v1';
const HISTORY_INDEX_VERSION = 1;

/** Default-Obergrenze, falls kein Nutzer-Limit übergeben wird (10 MB). */
export const DEFAULT_HISTORY_LIMIT_BYTES = 10 * 1024 * 1024;

/**
 * Tages-Eintrag im persistenten Speicher.
 */
export interface HistoryDayEntry {
  date: string; // YYYY-MM-DD (lokal)
  data: EnergyData[]; // nach timestamp aufsteigend sortiert
  bytes: number; // geschätzte serialisierte Größe
  updatedAt: number;
}

/**
 * Index-Eintrag pro Tag (ohne die eigentlichen Datenpunkte).
 */
interface HistoryIndexDay {
  date: string;
  bytes: number;
  updatedAt: number;
}

interface HistoryIndex {
  version: number;
  days: HistoryIndexDay[];
}

export interface HistoryStorageInfo {
  dayCount: number;
  totalBytes: number;
  oldestDate: string | null;
  newestDate: string | null;
}

/**
 * Liefert YYYY-MM-DD (lokale Zeit) für einen Timestamp in Millisekunden.
 */
export function dayStringFromTimestamp(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class HistoricalDataStore {
  private dayKey(date: string): string {
    return `${HISTORY_DAY_KEY_PREFIX}${date}`;
  }

  /**
   * Lädt den Index oder liefert einen leeren Index.
   */
  private async loadIndex(): Promise<HistoryIndex> {
    try {
      const raw = await Storage.getItem(HISTORY_INDEX_KEY);
      if (!raw) return { version: HISTORY_INDEX_VERSION, days: [] };
      const parsed = JSON.parse(raw) as HistoryIndex;
      if (!parsed || !Array.isArray(parsed.days)) {
        return { version: HISTORY_INDEX_VERSION, days: [] };
      }
      return parsed;
    } catch {
      return { version: HISTORY_INDEX_VERSION, days: [] };
    }
  }

  private async saveIndex(index: HistoryIndex): Promise<void> {
    // Index nach Datum aufsteigend halten – vereinfacht Range/Eviction.
    index.days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    await Storage.setItem(HISTORY_INDEX_KEY, JSON.stringify(index));
  }

  /**
   * Lädt einen einzelnen Tages-Eintrag.
   */
  private async loadDay(date: string): Promise<HistoryDayEntry | null> {
    try {
      const raw = await Storage.getItem(this.dayKey(date));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as HistoryDayEntry;
      if (!parsed || !Array.isArray(parsed.data)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Nimmt einen aktuellen Datensatz entgegen, gruppiert ihn nach lokalem Tag
   * und merged die Punkte in die vorhandenen Tages-Einträge (neue Werte
   * überschreiben vorhandene desselben Timestamps – z.B. Forecast → Aktual).
   *
   * Fire-and-forget gedacht: Fehler werden geschluckt.
   *
   * @param data       Aktuelle EnergyData-Punkte (nationale Daten)
   * @param limitBytes Optionales Speicher-Limit; danach wird enforceLimit aufgerufen
   */
  async recordSnapshot(
    data: EnergyData[],
    limitBytes: number = DEFAULT_HISTORY_LIMIT_BYTES
  ): Promise<void> {
    try {
      if (!data || data.length === 0) return;

      // Punkte nach Tag gruppieren
      const byDay = new Map<string, EnergyData[]>();
      for (const point of data) {
        if (typeof point.timestamp !== 'number') continue;
        const day = dayStringFromTimestamp(point.timestamp);
        const list = byDay.get(day);
        if (list) {
          list.push(point);
        } else {
          byDay.set(day, [point]);
        }
      }
      if (byDay.size === 0) return;

      const index = await this.loadIndex();

      for (const [day, points] of byDay) {
        const existing = await this.loadDay(day);

        // Merge per Timestamp (neue Werte gewinnen)
        const merged = new Map<number, EnergyData>();
        if (existing) {
          for (const p of existing.data) merged.set(p.timestamp, p);
        }
        for (const p of points) merged.set(p.timestamp, p);

        const sorted = Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp);

        const updatedAt = Date.now();
        // bytes erst aus den Daten schätzen, dann finalen Eintrag schreiben.
        const dataBytes = JSON.stringify(sorted).length;
        const entry: HistoryDayEntry = {
          date: day,
          data: sorted,
          bytes: dataBytes,
          updatedAt,
        };
        const serialized = JSON.stringify(entry);
        await Storage.setItem(this.dayKey(day), serialized);

        // Index aktualisieren (Gesamtgröße des gespeicherten Strings)
        const idxEntry: HistoryIndexDay = {
          date: day,
          bytes: serialized.length,
          updatedAt,
        };
        const pos = index.days.findIndex(d => d.date === day);
        if (pos >= 0) {
          index.days[pos] = idxEntry;
        } else {
          index.days.push(idxEntry);
        }
      }

      await this.saveIndex(index);
      await this.enforceLimit(limitBytes);
    } catch {
      // Non-blocking
    }
  }

  /**
   * Liefert alle gespeicherten Datenpunkte im Zeitbereich [fromTs, toTs]
   * (inklusive), aufsteigend nach Timestamp sortiert.
   */
  async getRange(fromTs: number, toTs: number): Promise<EnergyData[]> {
    try {
      if (fromTs > toTs) return [];
      const index = await this.loadIndex();
      const fromDay = dayStringFromTimestamp(fromTs);
      const toDay = dayStringFromTimestamp(toTs);

      const relevantDays = index.days.filter(d => d.date >= fromDay && d.date <= toDay);

      const result: EnergyData[] = [];
      for (const d of relevantDays) {
        const entry = await this.loadDay(d.date);
        if (!entry) continue;
        for (const point of entry.data) {
          if (point.timestamp >= fromTs && point.timestamp <= toTs) {
            result.push(point);
          }
        }
      }

      result.sort((a, b) => a.timestamp - b.timestamp);
      return result;
    } catch {
      return [];
    }
  }

  /**
   * Liefert Übersicht über belegten Speicher (aus dem Index).
   */
  async getStorageInfo(): Promise<HistoryStorageInfo> {
    const index = await this.loadIndex();
    if (index.days.length === 0) {
      return { dayCount: 0, totalBytes: 0, oldestDate: null, newestDate: null };
    }
    const totalBytes = index.days.reduce((sum, d) => sum + (d.bytes || 0), 0);
    // index.days ist nach Datum sortiert
    return {
      dayCount: index.days.length,
      totalBytes,
      oldestDate: index.days[0].date,
      newestDate: index.days[index.days.length - 1].date,
    };
  }

  /**
   * Entfernt die ältesten Tage, bis der belegte Speicher unter limitBytes liegt.
   * Mindestens ein Tag bleibt immer erhalten.
   */
  async enforceLimit(limitBytes: number = DEFAULT_HISTORY_LIMIT_BYTES): Promise<void> {
    try {
      const index = await this.loadIndex();
      if (index.days.length <= 1) return;

      let total = index.days.reduce((sum, d) => sum + (d.bytes || 0), 0);
      // index.days ist nach Datum aufsteigend sortiert -> ältester zuerst
      while (total > limitBytes && index.days.length > 1) {
        const oldest = index.days.shift();
        if (!oldest) break;
        await Storage.removeItem(this.dayKey(oldest.date));
        total -= oldest.bytes || 0;
      }

      await this.saveIndex(index);
    } catch {
      // Non-blocking
    }
  }

  /**
   * Löscht die gesamte gespeicherte Historie (alle Tage + Index).
   */
  async clear(): Promise<void> {
    try {
      const index = await this.loadIndex();
      for (const d of index.days) {
        await Storage.removeItem(this.dayKey(d.date));
      }
      await Storage.removeItem(HISTORY_INDEX_KEY);
    } catch {
      // Non-blocking
    }
  }
}

// Singleton-Instanz
export const historicalDataStore = new HistoricalDataStore();
