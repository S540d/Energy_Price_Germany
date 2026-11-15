import { useState } from 'react';
import { checkPriceAlert } from '../utils/priceAlertUtils';
import type { AlertState } from '../utils/priceAlertUtils';

/**
 * Derives the alert state from price and thresholds, remembering the previous
 * state so that the hysteresis in checkPriceAlert can prevent flapping.
 */
export function usePriceAlertState(
  currentPrice: number | null,
  alertLow: number | null,
  alertHigh: number | null
): AlertState {
  const [previous, setPrevious] = useState<AlertState>('none');
  const next = checkPriceAlert(currentPrice, alertLow, alertHigh, previous);
  if (next !== previous) setPrevious(next);
  return next;
}
