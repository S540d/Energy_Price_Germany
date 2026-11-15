/**
 * Utility for price alert threshold evaluation.
 * Works with end-customer prices in ¢/kWh.
 */

export type AlertState = 'none' | 'low' | 'high';

/**
 * Checks whether the current price triggers an alert.
 * - 'low': price is at or below alertLow → price is cheap, good time to use power
 * - 'high': price is at or above alertHigh → price is expensive
 * - 'none': no alert active or insufficient data
 */
export function checkPriceAlert(
  currentPrice: number | null,
  alertLow: number | null,
  alertHigh: number | null
): AlertState {
  if (currentPrice === null) return 'none';
  if (alertHigh !== null && currentPrice >= alertHigh) return 'high';
  if (alertLow !== null && currentPrice <= alertLow) return 'low';
  return 'none';
}

/**
 * Normalizes raw text input of a price threshold field.
 * - accepts comma or dot as decimal separator (German keyboards)
 * - strips everything except digits and one decimal separator
 * - `text` is what the field should display (keeps "2." / "0." while typing)
 * - `value` is the committed threshold: null for empty or non-positive input
 */
export function parseThresholdInput(raw: string): { text: string; value: number | null } {
  const cleaned = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  const text =
    firstDot === -1
      ? cleaned
      : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  const parsed = parseFloat(text);
  return { text, value: !isNaN(parsed) && parsed > 0 ? parsed : null };
}
