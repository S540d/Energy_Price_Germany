import { checkPriceAlert } from '../priceAlertUtils';
import type { AlertState } from '../priceAlertUtils';

describe('priceAlertUtils', () => {
  describe('checkPriceAlert', () => {
    describe('null currentPrice', () => {
      it('returns none when currentPrice is null', () => {
        expect(checkPriceAlert(null, 20, 40)).toBe<AlertState>('none');
      });

      it('returns none when currentPrice is null and no thresholds set', () => {
        expect(checkPriceAlert(null, null, null)).toBe<AlertState>('none');
      });
    });

    describe('no thresholds set', () => {
      it('returns none when both thresholds are null', () => {
        expect(checkPriceAlert(30, null, null)).toBe<AlertState>('none');
      });
    });

    describe('high threshold', () => {
      it('returns high when price equals alertHigh', () => {
        expect(checkPriceAlert(40, null, 40)).toBe<AlertState>('high');
      });

      it('returns high when price is above alertHigh', () => {
        expect(checkPriceAlert(50, null, 40)).toBe<AlertState>('high');
      });

      it('returns none when price is below alertHigh', () => {
        expect(checkPriceAlert(39, null, 40)).toBe<AlertState>('none');
      });
    });

    describe('low threshold', () => {
      it('returns low when price equals alertLow', () => {
        expect(checkPriceAlert(20, 20, null)).toBe<AlertState>('low');
      });

      it('returns low when price is below alertLow', () => {
        expect(checkPriceAlert(15, 20, null)).toBe<AlertState>('low');
      });

      it('returns none when price is above alertLow', () => {
        expect(checkPriceAlert(21, 20, null)).toBe<AlertState>('none');
      });
    });

    describe('both thresholds set', () => {
      it('returns none when price is between thresholds', () => {
        expect(checkPriceAlert(30, 20, 40)).toBe<AlertState>('none');
      });

      it('returns high when price triggers both thresholds (high has priority)', () => {
        // alertLow=40, alertHigh=20 → conflict: both triggered at price=30
        expect(checkPriceAlert(30, 40, 20)).toBe<AlertState>('high');
      });

      it('returns high when price equals alertHigh with alertLow also set', () => {
        expect(checkPriceAlert(40, 20, 40)).toBe<AlertState>('high');
      });

      it('returns low when price equals alertLow with alertHigh also set', () => {
        expect(checkPriceAlert(20, 20, 40)).toBe<AlertState>('low');
      });
    });

    describe('boundary conditions', () => {
      it('returns high priority over low when price is exactly at alertHigh', () => {
        // high is checked before low in checkPriceAlert
        expect(checkPriceAlert(20, 20, 20)).toBe<AlertState>('high');
      });

      it('handles very small prices correctly', () => {
        expect(checkPriceAlert(0.1, 1, null)).toBe<AlertState>('low');
      });

      it('handles very large prices correctly', () => {
        expect(checkPriceAlert(999, null, 100)).toBe<AlertState>('high');
      });
    });
  });
});
