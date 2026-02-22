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
