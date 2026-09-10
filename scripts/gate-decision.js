#!/usr/bin/env node
/**
 * Gate-Entscheidung für die bedingten Cron-Slots in `fetch.yml`
 * (Gate eingeführt in #435, Kriterium (b) korrigiert in #487).
 *
 * Entscheidet anhand einer billigen DE-Probe, ob sich der ~90 s teure
 * `update`-Job lohnt. Ausgabe: `true`/`false` auf **stdout** (das liest der
 * Workflow), Begründung auf **stderr** (nur fürs Log).
 *
 * Aufruf: node scripts/gate-decision.js <probe-dir> [markt-datei]
 *
 * ─── Warum Kriterium (b) zeitstempel-basiert ist (#487) ──────────────────
 *
 * Ursprünglich zählte (b) nur die Erneuerbaren-Punkte **für heute**
 * (Europe/Berlin) und verglich sie mit der committeten Datei. Damit war das
 * Gate blind für die Zukunft:
 *
 *   - Um 13 UTC liefert `ren_share_forecast` erst 96 Punkte (nur heute); die
 *     Preise für morgen kommen an dieser Stelle aus aWATTar und tragen per
 *     Design `renewable_share: null`.
 *   - Später am Tag erweitert Energy Charts die Prognose auf 192 Punkte
 *     (bis morgen 23:45 Berlin).
 *   - Die Slots 16/19 UTC würden das holen — aber (a) sah keine neue
 *     Preis-Abdeckung (die Datei reichte via aWATTar bereits weiter) und (b)
 *     verglich nur „heute" (96 vs. 96). Ergebnis: `run-fetch=false`, jeden Tag.
 *
 * Seit #435 endete `renewable_share` deshalb **täglich** um 23:45 Berlin,
 * obwohl die API die Morgen-Werte längst lieferte. Vor dem Gate lief der
 * Abend-Slot unbedingt durch und holte sie (belegt: Lauf 31.08. 22:26 UTC).
 *
 * (b) fragt jetzt allgemein: Gibt es Zeitpunkte, für die die API einen
 * Erneuerbaren-Wert hat und die Datei keinen? Das subsumiert die Morgenlücke
 * (#481) und deckt die Zukunftslücke mit ab.
 *
 * > Bewusst in Kauf genommen: Im Extremfall lösen dadurch alle bedingten
 * > Slots einen vollen Lauf aus (~8 × 90 s statt ~2 × 90 s pro Tag). Das ist
 * > der Preis dafür, dass gelieferte Daten nicht liegen bleiben — die
 * > Alternative wäre wieder eine Kennzahl, die an der Lücke vorbeisieht.
 */

const fs = require('fs');
const path = require('path');

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

/**
 * Entscheidet über den vollen Lauf.
 *
 * @param {object|null} committed  Inhalt von marketdata.json
 * @param {object|null} apiPrice   price_raw.json aus der Probe
 * @param {object|null} apiRen     renewable_raw.json aus der Probe
 * @returns {{ runFetch: boolean, reasons: string[] }}
 */
function decide(committed, apiPrice, apiRen) {
  const reasons = [];

  // Ohne committete Datei gibt es nichts zu vergleichen -> laufen lassen.
  if (!committed || !Array.isArray(committed.data) || committed.data.length === 0) {
    return { runFetch: true, reasons: ['keine committete Datei zum Vergleich'] };
  }

  // (a) Neue Preis-Abdeckung?
  const fileMaxMs = Math.max(...committed.data.map((d) => d.start_timestamp || 0));
  if (apiPrice && Array.isArray(apiPrice.unix_seconds) && apiPrice.unix_seconds.length) {
    const apiMaxMs = Math.max(...apiPrice.unix_seconds) * 1000;
    if (apiMaxMs > fileMaxMs) {
      reasons.push(
        'neue Preis-Abdeckung: API bis ' +
          new Date(apiMaxMs).toISOString() +
          ', Datei bis ' +
          new Date(fileMaxMs).toISOString()
      );
    }
  }

  // (b) Hat die API Erneuerbaren-Werte fuer Zeitpunkte, die der Datei fehlen?
  //     Zeitstempel-basiert statt nach Kalendertag — sonst bleibt die
  //     Morgen-Prognose unsichtbar (#487).
  const fileRenTimestamps = new Set(
    committed.data.filter((d) => d.renewable_share != null).map((d) => d.start_timestamp)
  );

  if (apiRen && Array.isArray(apiRen.unix_seconds) && Array.isArray(apiRen.ren_share)) {
    let missing = 0;
    let earliestMissingMs = null;
    let latestMissingMs = null;

    for (let i = 0; i < apiRen.unix_seconds.length; i++) {
      if (apiRen.ren_share[i] == null) continue;
      const ms = apiRen.unix_seconds[i] * 1000;
      if (fileRenTimestamps.has(ms)) continue;
      missing++;
      if (earliestMissingMs === null || ms < earliestMissingMs) earliestMissingMs = ms;
      if (latestMissingMs === null || ms > latestMissingMs) latestMissingMs = ms;
    }

    if (missing > 0) {
      reasons.push(
        'Erneuerbaren-Werte fehlen in der Datei: ' +
          missing +
          ' Punkte (' +
          new Date(earliestMissingMs).toISOString() +
          ' .. ' +
          new Date(latestMissingMs).toISOString() +
          ')'
      );
    }
  }

  return { runFetch: reasons.length > 0, reasons };
}

function main() {
  const probeDir = process.argv[2];
  const marketFile = process.argv[3] || 'public/data/marketdata.json';

  const committed = readJson(marketFile);
  const apiPrice = readJson(path.join(probeDir, 'price_raw.json'));
  const apiRen = readJson(path.join(probeDir, 'renewable_raw.json'));

  const { runFetch, reasons } = decide(committed, apiPrice, apiRen);

  if (reasons.length === 0) {
    console.error('  - keine Verbesserung gegenueber der committeten Datei');
  } else {
    for (const r of reasons) console.error('  - ' + r);
  }

  console.log(runFetch ? 'true' : 'false');
}

if (require.main === module) {
  main();
}

module.exports = { decide };
