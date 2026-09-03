#!/usr/bin/env node
/**
 * Workflow-Guard gegen die Fehlerklasse aus Issue #445.
 *
 * Hintergrund: Der `Data health check`-Step in fetch.yml war als
 * `node -e '…'`-Inline-Block geschrieben und enthielt im deutschen Fehlertext
 * `die App zeigt 'Erneuerbare: --'`. Die einfachen Quotes schlossen den
 * Shell-String vorzeitig, `node` bekam `--` als Option und beendete sich mit
 * Exit 9 — bevor eine einzige Prüfung lief. Der Step faerbte damit JEDEN Run
 * rot, unabhaengig von der Datenlage, und machte den Alarmweg aus #417 wertlos.
 *
 * Warum ein eigener Check und nicht actionlint/shellcheck: Der Fehler ist fuer
 * die Shell **syntaktisch korrekt** — aus einem String werden mehrere Woerter,
 * keine Quote bleibt offen. shellcheck meldet dort nur SC2016 (info), das bei
 * jedem `node -e '…'` normal ist. Verifiziert am 2026-09-03 gegen die
 * fehlerhafte Fassung (Commit 9abdda2): 48 Findings, kein einziges auf dem Bug.
 *
 * Der Check meldet:
 *   1. Apostrophe im Body eines `node -e '…'`-Blocks  → harter Fehler
 *   2. Mehrzeilige `node -e '…'`-Bloecke ueberhaupt   → Konventionsverstoss
 *      (Logik gehoert nach scripts/, siehe scripts/fetch-energy-charts.sh
 *      und scripts/data-health-check.js)
 *
 * Aufruf: node scripts/lint-workflows.js [workflow-verzeichnis]
 */

const fs = require('fs');
const path = require('path');

const DIR = process.argv[2] || '.github/workflows';
const OPEN = /node -e '\s*$/;
// Schliessende Zeile: beginnt (nach Whitespace) mit dem Quote. Bewusst tolerant,
// weil danach beliebiges folgen kann — `'`, `'; then`, `' "$PROBE_DIR")`.
// JS-Body-Zeilen beginnen praktisch nie mit einem Apostroph.
const CLOSE = /^\s*'/;
// Erlaubt: Einzeiler wie  node -e 'console.log(...)'  (oeffnet und schliesst in einer Zeile)
const SINGLE_LINE = /node -e '[^']*'/;

let errors = 0;
let warnings = 0;

const report = (level, file, line, msg) => {
  const prefix = level === 'error' ? '::error' : '::warning';
  console.log(`${prefix} file=${file},line=${line}::${msg}`);
  if (level === 'error') errors++;
  else warnings++;
};

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  .sort();

for (const name of files) {
  const file = path.join(DIR, name);
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  let openLine = null;
  let apostropheLines = [];

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;

    if (openLine === null) {
      if (OPEN.test(line) && !SINGLE_LINE.test(line)) {
        openLine = lineNo;
        apostropheLines = [];
      }
      return;
    }

    if (CLOSE.test(line)) {
      if (apostropheLines.length > 0) {
        report(
          'error',
          file,
          openLine,
          `Apostroph im Body eines mehrzeiligen "node -e '...'"-Blocks ` +
            `(Zeile ${apostropheLines.join(', ')}). Das schliesst den Shell-String ` +
            `vorzeitig — node bekommt die Folgewoerter als Optionen und bricht ab ` +
            `(Issue #445). Logik nach scripts/ auslagern.`
        );
      } else {
        report(
          'warning',
          file,
          openLine,
          `Mehrzeiliger "node -e '...'"-Block. Konvention: nennenswerte Logik ` +
            `gehoert in eine Datei unter scripts/ (Issue #445).`
        );
      }
      openLine = null;
      return;
    }

    if (line.includes("'")) apostropheLines.push(lineNo);
  });

  if (openLine !== null) {
    report(
      'error',
      file,
      openLine,
      `Nicht geschlossener "node -e '...'"-Block — der Workflow ist vermutlich kaputt.`
    );
  }
}

console.log(
  `\nWorkflow-Guard: ${files.length} Datei(en) geprueft, ` +
    `${errors} Fehler, ${warnings} Warnung(en).`
);

if (errors > 0) process.exit(1);
