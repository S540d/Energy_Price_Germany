#!/usr/bin/env node
/**
 * Prüft, ob ein Android-Release-Build tatsächlich durch R8 gelaufen ist (#540).
 *
 * Hintergrund: vc31 (1.11.6) wurde nur mit D8 gedext. Die Play Console meldete
 * „Verschleierung 1 %“, sichtbar wurde das erst Tage nach dem Upload. R8 ist seit
 * #530 über `expo-build-properties` aktiv, greift aber nur, wenn `expo prebuild
 * --clean` die `android/gradle.properties` neu schreibt. Dieses Skript macht den
 * Fehler vor dem Upload sichtbar.
 *
 * Usage:
 *   node scripts/verify-aab.js [pfad/zum.aab]   # Default: android/app/build/outputs/bundle/release/app-release.aab
 *   node scripts/verify-aab.js --prebuild       # nur android/gradle.properties prüfen (direkt nach prebuild)
 *
 * Exit-Code 1 bei Fehlern (D8 statt R8, Mapping fehlt, R8-Properties fehlen).
 * Die Verschleierungsquote ist eine Schätzung aus mapping.txt, die Play Console
 * legt ihre Berechnung nicht offen — deshalb nur Warnung, kein Fehler.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_AAB = path.join(ROOT, 'android/app/build/outputs/bundle/release/app-release.aab');
const GRADLE_PROPERTIES = path.join(ROOT, 'android/gradle.properties');

const R8_METADATA = 'BUNDLE-METADATA/com.android.tools/r8.json';
const D8_METADATA = 'BUNDLE-METADATA/com.android.tools/d8.json';
const PROGUARD_MAP = 'BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map';
const DEX_PATTERN = /^base\/dex\/classes\d*\.dex$/;

const REQUIRED_PROPERTIES = [
  'android.enableMinifyInReleaseBuilds',
  'android.enableShrinkResourcesInReleaseBuilds',
];

// Play-Console-Grenzwert für jede Kategorie der DEX-Codeoptimierung
const OBFUSCATION_THRESHOLD = 0.25;
// vc31 ohne R8: ~26 MB DEX. Mit R8 erwartet deutlich weniger.
const DEX_WARN_BYTES = 20 * 1024 * 1024;

/** Prüft den Inhalt von android/gradle.properties auf die R8-Schalter. */
function checkGradleProperties(content) {
  const errors = [];
  const props = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$/);
    if (m) props[m[1]] = m[2];
  }
  for (const key of REQUIRED_PROPERTIES) {
    if (props[key] !== 'true') {
      errors.push(
        `${key} ist ${props[key] === undefined ? 'nicht gesetzt' : `"${props[key]}"`} – ` +
          'prebuild mit --clean wiederholen (npm run android:prebuild)'
      );
    }
  }
  return errors;
}

/**
 * Bewertet die Einträge eines AAB.
 * @param {{name: string, size: number}[]} entries
 */
function analyzeEntries(entries) {
  const names = new Set(entries.map((e) => e.name));
  const errors = [];
  const warnings = [];

  if (names.has(D8_METADATA)) {
    errors.push(`${D8_METADATA} gefunden – Build lief nur durch D8, nicht durch R8`);
  }
  if (!names.has(R8_METADATA)) {
    errors.push(`${R8_METADATA} fehlt – kein Nachweis, dass R8 lief`);
  }
  if (!names.has(PROGUARD_MAP)) {
    errors.push(`${PROGUARD_MAP} fehlt – kein Obfuskations-Mapping im Bundle`);
  }

  const dex = entries.filter((e) => DEX_PATTERN.test(e.name));
  const dexBytes = dex.reduce((sum, e) => sum + e.size, 0);
  if (dex.length === 0) {
    errors.push('keine DEX-Dateien unter base/dex/ gefunden');
  } else if (dexBytes > DEX_WARN_BYTES) {
    warnings.push(
      `DEX-Gesamtgröße ${formatMB(dexBytes)} – kaum kleiner als ohne R8 (vc31: ~26 MB)`
    );
  }

  return { errors, warnings, dexCount: dex.length, dexBytes };
}

/**
 * Schätzt den Anteil umbenannter Klassen aus einem R8-Mapping.
 * Klassenzeilen haben die Form `original.Name -> obfuscated.Name:`.
 */
function estimateObfuscation(mapping) {
  let total = 0;
  let renamed = 0;
  for (const line of mapping.split(/\r?\n/)) {
    const m = line.match(/^(\S+) -> (\S+):$/);
    if (!m) continue;
    total += 1;
    if (m[1] !== m[2]) renamed += 1;
  }
  return { total, renamed, ratio: total === 0 ? 0 : renamed / total };
}

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Liest Namen und Größen aller Einträge über `unzip -l`. */
function listZip(file) {
  const out = execFileSync('unzip', ['-l', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const entries = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+)$/);
    if (m) entries.push({ name: m[2].trim(), size: Number(m[1]) });
  }
  return entries;
}

function readZipEntry(file, entry) {
  return execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
}

function report(errors, warnings) {
  for (const w of warnings) console.warn(`⚠️  ${w}`);
  for (const e of errors) console.error(`❌ ${e}`);
}

function main(argv, { gradleProperties = GRADLE_PROPERTIES } = {}) {
  const prebuildOnly = argv.includes('--prebuild');
  const aab = path.resolve(argv.find((a) => !a.startsWith('--')) || DEFAULT_AAB);
  const errors = [];
  const warnings = [];

  if (fs.existsSync(gradleProperties)) {
    errors.push(...checkGradleProperties(fs.readFileSync(gradleProperties, 'utf8')));
  } else if (prebuildOnly) {
    errors.push(`${path.relative(ROOT, gradleProperties)} fehlt – prebuild nicht gelaufen?`);
  } else {
    warnings.push('android/gradle.properties nicht gefunden – nur das AAB wird geprüft');
  }

  if (prebuildOnly) {
    report(errors, warnings);
    if (errors.length) return 1;
    console.log('✅ R8-Properties in android/gradle.properties gesetzt');
    return 0;
  }

  if (!fs.existsSync(aab)) {
    report([...errors, `AAB nicht gefunden: ${aab}`], warnings);
    return 1;
  }

  const result = analyzeEntries(listZip(aab));
  errors.push(...result.errors);
  warnings.push(...result.warnings);

  let obfuscation = null;
  if (!result.errors.some((e) => e.includes(PROGUARD_MAP))) {
    obfuscation = estimateObfuscation(readZipEntry(aab, PROGUARD_MAP));
    if (obfuscation.ratio < OBFUSCATION_THRESHOLD) {
      warnings.push(
        `geschätzte Verschleierung ${(obfuscation.ratio * 100).toFixed(0)} % < 25 % – ` +
          'Keep-Regeln prüfen (#540, Schritt 5)'
      );
    }
  }

  console.log(`AAB: ${path.relative(process.cwd(), aab)}`);
  console.log(`DEX: ${result.dexCount} Datei(en), ${formatMB(result.dexBytes)}`);
  if (obfuscation) {
    console.log(
      `Verschleierung (Schätzung): ${obfuscation.renamed}/${obfuscation.total} Klassen umbenannt ` +
        `(${(obfuscation.ratio * 100).toFixed(0)} %)`
    );
  }
  report(errors, warnings);
  if (errors.length) return 1;
  console.log('✅ AAB wurde mit R8 gebaut und enthält das Mapping');
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { checkGradleProperties, analyzeEntries, estimateObfuscation, main };
