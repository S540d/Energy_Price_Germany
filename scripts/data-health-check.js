#!/usr/bin/env node
/**
 * Data health check (Issue #435, schließt #417; Quoting-Fix #445)
 *
 * Prüft nach dem Commit, ob die frisch veröffentlichten Marktdaten für HEUTE
 * (Europe/Berlin) Erneuerbaren-Werte enthalten:
 *
 *   - DE ohne Erneuerbaren-Punkte  → ::error:: + Alarm-Issue
 *   - DE-Quelle == "awattar"       → nur ::warning:: (liefert per Design keine)
 *   - Beta-Länder ohne Punkte      → nur ::warning::
 *
 * Der Befund geht in ein automatisch verwaltetes GitHub-Issue (Label
 * `data-health`), NICHT in den Exit-Code. Das ist der Benachrichtigungsweg aus
 * #417 — ohne Webhook, Secret oder Kosten — und hält zugleich die Bedeutung von
 * "roter Run" eindeutig: rot heißt Defekt, nicht Datenlücke. Begründung siehe
 * den Kommentar bei syncAlertIssue() weiter unten (#445).
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

// ─── Alarmierung über ein Issue statt über den Exit-Code (Issue #445) ──────
//
// Vorher setzte dieser Check `exit 1` und faerbte den Run rot. Das machte ROT
// mehrdeutig: entweder Upstream-Ausfall (gewollt) oder echter Defekt. Genau
// daran ist #445 durchgerutscht — ein Step, der in JEDEM Run mit Exit 9 abbrach,
// sah aus wie "der Alarm tut, was er soll", und blieb stundenlang unentdeckt.
//
// Seither gilt: ein roter Run heisst "der Workflow ist defekt". Der fachliche
// Befund (fehlende Daten) landet in einem automatisch verwalteten Issue —
// oeffnen bei Luecke, hoechstens ein Kommentar pro Tag bei Fortdauer, schliessen
// bei Erholung. Kein Webhook, kein Secret, nur GITHUB_TOKEN.

const ALERT_LABEL = 'data-health';
const ALERT_TITLE = 'Datenluecke: keine Erneuerbaren-Daten fuer heute';

/** Minimaler GitHub-Client. Gibt null zurueck, wenn die Umgebung fehlt (lokal). */
function githubClient() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) return null;

  const call = async (method, urlPath, body) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${urlPath}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`GitHub API ${method} ${urlPath} → ${res.status} ${await res.text()}`);
    }
    return res.status === 204 ? null : res.json();
  };

  return {
    findOpenAlert: () =>
      call('GET', `/issues?state=open&labels=${ALERT_LABEL}&per_page=1`),
    createAlert: (title, body) =>
      call('POST', '/issues', { title, body, labels: [ALERT_LABEL] }),
    commentAlert: (number, body) => call('POST', `/issues/${number}/comments`, { body }),
    listComments: (number) => call('GET', `/issues/${number}/comments?per_page=100`),
    closeAlert: (number) =>
      call('PATCH', `/issues/${number}`, { state: 'closed', state_reason: 'completed' }),
  };
}

/**
 * Haelt das Alarm-Issue mit der Datenlage in Einklang.
 * Der gh-Client ist injizierbar, damit Tests ohne Netz laufen.
 */
async function syncAlertIssue({ failed, summary, today, gh, runUrl }) {
  if (!gh) return { action: 'skipped-no-credentials' };

  const found = await gh.findOpenAlert();
  const open = Array.isArray(found) ? found[0] : null;
  const details = summary.join('\n') + (runUrl ? `\n\n[Workflow-Run](${runUrl})` : '');

  if (failed) {
    if (!open) {
      await gh.createAlert(`${ALERT_TITLE} (${today})`, details);
      return { action: 'opened' };
    }
    // Bei bis zu 6 Läufen/Tag nicht jedes Mal kommentieren — hoechstens einmal
    // pro Berlin-Tag, sonst ertrinkt der Verlauf im Rauschen.
    const comments = (await gh.listComments(open.number)) || [];
    const alreadyToday = comments.some((c) => (c.body || '').includes(`(${today})`));
    if (alreadyToday) return { action: 'noop-already-commented' };

    await gh.commentAlert(open.number, `Weiterhin offen (${today}).\n\n${details}`);
    return { action: 'commented' };
  }

  if (open) {
    await gh.commentAlert(open.number, `Erholt (${today}) — Daten sind wieder vollstaendig.\n\n${details}`);
    await gh.closeAlert(open.number);
    return { action: 'closed' };
  }

  return { action: 'noop-healthy' };
}

async function main() {
  const today = berlinDay(Date.now());
  const { summary, messages, failed } = run(DATA_DIR, today);

  for (const message of messages) {
    console.log(message);
  }
  console.log(summary.join('\n'));

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
  }

  // Ein Fehler der Alarmierung selbst darf die Pipeline nicht rot faerben —
  // die Daten sind zu diesem Zeitpunkt bereits committet.
  try {
    const result = await syncAlertIssue({
      failed,
      summary,
      today,
      gh: githubClient(),
      runUrl:
        process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
          ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
          : null,
    });
    console.log(`Alarm-Issue: ${result.action}`);
  } catch (err) {
    console.log(`::warning::Alarm-Issue konnte nicht aktualisiert werden: ${err.message}`);
  }

  // Bewusst KEIN exit 1 bei einer Datenluecke — siehe Kommentar oben.
}

if (require.main === module) {
  main();
}

module.exports = { run, berlinDay, syncAlertIssue, ALERT_LABEL, ALERT_TITLE };
