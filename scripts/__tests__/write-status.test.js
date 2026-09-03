/**
 * Tests für scripts/write-status.js (Retrospektive zu #445/#446).
 *
 * status.json beantwortet "läuft die Pipeline gerade?" ohne Log-Lesen — der
 * Run-Status taugte dafür nicht: grün bewies nicht, dass Daten ankamen, rot war
 * zwischen Upstream-Ausfall und echtem Defekt nicht unterscheidbar.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const { buildStatus } = require('../write-status');

// 12:00 Europe/Berlin am 2026-09-03
const NOW = Date.UTC(2026, 8, 3, 10, 0, 0);
const HOUR = 3_600_000;

let dir;

const writeMarket = (relDir, market) => {
  const target = path.join(dir, relDir);
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, 'marketdata.json'), JSON.stringify(market));
};

const point = (ts, renewableShare) => ({
  start_timestamp: ts,
  price: 42,
  renewable_share: renewableShare,
});

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'status-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('status.json', () => {
  it('meldet Quelle, Punktezahl und Erneuerbaren-Punkte für heute', () => {
    writeMarket('.', {
      source: 'energy-charts',
      data: [point(NOW, 55), point(NOW - 24 * HOUR, 40), point(NOW + HOUR, null)],
    });

    const status = buildStatus(dir, NOW);

    expect(status.berlinDay).toBe('2026-09-03');
    expect(status.countries.de).toMatchObject({
      available: true,
      source: 'energy-charts',
      points: 3,
      renewablePointsToday: 1,
    });
  });

  it('gibt bei Day-Ahead-Abdeckung ein negatives Alter zurück', () => {
    // Abdeckung reicht in die Zukunft — das ist der Normalfall, kein Fehler.
    writeMarket('.', { source: 'energy-charts', data: [point(NOW + 6 * HOUR, 50)] });

    const status = buildStatus(dir, NOW);

    expect(status.countries.de.coverageAgeHours).toBe(-6);
  });

  it('macht veraltete Daten am Alter sichtbar', () => {
    writeMarket('.', { source: 'awattar', data: [point(NOW - 30 * HOUR, null)] });

    const status = buildStatus(dir, NOW);

    expect(status.countries.de.coverageAgeHours).toBe(30);
    expect(status.countries.de.renewablePointsToday).toBe(0);
    expect(status.countries.de.source).toBe('awattar');
  });

  it('führt nur vorhandene Länder auf', () => {
    writeMarket('.', { source: 'energy-charts', data: [point(NOW, 55)] });
    writeMarket('nl', { source: 'energy-charts', data: [point(NOW, 60)] });

    const status = buildStatus(dir, NOW);

    expect(Object.keys(status.countries).sort()).toEqual(['de', 'nl']);
  });

  it('markiert eine leere oder kaputte Datei als nicht verfügbar', () => {
    writeMarket('.', { source: 'energy-charts', data: [] });

    const status = buildStatus(dir, NOW);

    expect(status.countries.de).toEqual({ available: false });
  });
});
