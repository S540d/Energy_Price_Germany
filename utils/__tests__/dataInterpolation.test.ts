/**
 * dataInterpolation Tests
 * Tests for data interpolation and missing value handling
 */

import type { InterpolatedDataPoint } from '../dataInterpolation';
import { interpolateMarketPrices, getInterpolationStats } from '../dataInterpolation';

describe('dataInterpolation', () => {
  describe('interpolateMarketPrices', () => {
    it('should return data with interpolated flags', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: 110, renewableShare: 55 },
      ];

      const result = interpolateMarketPrices(data);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('isMarketPriceInterpolated');
      expect(result[0]).toHaveProperty('isRenewableShareInterpolated');
    });

    it('should keep valid values unchanged', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: 110, renewableShare: 55 },
        { timestamp: 3000, marketPrice: 105, renewableShare: 52 },
      ];

      const result = interpolateMarketPrices(data);

      expect(result[0].marketPrice).toBe(100);
      expect(result[0].renewableShare).toBe(50);
      expect(result[0].isMarketPriceInterpolated).toBe(false);
      expect(result[0].isRenewableShareInterpolated).toBe(false);
    });

    it('should interpolate missing market price between two valid values', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: null, renewableShare: 55 },
        { timestamp: 3000, marketPrice: 110, renewableShare: 60 },
      ];

      const result = interpolateMarketPrices(data);

      expect(result[1].marketPrice).toBe(105); // Linear interpolation
      expect(result[1].isMarketPriceInterpolated).toBe(true);
    });

    it('should interpolate missing renewable share between two valid values', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: 110, renewableShare: null },
        { timestamp: 3000, marketPrice: 120, renewableShare: 60 },
      ];

      const result = interpolateMarketPrices(data);

      expect(result[1].renewableShare).toBe(55); // Linear interpolation
      expect(result[1].isRenewableShareInterpolated).toBe(true);
    });

    it('should forward fill when only previous value exists', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: null, renewableShare: null },
        { timestamp: 3000, marketPrice: null, renewableShare: null },
      ];

      const result = interpolateMarketPrices(data);

      expect(result[1].marketPrice).toBe(100);
      expect(result[1].renewableShare).toBe(50);
      expect(result[1].isMarketPriceInterpolated).toBe(true);
      expect(result[1].isRenewableShareInterpolated).toBe(true);
    });

    it('should backward fill when only next value exists', () => {
      const data = [
        { timestamp: 1000, marketPrice: null, renewableShare: null },
        { timestamp: 2000, marketPrice: 100, renewableShare: 50 },
      ];

      const result = interpolateMarketPrices(data);

      expect(result[0].marketPrice).toBe(100);
      expect(result[0].renewableShare).toBe(50);
      expect(result[0].isMarketPriceInterpolated).toBe(true);
      expect(result[0].isRenewableShareInterpolated).toBe(true);
    });

    it('should leave null values when no surrounding values exist', () => {
      const data = [{ timestamp: 1000, marketPrice: null, renewableShare: null }];

      const result = interpolateMarketPrices(data);

      expect(result[0].marketPrice).toBeNull();
      expect(result[0].renewableShare).toBeNull();
      expect(result[0].isMarketPriceInterpolated).toBe(false);
      expect(result[0].isRenewableShareInterpolated).toBe(false);
    });

    it('should handle multiple consecutive null values', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: null, renewableShare: null },
        { timestamp: 3000, marketPrice: null, renewableShare: null },
        { timestamp: 4000, marketPrice: 120, renewableShare: 60 },
      ];

      const result = interpolateMarketPrices(data);

      expect(result[1].marketPrice).toBeCloseTo(106.67, 1); // Interpolated between 100 and 120
      expect(result[2].marketPrice).toBeCloseTo(113.33, 1);
      expect(result[1].isMarketPriceInterpolated).toBe(true);
      expect(result[2].isMarketPriceInterpolated).toBe(true);
    });

    it('should handle empty array', () => {
      const data: any[] = [];

      const result = interpolateMarketPrices(data);

      expect(result).toEqual([]);
    });

    it('should preserve timestamps', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: null, renewableShare: null },
        { timestamp: 3000, marketPrice: 110, renewableShare: 60 },
      ];

      const result = interpolateMarketPrices(data);

      expect(result[0].timestamp).toBe(1000);
      expect(result[1].timestamp).toBe(2000);
      expect(result[2].timestamp).toBe(3000);
    });

    it('should interpolate both fields independently', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: null, renewableShare: 60 },
        { timestamp: 3000, marketPrice: 110, renewableShare: null },
        { timestamp: 4000, marketPrice: 120, renewableShare: 70 },
      ];

      const result = interpolateMarketPrices(data);

      // Middle point has partial data
      expect(result[1].marketPrice).toBe(105); // Interpolated
      expect(result[1].renewableShare).toBe(60); // Original
      expect(result[2].marketPrice).toBe(110); // Original
      expect(result[2].renewableShare).toBe(65); // Interpolated
    });

    it('should handle precision in interpolation', () => {
      const data = [
        { timestamp: 0, marketPrice: 10, renewableShare: 20 },
        { timestamp: 100, marketPrice: null, renewableShare: null },
        { timestamp: 200, marketPrice: 20, renewableShare: 40 },
      ];

      const result = interpolateMarketPrices(data);

      expect(result[1].marketPrice).toBe(15);
      expect(result[1].renewableShare).toBe(30);
    });
  });

  describe('getInterpolationStats', () => {
    it('should return correct stats for fully valid data', () => {
      const data: InterpolatedDataPoint[] = [
        {
          timestamp: 1000,
          marketPrice: 100,
          renewableShare: 50,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: false,
        },
        {
          timestamp: 2000,
          marketPrice: 110,
          renewableShare: 55,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: false,
        },
      ];

      const stats = getInterpolationStats(data);

      expect(stats.totalPoints).toBe(2);
      expect(stats.interpolatedMarketPriceCount).toBe(0);
      expect(stats.missingMarketPriceCount).toBe(0);
      expect(stats.interpolatedRenewableShareCount).toBe(0);
      expect(stats.missingRenewableShareCount).toBe(0);
    });

    it('should count interpolated market prices', () => {
      const data: InterpolatedDataPoint[] = [
        {
          timestamp: 1000,
          marketPrice: 100,
          renewableShare: 50,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: false,
        },
        {
          timestamp: 2000,
          marketPrice: 105,
          renewableShare: 55,
          isMarketPriceInterpolated: true,
          isRenewableShareInterpolated: false,
        },
      ];

      const stats = getInterpolationStats(data);

      expect(stats.interpolatedMarketPriceCount).toBe(1);
      expect(stats.missingMarketPriceCount).toBe(0);
    });

    it('should count missing market prices', () => {
      const data: InterpolatedDataPoint[] = [
        {
          timestamp: 1000,
          marketPrice: null,
          renewableShare: 50,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: false,
        },
      ];

      const stats = getInterpolationStats(data);

      expect(stats.missingMarketPriceCount).toBe(1);
    });

    it('should count interpolated renewable shares', () => {
      const data: InterpolatedDataPoint[] = [
        {
          timestamp: 1000,
          marketPrice: 100,
          renewableShare: 50,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: true,
        },
        {
          timestamp: 2000,
          marketPrice: 110,
          renewableShare: 55,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: false,
        },
      ];

      const stats = getInterpolationStats(data);

      expect(stats.interpolatedRenewableShareCount).toBe(1);
    });

    it('should count missing renewable shares', () => {
      const data: InterpolatedDataPoint[] = [
        {
          timestamp: 1000,
          marketPrice: 100,
          renewableShare: null,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: false,
        },
      ];

      const stats = getInterpolationStats(data);

      expect(stats.missingRenewableShareCount).toBe(1);
    });

    it('should handle empty data', () => {
      const data: InterpolatedDataPoint[] = [];

      const stats = getInterpolationStats(data);

      expect(stats.totalPoints).toBe(0);
      expect(stats.interpolatedMarketPriceCount).toBe(0);
      expect(stats.missingMarketPriceCount).toBe(0);
      expect(stats.interpolatedRenewableShareCount).toBe(0);
      expect(stats.missingRenewableShareCount).toBe(0);
    });

    it('should track all statistics simultaneously', () => {
      const data: InterpolatedDataPoint[] = [
        {
          timestamp: 1000,
          marketPrice: 100,
          renewableShare: 50,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: false,
        },
        {
          timestamp: 2000,
          marketPrice: 105,
          renewableShare: 55,
          isMarketPriceInterpolated: true,
          isRenewableShareInterpolated: false,
        },
        {
          timestamp: 3000,
          marketPrice: null,
          renewableShare: 60,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: false,
        },
        {
          timestamp: 4000,
          marketPrice: 115,
          renewableShare: 65,
          isMarketPriceInterpolated: false,
          isRenewableShareInterpolated: true,
        },
      ];

      const stats = getInterpolationStats(data);

      expect(stats.totalPoints).toBe(4);
      expect(stats.interpolatedMarketPriceCount).toBe(1);
      expect(stats.missingMarketPriceCount).toBe(1);
      expect(stats.interpolatedRenewableShareCount).toBe(1);
      expect(stats.missingRenewableShareCount).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle real-world scenario: aWATTar data with gaps', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: null, renewableShare: null },
        { timestamp: 3000, marketPrice: 110, renewableShare: 60 },
        { timestamp: 4000, marketPrice: null, renewableShare: null },
        { timestamp: 5000, marketPrice: 115, renewableShare: 65 },
      ];

      const result = interpolateMarketPrices(data);
      const stats = getInterpolationStats(result);

      expect(stats.totalPoints).toBe(5);
      expect(stats.interpolatedMarketPriceCount).toBe(2);
      expect(stats.missingMarketPriceCount).toBe(0);
      expect(stats.interpolatedRenewableShareCount).toBe(2);
      expect(stats.missingRenewableShareCount).toBe(0);
    });

    it('should handle real-world scenario: sparse data with long gaps', () => {
      const data = [
        { timestamp: 1000, marketPrice: 100, renewableShare: 50 },
        { timestamp: 2000, marketPrice: null, renewableShare: null },
        { timestamp: 3000, marketPrice: null, renewableShare: null },
        { timestamp: 4000, marketPrice: null, renewableShare: null },
        { timestamp: 5000, marketPrice: 150, renewableShare: 80 },
      ];

      const result = interpolateMarketPrices(data);

      // Points 1-3 should be interpolated from 100→150 over timestamps 1000→5000
      expect(result[1].marketPrice).toBeCloseTo(112.5);
      expect(result[2].marketPrice).toBeCloseTo(125);
      expect(result[3].marketPrice).toBeCloseTo(137.5);
    });
  });
});
