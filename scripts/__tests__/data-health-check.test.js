/**
 * Tests für scripts/data-health-check.js (Issue #445).
 *
 * Der Health-Check lief zuvor als `node -e '…'`-Inline-Block in fetch.yml und
 * brach in JEDEM Run mit `node: bad option: --` ab, weil ein Apostroph im
 * deutschen Fehlertext die Shell-Quotes schloss. Diese Tests decken die
 * Semantik ab, damit ein erneuter Umbau nicht still die Alarmierung verliert.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const { run, syncAlertIssue } = require('../data-health-check');

const BERLIN_DAY = '2026-09-02';
// 12:00 Europe/Berlin am 2026-09-02
const TS_TODAY = Date.UTC(2026, 8, 2, 10, 0, 0);
const TS_YESTERDAY = TS_TODAY - 24 * 60 * 60 * 1000;

let dataDir;

const writeMarket = (relDir, market) => {
  const dir = path.join(dataDir, relDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'marketdata.json'), JSON.stringify(market));
};

const point = (ts, renewableShare) => ({
  start_timestamp: ts,
  price: 42,
  renewable_share: renewableShare,
});

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-check-'));
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('data health check', () => {
  it('ist grün, wenn DE Erneuerbaren-Punkte für heute hat', () => {
    writeMarket('.', { source: 'energy-charts', data: [point(TS_TODAY, 55)] });

    const { failed, messages } = run(dataDir, BERLIN_DAY);

    expect(failed).toBe(false);
    expect(messages).toEqual([]);
  });

  it('färbt den Run rot, wenn DE für heute keine Erneuerbaren-Punkte hat', () => {
    writeMarket('.', {
      source: 'energy-charts',
      data: [point(TS_YESTERDAY, 55), point(TS_TODAY, null)],
    });

    const { failed, messages, summary } = run(dataDir, BERLIN_DAY);

    expect(failed).toBe(true);
    expect(messages.some((m) => m.startsWith('::error::DE:'))).toBe(true);
    expect(summary).toContain('- DE Erneuerbaren-Punkte heute: **0**');
  });

  it('färbt den Run rot, wenn die DE-Datei fehlt', () => {
    const { failed, messages } = run(dataDir, BERLIN_DAY);

    expect(failed).toBe(true);
    expect(messages.some((m) => m.includes('fehlt oder ist unlesbar'))).toBe(true);
  });

  it('warnt bei aWATTar-Fallback zusätzlich, ohne die Semantik zu ändern', () => {
    writeMarket('.', { source: 'awattar', data: [point(TS_TODAY, null)] });

    const { failed, messages } = run(dataDir, BERLIN_DAY);

    expect(failed).toBe(true); // 0 Erneuerbaren-Punkte bleibt fatal
    expect(messages.some((m) => m.startsWith('::warning::DE: Quelle ist aWATTar'))).toBe(true);
  });

  it('lässt Beta-Länder ohne Erneuerbaren-Daten den Run NICHT rot färben', () => {
    writeMarket('.', { source: 'energy-charts', data: [point(TS_TODAY, 55)] });
    writeMarket('nl', { source: 'energy-charts', data: [point(TS_TODAY, null)] });

    const { failed, messages, summary } = run(dataDir, BERLIN_DAY);

    expect(failed).toBe(false);
    expect(messages).toEqual([
      expect.stringContaining('::warning::NL: keine Erneuerbaren-Daten'),
    ]);
    expect(summary).toContain('- ⚠️ NL: 0 Erneuerbaren-Punkte für heute (BETA)');
  });

  it('ignoriert Beta-Länder ohne Datei komplett', () => {
    writeMarket('.', { source: 'energy-charts', data: [point(TS_TODAY, 55)] });

    const { summary } = run(dataDir, BERLIN_DAY);

    expect(summary.some((line) => line.includes('DK'))).toBe(false);
  });
});

describe('Alarm-Issue statt Exit-Code (#445)', () => {
  // Der Health-Check darf den Run nicht mehr rot färben — sonst ist "rot"
  // mehrdeutig (Upstream-Ausfall vs. echter Defekt) und ein Dauer-Rot wie bei
  // #445 fällt nicht auf.
  const summary = ['### Data health check', '- DE Erneuerbaren-Punkte heute: **0**'];
  const TODAY = '2026-09-03';

  /** Fake-Client, der die API-Aufrufe protokolliert. */
  const fakeGh = (openIssue = null, comments = []) => {
    const calls = [];
    return {
      calls,
      findOpenAlert: async () => (openIssue ? [openIssue] : []),
      createAlert: async (title, body) => {
        calls.push({ op: 'create', title, body });
      },
      commentAlert: async (number, body) => {
        calls.push({ op: 'comment', number, body });
      },
      listComments: async () => comments,
      closeAlert: async (number) => {
        calls.push({ op: 'close', number });
      },
    };
  };

  it('öffnet ein Issue, wenn eine Lücke auftritt und keines offen ist', async () => {
    const gh = fakeGh(null);

    const res = await syncAlertIssue({ failed: true, summary, today: TODAY, gh });

    expect(res.action).toBe('opened');
    expect(gh.calls).toEqual([
      expect.objectContaining({ op: 'create', title: expect.stringContaining(TODAY) }),
    ]);
  });

  it('kommentiert bei Fortdauer höchstens einmal pro Tag', async () => {
    const gh = fakeGh({ number: 7 }, [{ body: `Weiterhin offen (${TODAY}).` }]);

    const res = await syncAlertIssue({ failed: true, summary, today: TODAY, gh });

    expect(res.action).toBe('noop-already-commented');
    expect(gh.calls).toEqual([]);
  });

  it('kommentiert an einem neuen Tag erneut', async () => {
    const gh = fakeGh({ number: 7 }, [{ body: 'Weiterhin offen (2026-09-02).' }]);

    const res = await syncAlertIssue({ failed: true, summary, today: TODAY, gh });

    expect(res.action).toBe('commented');
    expect(gh.calls).toEqual([expect.objectContaining({ op: 'comment', number: 7 })]);
  });

  it('schließt das Issue, sobald die Daten wieder vollständig sind', async () => {
    const gh = fakeGh({ number: 7 }, []);

    const res = await syncAlertIssue({ failed: false, summary, today: TODAY, gh });

    expect(res.action).toBe('closed');
    expect(gh.calls.map((c) => c.op)).toEqual(['comment', 'close']);
  });

  it('tut nichts, wenn alles gesund ist und kein Issue offen ist', async () => {
    const gh = fakeGh(null);

    const res = await syncAlertIssue({ failed: false, summary, today: TODAY, gh });

    expect(res.action).toBe('noop-healthy');
    expect(gh.calls).toEqual([]);
  });

  it('läuft ohne Credentials durch, statt zu scheitern (lokaler Aufruf)', async () => {
    const res = await syncAlertIssue({ failed: true, summary, today: TODAY, gh: null });

    expect(res.action).toBe('skipped-no-credentials');
  });
});
