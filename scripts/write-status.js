#!/usr/bin/env node
/**
 * Schreibt public/data/status.json — ein Frische-Signal für die Datenpipeline.
 *
 * Motivation (Retrospektive zu #445/#446): Die Frage "läuft die Pipeline
 * gerade?" war nur durch manuelles Log-Lesen zu beantworten. Der Run-Status
 * taugte nicht dafür — grün bewies nicht, dass Daten ankamen (aWATTar-Fallback
 * ohne Erneuerbaren-Daten, HTTP 200 mit leeren Arrays), und rot war zwischen
 * Upstream-Ausfall und echtem Defekt nicht unterscheidbar.
 *
 * status.json beantwortet sie in einer Datei, ohne Zugriff auf GitHub Actions:
 * je Land Quelle, Abdeckung, Erneuerbaren-Punkte für heute und das Alter der
 * jüngsten Daten. Wird mit den Daten ausgeliefert und ist damit auch aus der
 * App bzw. dem Browser abrufbar.
 *
 * Aufruf: node scripts/write-status.js [datenverzeichnis]
 *         (Default-Verzeichnis: public/data)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.argv[2] || 'public/data';
const COUNTRIES = [
  { code: 'de', file: 'marketdata.json' },
  { code: 'nl', file: 'nl/marketdata.json' },
  { code: 'at', file: 'at/marketdata.json' },
  { code: 'ch', file: 'ch/marketdata.json' },
  { code: 'fr', file: 'fr/marketdata.json' },
  { code: 'be', file: 'be/marketdata.json' },
  { code: 'dk', file: 'dk/marketdata.json' },
];

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

function buildStatus(dataDir, now = Date.now()) {
  const today = berlinDay(now);
  const countries = {};

  for (const { code, file } of COUNTRIES) {
    const full = path.join(dataDir, file);
    if (!fs.existsSync(full)) continue;

    const json = readJson(full);
    if (!json || !Array.isArray(json.data) || json.data.length === 0) {
      countries[code] = { available: false };
      continue;
    }

    const timestamps = json.data.map((d) => d.start_timestamp);
    const coverageEnd = Math.max(...timestamps);

    countries[code] = {
      available: true,
      source: json.source ?? null,
      points: json.data.length,
      renewablePointsToday: json.data.filter(
        (d) => d.renewable_share != null && berlinDay(d.start_timestamp) === today
      ).length,
      coverageFrom: new Date(Math.min(...timestamps)).toISOString(),
      coverageUntil: new Date(coverageEnd).toISOString(),
      // Negativ, solange die Abdeckung in die Zukunft reicht — das ist der
      // Normalfall bei Day-Ahead-Preisen und genau das erwartete Signal.
      coverageAgeHours: Math.round(((now - coverageEnd) / 3_600_000) * 10) / 10,
    };
  }

  return {
    generatedAt: new Date(now).toISOString(),
    berlinDay: today,
    countries,
  };
}

if (require.main === module) {
  const status = buildStatus(DATA_DIR);
  const out = path.join(DATA_DIR, 'status.json');
  fs.writeFileSync(out, JSON.stringify(status, null, 2) + '\n');

  const de = status.countries.de;
  console.log(
    `status.json geschrieben — DE: ${de ? de.source : 'n/a'}, ` +
      `${de ? de.renewablePointsToday : 0} Erneuerbaren-Punkte heute, ` +
      `Abdeckung bis ${de ? de.coverageUntil : 'n/a'}`
  );
}

module.exports = { buildStatus, berlinDay };
