import { calculateMetrics, EnergyData, GRID_FEES_AND_TAXES } from './metrics';

describe('metrics.ts', () => {
  describe('calculateMetrics', () => {
    describe('Empty data handling', () => {
      it('should return null for empty data array', () => {
        const result = calculateMetrics([]);
        expect(result).toBeNull();
      });
    });

    describe('Basic metrics calculation', () => {
      const sampleData: EnergyData[] = [
        {
          timestamp: Date.now() - 3600000, // 1 hour ago
          marketPrice: 100, // 10 cent/kWh after conversion
          renewableShare: 50,
        },
        {
          timestamp: Date.now() - 1800000, // 30 min ago
          marketPrice: 200, // 20 cent/kWh after conversion
          renewableShare: 60,
        },
        {
          timestamp: Date.now() - 900000, // 15 min ago
          marketPrice: 150, // 15 cent/kWh after conversion
          renewableShare: 55,
        },
      ];

      it('should calculate correct average for renewable share', () => {
        const result = calculateMetrics(sampleData);
        expect(result).not.toBeNull();
        expect(result!.renewable.avg).toBeCloseTo(55, 1); // (50+60+55)/3 = 55
      });

      it('should calculate correct min/max for renewable share', () => {
        const result = calculateMetrics(sampleData);
        expect(result).not.toBeNull();
        expect(result!.renewable.min).toBe(50);
        expect(result!.renewable.max).toBe(60);
      });

      it('should calculate correct average for market price (with 0.1 conversion)', () => {
        const result = calculateMetrics(sampleData);
        expect(result).not.toBeNull();
        // (100*0.1 + 200*0.1 + 150*0.1) / 3 = 15
        expect(result!.marketPrice.avg).toBeCloseTo(15, 1);
      });

      it('should calculate correct min/max for market price (with 0.1 conversion)', () => {
        const result = calculateMetrics(sampleData);
        expect(result).not.toBeNull();
        expect(result!.marketPrice.min).toBeCloseTo(10, 1); // 100 * 0.1
        expect(result!.marketPrice.max).toBeCloseTo(20, 1); // 200 * 0.1
      });

      it('should calculate correct time range', () => {
        const result = calculateMetrics(sampleData);
        expect(result).not.toBeNull();
        expect(result!.timeRange.start).toBe(Math.min(...sampleData.map(d => d.timestamp)));
        expect(result!.timeRange.end).toBe(Math.max(...sampleData.map(d => d.timestamp)));
      });
    });

    describe('Null value handling', () => {
      it('should ignore null renewable share values', () => {
        const dataWithNulls: EnergyData[] = [
          { timestamp: Date.now(), marketPrice: 100, renewableShare: 50 },
          { timestamp: Date.now(), marketPrice: 100, renewableShare: null },
          { timestamp: Date.now(), marketPrice: 100, renewableShare: 60 },
        ];

        const result = calculateMetrics(dataWithNulls);
        expect(result).not.toBeNull();
        expect(result!.renewable.avg).toBeCloseTo(55, 1); // (50+60)/2 = 55
      });

      it('should ignore null market price values', () => {
        const dataWithNulls: EnergyData[] = [
          { timestamp: Date.now(), marketPrice: 100, renewableShare: 50 },
          { timestamp: Date.now(), marketPrice: null, renewableShare: 50 },
          { timestamp: Date.now(), marketPrice: 200, renewableShare: 50 },
        ];

        const result = calculateMetrics(dataWithNulls);
        expect(result).not.toBeNull();
        expect(result!.marketPrice.avg).toBeCloseTo(15, 1); // (100*0.1 + 200*0.1)/2 = 15
      });

      it('should return 0 for avg/min/max when all renewable values are null', () => {
        const dataAllNull: EnergyData[] = [
          { timestamp: Date.now(), marketPrice: 100, renewableShare: null },
          { timestamp: Date.now(), marketPrice: 100, renewableShare: null },
        ];

        const result = calculateMetrics(dataAllNull);
        expect(result).not.toBeNull();
        expect(result!.renewable.avg).toBe(0);
        expect(result!.renewable.min).toBe(0);
        expect(result!.renewable.max).toBe(0);
      });

      it('should return 0 for avg/min/max when all market price values are null', () => {
        const dataAllNull: EnergyData[] = [
          { timestamp: Date.now(), marketPrice: null, renewableShare: 50 },
          { timestamp: Date.now(), marketPrice: null, renewableShare: 50 },
        ];

        const result = calculateMetrics(dataAllNull);
        expect(result).not.toBeNull();
        expect(result!.marketPrice.avg).toBe(0);
        expect(result!.marketPrice.min).toBe(0);
        expect(result!.marketPrice.max).toBe(0);
      });
    });

    describe('Today metrics', () => {
      it('should calculate today metrics when data includes today', () => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const todayData: EnergyData[] = [
          { timestamp: todayStart + 3600000, marketPrice: 100, renewableShare: 50 },
          { timestamp: todayStart + 7200000, marketPrice: 200, renewableShare: 60 },
        ];

        const result = calculateMetrics(todayData);
        expect(result).not.toBeNull();
        expect(result!.today).toBeDefined();
        expect(result!.today?.date).toBe(now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }));
      });

      it('should not include today metrics when no data for today', () => {
        const yesterday = Date.now() - (24 * 60 * 60 * 1000);
        const yesterdayData: EnergyData[] = [
          { timestamp: yesterday, marketPrice: 100, renewableShare: 50 },
        ];

        const result = calculateMetrics(yesterdayData);
        expect(result).not.toBeNull();
        expect(result!.today).toBeUndefined();
      });

      it('should calculate end customer price correctly (market price + grid fees)', () => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const todayData: EnergyData[] = [
          { timestamp: todayStart + 3600000, marketPrice: 100, renewableShare: 50 }, // 10 cent/kWh
          { timestamp: todayStart + 7200000, marketPrice: 200, renewableShare: 60 }, // 20 cent/kWh
        ];

        const result = calculateMetrics(todayData);
        expect(result).not.toBeNull();
        expect(result!.today).toBeDefined();

        // Market price avg: (10+20)/2 = 15
        // End customer price avg: 15 + 20 = 35
        expect(result!.today!.endCustomerPrice.avg).toBeCloseTo(15 + GRID_FEES_AND_TAXES, 1);
        expect(result!.today!.endCustomerPrice.min).toBeCloseTo(10 + GRID_FEES_AND_TAXES, 1);
        expect(result!.today!.endCustomerPrice.max).toBeCloseTo(20 + GRID_FEES_AND_TAXES, 1);
      });

      it('should find current hour data within tolerance', () => {
        const nowMs = Date.now();
        const currentData: EnergyData[] = [
          { timestamp: nowMs - 10 * 60 * 1000, marketPrice: 150, renewableShare: 55 }, // 10 min ago (within 30min tolerance)
          { timestamp: nowMs - 3600000, marketPrice: 100, renewableShare: 50 }, // 1 hour ago (outside tolerance)
        ];

        const result = calculateMetrics(currentData);
        expect(result).not.toBeNull();
        expect(result!.today).toBeDefined();
        expect(result!.today!.renewable.current).toBe(55); // Should pick the closest one within tolerance
        expect(result!.today!.marketPrice.current).toBeCloseTo(15, 1); // 150 * 0.1
      });

      it('should return null for current values when no data within tolerance', () => {
        const nowMs = Date.now();
        const now = new Date(nowMs);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const oldData: EnergyData[] = [
          { timestamp: todayStart + 1000, marketPrice: 100, renewableShare: 50 }, // Today but 2+ hours ago from now
        ];

        const result = calculateMetrics(oldData);
        expect(result).not.toBeNull();
        // Data is from today, but outside 30-min tolerance for "current"
        expect(result!.today).toBeDefined();
        expect(result!.today!.renewable.current).toBeNull();
        expect(result!.today!.marketPrice.current).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should handle single data point', () => {
        const singleData: EnergyData[] = [
          { timestamp: Date.now(), marketPrice: 100, renewableShare: 50 },
        ];

        const result = calculateMetrics(singleData);
        expect(result).not.toBeNull();
        expect(result!.renewable.avg).toBe(50);
        expect(result!.renewable.min).toBe(50);
        expect(result!.renewable.max).toBe(50);
        expect(result!.marketPrice.avg).toBeCloseTo(10, 1);
        expect(result!.marketPrice.min).toBeCloseTo(10, 1);
        expect(result!.marketPrice.max).toBeCloseTo(10, 1);
      });

      it('should handle extreme values', () => {
        const extremeData: EnergyData[] = [
          { timestamp: Date.now(), marketPrice: 0, renewableShare: 0 },
          { timestamp: Date.now(), marketPrice: 1000, renewableShare: 100 },
        ];

        const result = calculateMetrics(extremeData);
        expect(result).not.toBeNull();
        expect(result!.renewable.avg).toBe(50);
        expect(result!.renewable.min).toBe(0);
        expect(result!.renewable.max).toBe(100);
        expect(result!.marketPrice.avg).toBeCloseTo(50, 1); // (0+100)/2
        expect(result!.marketPrice.min).toBe(0);
        expect(result!.marketPrice.max).toBeCloseTo(100, 1);
      });

      it('should handle negative market prices (possible in energy markets)', () => {
        const negativeData: EnergyData[] = [
          { timestamp: Date.now(), marketPrice: -100, renewableShare: 50 }, // -10 cent/kWh
          { timestamp: Date.now(), marketPrice: 100, renewableShare: 50 },  // +10 cent/kWh
        ];

        const result = calculateMetrics(negativeData);
        expect(result).not.toBeNull();
        expect(result!.marketPrice.avg).toBeCloseTo(0, 1); // (-10+10)/2
        expect(result!.marketPrice.min).toBeCloseTo(-10, 1);
        expect(result!.marketPrice.max).toBeCloseTo(10, 1);
      });

      it('should handle data with regional renewable share', () => {
        const regionalData: EnergyData[] = [
          {
            timestamp: Date.now(),
            marketPrice: 100,
            renewableShare: 50,
            renewableShareRegional: 70
          },
        ];

        const result = calculateMetrics(regionalData);
        expect(result).not.toBeNull();
        // Should still use renewableShare for metrics (not regional)
        expect(result!.renewable.avg).toBe(50);
      });

      it('should handle data with interpolation flags', () => {
        const interpolatedData: EnergyData[] = [
          {
            timestamp: Date.now(),
            marketPrice: 100,
            renewableShare: 50,
            isMarketPriceInterpolated: true,
            isRenewableShareInterpolated: false
          },
        ];

        const result = calculateMetrics(interpolatedData);
        expect(result).not.toBeNull();
        // Interpolation flags should not affect metrics calculation
        expect(result!.marketPrice.avg).toBeCloseTo(10, 1);
        expect(result!.renewable.avg).toBe(50);
      });
    });

    describe('GRID_FEES_AND_TAXES constant', () => {
      it('should export GRID_FEES_AND_TAXES constant', () => {
        expect(GRID_FEES_AND_TAXES).toBeDefined();
        expect(typeof GRID_FEES_AND_TAXES).toBe('number');
        expect(GRID_FEES_AND_TAXES).toBe(20); // Current value
      });
    });
  });
});
