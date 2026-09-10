/**
 * Tests für scripts/gate-decision.js (Issue #487).
 *
 * Das Gate zählte zuvor nur Erneuerbaren-Punkte für HEUTE und war damit blind
 * für die Morgen-Prognose: Die Slots 16/19 UTC entschieden täglich
 * `run-fetch=false`, obwohl die API bereits 96 Werte für morgen lieferte.
 * Diese Tests halten die Semantik fest, damit die Lücke nicht still
 * zurückkehrt.
 */
const { decide } = require('../gate-decision');

// 2026-09-10 00:00 Europe/Berlin
const DAY_START = Date.UTC(2026, 8, 9, 22, 0, 0);
const QUARTER = 15 * 60 * 1000;

/** n Punkte im 15-Min-Raster ab `startMs`. */
const timestamps = (startMs, n) => Array.from({ length: n }, (_, i) => startMs + i * QUARTER);

/** marketdata.json-Datenpunkt. */
const point = (ts, renewableShare, marketprice = 42) => ({
  start_timestamp: ts,
  end_timestamp: ts + QUARTER,
  marketprice,
  renewable_share: renewableShare,
});

/** API-Antwort im Format von ren_share_forecast. */
const apiRenewable = (tsList) => ({
  unix_seconds: tsList.map((ms) => ms / 1000),
  ren_share: tsList.map(() => 55.5),
});

/** API-Antwort im Format von price. */
const apiPrice = (tsList) => ({
  unix_seconds: tsList.map((ms) => ms / 1000),
  price: tsList.map(() => 42),
});

const market = (points) => ({ object: 'list', source: 'energy-charts', data: points });

describe('gate-decision', () => {
  it('löst einen Lauf aus, wenn die API Erneuerbaren-Werte für morgen hat, die Datei aber nicht', () => {
    // Genau die Konstellation vom 2026-09-10, 19:03 UTC: Die Datei hat heute
    // vollständig (96) und dank aWATTar bereits Preise bis morgen 14:45,
    // die API liefert inzwischen 192 Erneuerbaren-Punkte (heute + morgen).
    const today = timestamps(DAY_START, 96);
    const tomorrow = timestamps(DAY_START + 96 * QUARTER, 96);

    const committed = market([
      ...today.map((ts) => point(ts, 55.5)),
      // Preise für morgen aus aWATTar -> renewable_share bewusst null
      ...timestamps(DAY_START + 96 * QUARTER, 60).map((ts) => point(ts, null)),
    ]);

    const { runFetch, reasons } = decide(
      committed,
      apiPrice(today), // EC-Preise reichen nur bis heute -> Kriterium (a) greift nicht
      apiRenewable([...today, ...tomorrow])
    );

    expect(runFetch).toBe(true);
    expect(reasons.join(' ')).toMatch(/Erneuerbaren-Werte fehlen/);
  });

  it('löst keinen Lauf aus, wenn die Datei alle Erneuerbaren-Werte der API bereits hat', () => {
    const today = timestamps(DAY_START, 96);
    const committed = market(today.map((ts) => point(ts, 55.5)));

    const { runFetch, reasons } = decide(committed, apiPrice(today), apiRenewable(today));

    expect(runFetch).toBe(false);
    expect(reasons).toHaveLength(0);
  });

  it('deckt weiterhin die Morgenlücke ab (#481): heute fehlen Werte', () => {
    const today = timestamps(DAY_START, 96);
    // Datei kennt nur die ersten 88 Punkte von heute mit Wert
    const committed = market(today.map((ts, i) => point(ts, i < 88 ? 55.5 : null)));

    const { runFetch } = decide(committed, apiPrice(today), apiRenewable(today));

    expect(runFetch).toBe(true);
  });

  it('löst bei neuer Preis-Abdeckung aus, auch ohne Erneuerbaren-Lücke', () => {
    const today = timestamps(DAY_START, 96);
    const committed = market(today.map((ts) => point(ts, 55.5)));
    const withTomorrow = [...today, ...timestamps(DAY_START + 96 * QUARTER, 96)];

    const { runFetch, reasons } = decide(committed, apiPrice(withTomorrow), apiRenewable(today));

    expect(runFetch).toBe(true);
    expect(reasons.join(' ')).toMatch(/neue Preis-Abdeckung/);
  });

  it('ignoriert null-Werte der API — sie sind keine fehlenden Daten', () => {
    const today = timestamps(DAY_START, 96);
    const committed = market(today.map((ts) => point(ts, 55.5)));

    const renWithNulls = apiRenewable([...today, ...timestamps(DAY_START + 96 * QUARTER, 96)]);
    // Alle Morgen-Werte sind null -> kein Grund für einen Lauf
    for (let i = 96; i < renWithNulls.ren_share.length; i++) {
      renWithNulls.ren_share[i] = null;
    }

    const { runFetch } = decide(committed, apiPrice(today), renWithNulls);

    expect(runFetch).toBe(false);
  });

  it('läuft fail open, wenn keine committete Datei vorliegt', () => {
    expect(decide(null, null, null).runFetch).toBe(true);
    expect(decide({ data: [] }, null, null).runFetch).toBe(true);
  });

  it('entscheidet ohne Probe-Daten gegen einen Lauf (Probe-Ausfall fängt der Workflow ab)', () => {
    const today = timestamps(DAY_START, 96);
    const committed = market(today.map((ts) => point(ts, 55.5)));

    // Der fail-open-Pfad bei fehlgeschlagener Probe liegt im Workflow (Guard
    // auf price_raw.json); hier zählt nur, dass fehlende Payloads keinen
    // Grund erzeugen.
    expect(decide(committed, null, null).runFetch).toBe(false);
  });
});
