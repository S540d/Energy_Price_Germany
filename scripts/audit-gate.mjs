#!/usr/bin/env node
/**
 * Audit-Gate: `npm audit` mit expliziter, befristeter Allowlist.
 *
 * Schlägt fehl bei
 *   - hohen/kritischen Advisories, die NICHT in .audit-allowlist.json stehen
 *   - Allowlist-Einträgen, deren `expires` überschritten ist (Ausnahme muss neu bewertet werden)
 * Nur Advisories (GHSA) werden verglichen, nicht Paketnamen: Ein neues Finding im selben
 * Paket fällt dadurch weiterhin auf.
 *
 * Usage: node scripts/audit-gate.mjs [--level=high|critical]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const level = (process.argv.find(a => a.startsWith('--level=')) || '--level=high').split('=')[1];
const RANK = { low: 1, moderate: 2, high: 3, critical: 4 };
const threshold = RANK[level];
if (!threshold) {
  console.error(`Unbekanntes Level: ${level}`);
  process.exit(2);
}

const allowlist = existsSync('.audit-allowlist.json')
  ? JSON.parse(readFileSync('.audit-allowlist.json', 'utf8')).advisories
  : [];
const today = new Date().toISOString().slice(0, 10);

let raw;
try {
  raw = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  // npm audit endet bei Findings mit Exit-Code 1, die JSON-Ausgabe liegt trotzdem auf stdout.
  raw = e.stdout;
  if (!raw) {
    console.error('npm audit lieferte keine Ausgabe:', e.message);
    process.exit(2);
  }
}
const report = JSON.parse(raw);
if (report.error) {
  console.error('npm audit Fehler:', report.error.summary || report.error);
  process.exit(2);
}

// Eindeutige Advisories sammeln (`via`-Objekte; Strings sind nur Verweise auf andere Pakete).
const advisories = new Map();
for (const [pkg, vuln] of Object.entries(report.vulnerabilities || {})) {
  for (const via of vuln.via) {
    if (typeof via !== 'object') continue;
    const id = (via.url || '').split('/').pop() || via.title;
    if (!advisories.has(id))
      advisories.set(id, { id, pkg: via.name || pkg, title: via.title, severity: via.severity });
  }
}

const allowed = new Map(allowlist.map(a => [a.id, a]));
const blocking = [];
const accepted = [];
for (const adv of advisories.values()) {
  if (RANK[adv.severity] < threshold) continue;
  const entry = allowed.get(adv.id);
  (entry ? accepted : blocking).push({ ...adv, entry });
}
const expired = allowlist.filter(a => a.expires < today);
const unused = allowlist.filter(a => !advisories.has(a.id));

for (const a of accepted) {
  console.info(`ℹ️  akzeptiert bis ${a.entry.expires}: ${a.id} (${a.pkg}) – ${a.entry.reason}`);
}
for (const a of unused) {
  console.info(`ℹ️  Allowlist-Eintrag ohne Treffer, kann entfernt werden: ${a.id} (${a.package})`);
}
let failed = false;
for (const a of blocking) {
  failed = true;
  console.error(`❌ ${a.severity}: ${a.id} (${a.pkg}) – ${a.title}`);
}
for (const a of expired) {
  failed = true;
  console.error(
    `❌ Ausnahme abgelaufen (${a.expires}): ${a.id} (${a.package}) – neu bewerten oder verlängern`,
  );
}
if (failed) {
  console.error('\nAudit-Gate: FEHLGESCHLAGEN');
  process.exit(1);
}
console.info(
  `✅ Audit-Gate bestanden (${accepted.length} akzeptierte, ${blocking.length} offene ${level}+-Findings)`,
);
