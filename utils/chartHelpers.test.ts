import { getYAxisLabelCenterPosition, getYAxisLabelStyle } from './chartHelpers';

describe('chartHelpers.ts', () => {
  describe('getYAxisLabelCenterPosition', () => {
    it('should calculate center position for chart height without offset', () => {
      const chartHeight = 200;
      const result = getYAxisLabelCenterPosition(chartHeight);
      expect(result).toBe(100); // 200 / 2 + 0 = 100
    });

    it('should calculate center position for chart height with positive offset', () => {
      const chartHeight = 200;
      const horizontalOffset = 15;
      const result = getYAxisLabelCenterPosition(chartHeight, horizontalOffset);
      expect(result).toBe(115); // 200 / 2 + 15 = 115
    });

    it('should calculate center position for chart height with negative offset', () => {
      const chartHeight = 200;
      const horizontalOffset = -20;
      const result = getYAxisLabelCenterPosition(chartHeight, horizontalOffset);
      expect(result).toBe(80); // 200 / 2 - 20 = 80
    });

    it('should handle chart height of 0', () => {
      const chartHeight = 0;
      const result = getYAxisLabelCenterPosition(chartHeight);
      expect(result).toBe(0); // 0 / 2 + 0 = 0
    });

    it('should handle small chart heights', () => {
      const chartHeight = 50;
      const result = getYAxisLabelCenterPosition(chartHeight);
      expect(result).toBe(25); // 50 / 2 = 25
    });

    it('should handle large chart heights', () => {
      const chartHeight = 1000;
      const horizontalOffset = -15;
      const result = getYAxisLabelCenterPosition(chartHeight, horizontalOffset);
      expect(result).toBe(485); // 1000 / 2 - 15 = 485
    });

    it('should handle fractional chart heights', () => {
      const chartHeight = 333.33;
      const horizontalOffset = 10.5;
      const result = getYAxisLabelCenterPosition(chartHeight, horizontalOffset);
      expect(result).toBeCloseTo(177.165, 2); // 333.33 / 2 + 10.5 ≈ 177.165
    });
  });

  describe('getYAxisLabelStyle', () => {
    describe('Desktop mode (isPhone = false)', () => {
      it('should return correct style object with default parameters', () => {
        const chartHeight = 200;
        const result = getYAxisLabelStyle(chartHeight);

        expect(result).toEqual({
          position: 'absolute',
          left: -90, // Desktop default
          top: 100, // chartHeight / 2
          fontSize: 12,
          color: '#333',
          fontWeight: '600',
          transform: [{ rotate: '-90deg' }],
          width: 200,
          textAlign: 'center',
        });
      });

      it('should apply custom horizontal offset', () => {
        const chartHeight = 200;
        const horizontalOffset = 15;
        const result = getYAxisLabelStyle(chartHeight, horizontalOffset);

        expect(result.top).toBe(115); // 200 / 2 + 15
        expect(result.left).toBe(-90); // Desktop default
      });

      it('should apply custom text color', () => {
        const chartHeight = 200;
        const horizontalOffset = 0;
        const textColor = '#FF0000';
        const result = getYAxisLabelStyle(chartHeight, horizontalOffset, textColor);

        expect(result.color).toBe('#FF0000');
      });

      it('should use desktop left offset when isPhone is false', () => {
        const chartHeight = 200;
        const result = getYAxisLabelStyle(chartHeight, 0, '#333', false);

        expect(result.left).toBe(-90);
      });
    });

    describe('Phone mode (isPhone = true)', () => {
      it('should use phone left offset when isPhone is true', () => {
        const chartHeight = 200;
        const result = getYAxisLabelStyle(chartHeight, 0, '#333', true);

        expect(result.left).toBe(-95); // Phone has more spacing
      });

      it('should maintain other properties in phone mode', () => {
        const chartHeight = 200;
        const horizontalOffset = 10;
        const textColor = '#00FF00';
        const result = getYAxisLabelStyle(chartHeight, horizontalOffset, textColor, true);

        expect(result).toEqual({
          position: 'absolute',
          left: -95, // Phone mode
          top: 110, // 200 / 2 + 10
          fontSize: 12,
          color: '#00FF00',
          fontWeight: '600',
          transform: [{ rotate: '-90deg' }],
          width: 200,
          textAlign: 'center',
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle zero chart height', () => {
        const chartHeight = 0;
        const result = getYAxisLabelStyle(chartHeight);

        expect(result.top).toBe(0);
        expect(result).toHaveProperty('position', 'absolute');
        expect(result).toHaveProperty('fontSize', 12);
      });

      it('should handle very large chart height', () => {
        const chartHeight = 2000;
        const result = getYAxisLabelStyle(chartHeight);

        expect(result.top).toBe(1000);
      });

      it('should handle negative horizontal offset', () => {
        const chartHeight = 200;
        const horizontalOffset = -50;
        const result = getYAxisLabelStyle(chartHeight, horizontalOffset);

        expect(result.top).toBe(50); // 200 / 2 - 50
      });

      it('should handle all custom parameters together', () => {
        const chartHeight = 300;
        const horizontalOffset = 25;
        const textColor = '#123456';
        const isPhone = true;

        const result = getYAxisLabelStyle(chartHeight, horizontalOffset, textColor, isPhone);

        expect(result).toEqual({
          position: 'absolute',
          left: -95, // Phone mode
          top: 175, // 300 / 2 + 25
          fontSize: 12,
          color: '#123456',
          fontWeight: '600',
          transform: [{ rotate: '-90deg' }],
          width: 200,
          textAlign: 'center',
        });
      });

      it('should maintain immutable properties', () => {
        const chartHeight = 200;
        const result = getYAxisLabelStyle(chartHeight);

        // Check that certain properties are always the same
        expect(result.fontSize).toBe(12);
        expect(result.fontWeight).toBe('600');
        expect(result.width).toBe(200);
        expect(result.textAlign).toBe('center');
        expect(result.transform).toEqual([{ rotate: '-90deg' }]);
      });

      it('should handle fractional values', () => {
        const chartHeight = 333.33;
        const horizontalOffset = 10.5;
        const result = getYAxisLabelStyle(chartHeight, horizontalOffset);

        expect(result.top).toBeCloseTo(177.165, 2);
      });
    });

    describe('TypeScript const assertions', () => {
      it('should have position as const type', () => {
        const result = getYAxisLabelStyle(200);
        expect(result.position).toBe('absolute');
      });

      it('should have fontWeight as const type', () => {
        const result = getYAxisLabelStyle(200);
        expect(result.fontWeight).toBe('600');
      });

      it('should have textAlign as const type', () => {
        const result = getYAxisLabelStyle(200);
        expect(result.textAlign).toBe('center');
      });
    });
  });
});
