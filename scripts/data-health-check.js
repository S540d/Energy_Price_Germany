#!/usr/bin/env node
/**
 * Data health check (Issue #435, schließt #417; Quoting-Fix #438)
 *
 * Prüft nach dem Commit, ob die frisch veröffentlichten Marktdaten für HEUTE
 * (Europe/Berlin) Erneuerbaren-Werte enthalten:
 *
 *   - DE ohne Erneuerbaren-Punkte  → ::error:: + Exit 1 (Run wird rot)
 *   - DE-Quelle == "awattar"       → nur ::warning:: (liefert per Design keine)
 *   - Beta-Länder ohne Punkte      → nur ::warning::, färbt den Run nie rot
 *
 * Ein roter Run löst GitHubs Standard-"workflow run failed"-Mail aus und ist
 * damit der Benachrichtigungsweg aus #417 — ohne Webhook, Secret oder Kosten.
 * An Tagen mit echtem Upstream-Ausfall ist ein roter Eintrag in der Historie
 * deshalb ABSICHT und kein Defekt.
 *
 * Bewusst als eigenständige Datei statt als `node -e '…'`-Inline-Block: der
 * Inline-Block lief in jedem Fetch-Run auf `node: bad option: --` auf, weil ein
 * Apostroph im deutschen Fehlertext ("die App zeigt 'Erneuerbare: --'") die
 * einfachen Shell-Quotes vorzeitig schloss (Runs 33652243129, 33690118651).
 *
 * Aufruf: node scripts/data-health-check.js [datenverzeichnis]
 *         (Default-Verzeichnis: public/data)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.argv[2] || 'public/data';
const BETA_COUNTRIES = ['nl', 'at', 'ch', 'fr', 'be', 'dk'];

const berlinDay = (ms) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

function run(dataDir, today) {
  const summary = [];
  const messages = [];
  let failed = false;

  const renTodayCount = (file) => {
    const json = readJson(file);
    if (!json || !Array.isArray(json.data)) return null;
    return json.data.filter(
      (d) => d.renewable_share != null && berlinDay(d.start_timestamp) === today
    ).length;
  };

  summary.push('### Data health check (' + today + ', Europe/Berlin)');
  summary.push('');

  // ── DE: fatal ──────────────────────────────────────────────────────────
  const deFile = path.join(dataDir, 'marketdata.json');
  const de = readJson(deFile);

  if (de === null) {
    messages.push('::error::DE: ' + deFile + ' fehlt oder ist unlesbar.');
    summary.push('- **DE: FEHLER** – `marketdata.json` fehlt oder ist unlesbar');
    failed = true;
  } else {
    const deRen = renTodayCount(deFile);
    summary.push('- DE Quelle: `' + de.source + '`');
    summary.push('- DE Erneuerbaren-Punkte heute: **' + deRen + '**');

    if (deRen === 0) {
      messages.push(
        '::error::DE: keine Erneuerbaren-Daten fuer heute (' + today + '). ' +
          'Der ren_share_forecast-Endpunkt hat nichts Verwertbares geliefert - ' +
          'die App zeigt "Erneuerbare: --".'
      );
      summary.push('- **DE: FEHLER** – 0 Erneuerbaren-Punkte für heute');
      failed = true;
    }

    // Nicht fatal: aWATTar liefert per Design keinen renewable_share.
    if (de.source === 'awattar') {
      messages.push(
        '::warning::DE: Quelle ist aWATTar - Energy Charts war nicht ' +
          'erreichbar, deshalb gibt es per Design keine Erneuerbaren-Daten.'
      );
      summary.push('- ⚠️ DE: Fallback auf aWATTar (keine Erneuerbaren-Daten per Design)');
    }
  }

  // ── Beta-Länder: nur Warnung, nie rot ──────────────────────────────────
  for (const code of BETA_COUNTRIES) {
    const file = path.join(dataDir, code, 'marketdata.json');
    if (!fs.existsSync(file)) continue;
    const n = renTodayCount(file);
    if (n === 0) {
      messages.push(
        '::warning::' + code.toUpperCase() + ': keine Erneuerbaren-Daten ' +
          'fuer heute (Beta-Land, faerbt den Run nicht rot).'
      );
      summary.push('- ⚠️ ' + code.toUpperCase() + ': 0 Erneuerbaren-Punkte für heute (BETA)');
    } else if (n !== null) {
      summary.push('- ' + code.toUpperCase() + ' Erneuerbaren-Punkte heute: ' + n);
    }
  }

  summary.push('');
  return { summary, messages, failed };
}

if (require.main === module) {
  const { summary, messages, failed } = run(DATA_DIR, berlinDay(Date.now()));

  for (const message of messages) {
    console.log(message);
  }
  console.log(summary.join('\n'));

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
  }

  if (failed) process.exit(1);
}

module.exports = { run, berlinDay };
