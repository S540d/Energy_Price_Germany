/**
 * Tests für scripts/lint-workflows.js (Issue #445).
 *
 * Der Guard existiert, weil actionlint/shellcheck diese Fehlerklasse NICHT
 * findet: Ein Apostroph im Body eines `node -e '…'`-Blocks ist für die Shell
 * syntaktisch korrekt (aus einem String werden mehrere Wörter), nur semantisch
 * falsch. Verifiziert am 2026-09-03 gegen die fehlerhafte fetch.yml-Fassung:
 * 48 shellcheck-Findings, kein einziges auf dem Bug.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'lint-workflows.js');

let dir;

const write = (name, content) => fs.writeFileSync(path.join(dir, name), content);

/** Führt den Guard aus und liefert { code, out }. */
const run = () => {
  try {
    const out = execFileSync('node', [SCRIPT, dir], { encoding: 'utf8' });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status, out: err.stdout || '' };
  }
};

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wf-lint-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('workflow guard', () => {
  it('meldet den #445-Fall: Apostroph im Body eines mehrzeiligen node -e Blocks', () => {
    write(
      'bad.yml',
      [
        'jobs:',
        '  x:',
        '    steps:',
        '      - run: |',
        "          node -e '",
        '          console.log("ok");',
        `          console.log("die App zeigt 'Erneuerbare: --'.");`,
        "          '",
        '',
      ].join('\n')
    );

    const { code, out } = run();

    expect(code).toBe(1);
    expect(out).toContain('::error');
    expect(out).toContain('Apostroph im Body');
  });

  it('akzeptiert einen mehrzeiligen Block ohne Apostroph (nur Warnung)', () => {
    write(
      'ok.yml',
      [
        'jobs:',
        '  x:',
        '    steps:',
        '      - run: |',
        "          node -e '",
        '          console.log("alles doppelt gequotet");',
        "          '",
        '',
      ].join('\n')
    );

    const { code, out } = run();

    expect(code).toBe(0);
    expect(out).toContain('::warning');
    expect(out).not.toContain('::error');
  });

  it('ignoriert Einzeiler mit Apostroph-Paar', () => {
    write(
      'inline.yml',
      [
        'jobs:',
        '  x:',
        '    steps:',
        `      - run: echo "$(node -e 'console.log(1)')"`,
        '',
      ].join('\n')
    );

    const { code, out } = run();

    expect(code).toBe(0);
    expect(out).not.toContain('::error');
    expect(out).not.toContain('::warning');
  });

  it('erkennt das Blockende auch bei angehängtem Code', () => {
    // Muster aus fetch.yml: `' "$PROBE_DIR")` bzw. `'; then` schliessen den Block.
    // Ohne diese Toleranz liefe der Guard weiter und meldete Folgezeilen falsch.
    write(
      'closing.yml',
      [
        'jobs:',
        '  x:',
        '    steps:',
        '      - run: |',
        "          RESULT=$(node -e '",
        '          console.log("x");',
        `          ' "$DIR")`,
        `          echo "danach ein Apostroph: it's fine"`,
        '',
      ].join('\n')
    );

    const { code, out } = run();

    expect(code).toBe(0);
    expect(out).not.toContain('::error');
  });

  it('meldet einen nicht geschlossenen Block als Fehler', () => {
    write(
      'unclosed.yml',
      ['jobs:', '  x:', '    steps:', '      - run: |', "          node -e '", '          console.log(1);', ''].join(
        '\n'
      )
    );

    const { code, out } = run();

    expect(code).toBe(1);
    expect(out).toContain('Nicht geschlossener');
  });

  it('ist bei einem Verzeichnis ohne Workflows still und erfolgreich', () => {
    const { code, out } = run();

    expect(code).toBe(0);
    expect(out).toContain('0 Fehler');
  });
});
