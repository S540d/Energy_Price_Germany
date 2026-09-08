/**
 * Fallback für die Kachel „Erneuerbare jetzt“, wenn der *nationale*
 * Erneuerbaren-Anteil für heute fehlt.
 *
 * Hintergrund: Nationale und regionale Erneuerbaren-Werte kommen aus zwei
 * getrennten Quellen über zwei getrennte Wege:
 *
 * - national: `ren_share_forecast` → GitHub-Actions-Workflow (`fetch.yml`) →
 *   committete `marketdata.json` → statisch ausgeliefert
 * - regional: Signal API (`/signal?postal_code=…`) → live im Client über den
 *   Cloudflare Worker
 *
 * Fällt nur der erste Weg aus (bekannter stummer Fall: HTTP 200 mit leeren
 * Arrays), liegen weiterhin gültige regionale Werte vor. Die zeigte die App
 * bisher zwar im Chart, wertete sie aber in keiner Kennzahl aus – die Kachel
 * blieb auf `--` stehen, obwohl ein brauchbarer Wert vorlag.
 *
 * ⚠️ Ein Ortswert ist NICHT der Bundeswert. Die Signal API liefert den
 * Erneuerbaren-Anteil an der Last in der jeweiligen Netzregion; die Streuung
 * zwischen windreichem Norden und lastschweren Ballungsräumen liegt regelmäßig
 * über Faktor 2. Jeder hier berechnete Wert MUSS in der UI als Ortswert
 * gekennzeichnet werden (siehe `KpiCard`-Prop `note`) und darf nie als
 * bundesweite Zahl erscheinen.
 */

import type { EnergyData } from './metrics';
import type { RegionalDataResponse } from './apiValidation';

/** Zeitfenster um „jetzt“, in dem ein Datenpunkt als aktueller Wert gilt. */
const CURRENT_TOLERANCE_MS = 30 * 60 * 1000;

/**
 * Herkunft des Ersatzwerts – entscheidet über die Beschriftung in der UI.
 *
 * - `own`: PLZ des Nutzers, also dessen eigene Region
 * - `default`: Ersatzort aus der Country-Registry (DE: Berlin), weil keine
 *   eigene PLZ gesetzt ist
 */
export type RenewableFallbackSource = 'own' | 'default';

export interface RenewableFallback {
  /** Wert zum aktuellen Zeitpunkt, `null` wenn kein Punkt im Toleranzfenster liegt. */
  current: number | null;
  /** Tagesmittel über alle heutigen Punkte, `null` wenn es keine gibt. */
  avg: number | null;
  source: RenewableFallbackSource;
}

interface Sample {
  timestamp: number;
  value: number;
}

function isToday(timestamp: number, now: Date): boolean {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return timestamp >= start && timestamp < start + 24 * 60 * 60 * 1000;
}

function summarize(
  samples: Sample[],
  source: RenewableFallbackSource,
  now: Date
): RenewableFallback | null {
  if (samples.length === 0) return null;

  const nowMs = now.getTime();
  const currentSample = samples
    .filter(s => Math.abs(s.timestamp - nowMs) < CURRENT_TOLERANCE_MS)
    .sort((a, b) => Math.abs(a.timestamp - nowMs) - Math.abs(b.timestamp - nowMs))[0];

  const todaySamples = samples.filter(s => isToday(s.timestamp, now));

  const current = currentSample ? currentSample.value : null;
  const avg =
    todaySamples.length > 0
      ? todaySamples.reduce((sum, s) => sum + s.value, 0) / todaySamples.length
      : null;

  // Ohne beides ist der Fallback wertlos – dann lieber ehrlich `--` zeigen.
  if (current === null && avg === null) return null;

  return { current, avg, source };
}

export interface RenewableKpi {
  current: number | null;
  avg: number | null;
  /** true, wenn die Werte aus dem Ortswert stammen und gekennzeichnet werden müssen. */
  usesFallback: boolean;
  fallbackSource: RenewableFallbackSource | null;
}

/**
 * Bestimmt, was die Kachel „Erneuerbare jetzt“ anzeigt.
 *
 * Nationale Werte haben immer Vorrang. Der Ortswert tritt nur ein, wenn heute
 * **kein einziger** nationaler Wert vorliegt – ein Mischen beider Quellen (etwa
 * nationaler Tages-Ø neben aktuellem Ortswert) wäre irreführend, weil die
 * beiden Zahlen dann Unterschiedliches messen.
 */
export function resolveRenewableKpi(
  today: { current: number | null; avg: number | null } | null | undefined,
  fallback: RenewableFallback | null
): RenewableKpi {
  const hasNational = today != null && (today.current !== null || today.avg !== null);

  if (hasNational) {
    return {
      current: today?.current ?? null,
      avg: today?.avg ?? null,
      usesFallback: false,
      fallbackSource: null,
    };
  }

  if (fallback) {
    return {
      current: fallback.current,
      avg: fallback.avg,
      usesFallback: true,
      fallbackSource: fallback.source,
    };
  }

  return { current: null, avg: null, usesFallback: false, fallbackSource: null };
}

/**
 * Ersatzwert aus bereits gemergten Regionaldaten (Feld `renewableShareRegional`).
 * Greift, wenn der Nutzer eine eigene PLZ gesetzt hat.
 */
export function renewableFallbackFromEnergyData(
  data: EnergyData[],
  now: Date = new Date()
): RenewableFallback | null {
  const samples: Sample[] = [];
  for (const item of data) {
    const value = item.renewableShareRegional;
    if (value !== null && value !== undefined && Number.isFinite(value)) {
      samples.push({ timestamp: item.timestamp, value });
    }
  }
  return summarize(samples, 'own', now);
}

/**
 * Ersatzwert direkt aus einer Signal-API-Antwort, ohne sie in die
 * Chart-Daten zu mergen. Wird für den Ersatzort verwendet, damit der Chart
 * unverändert bleibt (keine Regionallinie für einen Ort, den der Nutzer nie
 * ausgewählt hat).
 */
export function renewableFallbackFromRegionalResponse(
  response: RegionalDataResponse | null,
  now: Date = new Date()
): RenewableFallback | null {
  if (!response || !Array.isArray(response.unix_seconds) || !Array.isArray(response.share)) {
    return null;
  }
  if (response.unix_seconds.length !== response.share.length) return null;

  const samples: Sample[] = [];
  for (let i = 0; i < response.unix_seconds.length; i++) {
    const value = response.share[i];
    const seconds = response.unix_seconds[i];
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      typeof seconds === 'number' &&
      Number.isFinite(seconds)
    ) {
      // Signal API kann Werte knapp außerhalb 0–100 liefern (gleiche Kappung
      // wie in dataMerger.ts, damit Kachel und Chart nicht auseinanderlaufen).
      samples.push({ timestamp: seconds * 1000, value: Math.max(0, Math.min(100, value)) });
    }
  }
  return summarize(samples, 'default', now);
}
