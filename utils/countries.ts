/**
 * Country registry – single source of truth for multi-country support.
 *
 * Each supported country derives its data paths, timezone, regional-data
 * capability and default grid fees from here. Adding a new country should,
 * in the ideal case, require only a new entry in COUNTRIES plus a matching
 * data pipeline (see .github/workflows/fetch.yml) – no scattered `if country
 * === 'de'` checks elsewhere.
 *
 * Background: Energy Charts (Fraunhofer ISE) already serves national price +
 * renewable-share data per country via `?country=<code>`. Germany stays on the
 * legacy flat data paths for backward compatibility with already-deployed
 * clients; new countries live under `data/<code>/`.
 */

export type CountryCode = 'de' | 'nl' | 'at' | 'ch';

export interface CountryConfig {
  /** Internal country code (matches storage namespace + data folder). */
  code: CountryCode;
  /** Country code passed to the Energy Charts API (`?country=`). */
  energyChartsCountry: string;
  /** Flag emoji for compact UI display. */
  flag: string;
  /** translations key for the human-readable country name (must exist in EN+DE). */
  translationKey: 'countryGermany' | 'countryNetherlands' | 'countryAustria' | 'countrySwitzerland';
  /** Whether the country is still rolling out (shows a BETA badge). */
  beta: boolean;
  /** IANA timezone used for day boundaries in the historical store. */
  timezone: string;
  /** ISO 4217 currency code. All currently supported countries use EUR. */
  currency: 'EUR';
  /**
   * Whether postal-code based regional data is available. Only Germany has the
   * Energy Charts Signal API wired up (via the Cloudflare Worker); other
   * countries expose national values only and hide the PLZ UI entirely.
   */
  hasRegionalData: boolean;
  /** Path (relative to the public data root) of the national market data file. */
  marketDataPath: string;
  /** Path prefix (relative to the public data root) for per-day history files. */
  historyPathPrefix: string;
  /** Default grid fees & taxes in ¢/kWh used as the per-country starting value. */
  defaultGridFeesCentPerKwh: number;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  de: {
    code: 'de',
    energyChartsCountry: 'de',
    flag: '🇩🇪',
    translationKey: 'countryGermany',
    beta: false,
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    hasRegionalData: true,
    // Legacy flat paths – kept for backward compatibility with deployed clients.
    marketDataPath: 'data/marketdata.json',
    historyPathPrefix: 'data/history/',
    defaultGridFeesCentPerKwh: 20,
  },
  nl: {
    code: 'nl',
    energyChartsCountry: 'nl',
    flag: '🇳🇱',
    translationKey: 'countryNetherlands',
    beta: true,
    // Amsterdam == Berlin (both CET/CEST) – day boundaries align with DE.
    timezone: 'Europe/Amsterdam',
    currency: 'EUR',
    hasRegionalData: false,
    marketDataPath: 'data/nl/marketdata.json',
    historyPathPrefix: 'data/nl/history/',
    defaultGridFeesCentPerKwh: 20,
  },
  at: {
    code: 'at',
    energyChartsCountry: 'at',
    flag: '🇦🇹',
    translationKey: 'countryAustria',
    beta: true,
    timezone: 'Europe/Vienna',
    currency: 'EUR',
    hasRegionalData: false,
    marketDataPath: 'data/at/marketdata.json',
    historyPathPrefix: 'data/at/history/',
    defaultGridFeesCentPerKwh: 20,
  },
  ch: {
    code: 'ch',
    energyChartsCountry: 'ch',
    flag: '🇨🇭',
    translationKey: 'countrySwitzerland',
    beta: true,
    timezone: 'Europe/Zurich',
    currency: 'EUR',
    hasRegionalData: false,
    marketDataPath: 'data/ch/marketdata.json',
    historyPathPrefix: 'data/ch/history/',
    defaultGridFeesCentPerKwh: 20,
  },
};

export const DEFAULT_COUNTRY: CountryCode = 'de';

export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

/** Type guard for persisted/untrusted country values. */
export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && value in COUNTRIES;
}
