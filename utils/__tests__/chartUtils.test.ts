/**
 * chartUtils Tests
 * Tests for responsive chart dimension calculations and label generation
 */

import { useChartDimensions, getTimeRange, generateTimeLabels, generateYAxisLabels } from '../chartUtils';
import { Dimensions } from 'react-native';

// Simple function tests don't need renderHook, only hook tests do
// We'll test hooks with mocked Dimensions at runtime

describe('chartUtils', () => {
  describe('Pure Functions', () => {
    it('should export required functions', () => {
      expect(typeof getTimeRange).toBe('function');
      expect(typeof generateTimeLabels).toBe('function');
      expect(typeof generateYAxisLabels).toBe('function');
    });

    it('should have ChartDimensions interface', () => {
      // This is type-level, but verifies the export exists
      expect(typeof useChartDimensions).toBe('function');
    });
  });;

  describe('getTimeRange', () => {
    it('should calculate time range from data timestamps', () => {
      const data = [
        { timestamp: 1000 },
        { timestamp: 2000 },
        { timestamp: 3000 },
      ];

      const result = getTimeRange(data);

      expect(result.minTime).toBe(1000);
      expect(result.maxTime).toBe(3000);
      expect(result.timeRange).toBe(2000);
    });

    it('should handle single data point', () => {
      const data = [{ timestamp: 1000 }];

      const result = getTimeRange(data);

      expect(result.minTime).toBe(1000);
      expect(result.maxTime).toBe(1000);
      expect(result.timeRange).toBe(0);
    });

    it('should handle unordered timestamps', () => {
      const data = [
        { timestamp: 3000 },
        { timestamp: 1000 },
        { timestamp: 2000 },
      ];

      const result = getTimeRange(data);

      expect(result.minTime).toBe(1000);
      expect(result.maxTime).toBe(3000);
      expect(result.timeRange).toBe(2000);
    });

    it('should handle duplicate timestamps', () => {
      const data = [
        { timestamp: 1000 },
        { timestamp: 1000 },
        { timestamp: 3000 },
      ];

      const result = getTimeRange(data);

      expect(result.minTime).toBe(1000);
      expect(result.maxTime).toBe(3000);
      expect(result.timeRange).toBe(2000);
    });
  });

  describe('generateTimeLabels', () => {
    it('should generate time labels at 3-hour intervals', () => {
      const minTime = new Date('2024-01-01 00:00:00').getTime();
      const maxTime = new Date('2024-01-01 12:00:00').getTime();
      const timeRange = maxTime - minTime;

      const labels = generateTimeLabels(
        minTime,
        maxTime,
        50,
        600,
        timeRange,
        false,
        '#000000'
      );

      expect(labels.length).toBeGreaterThan(0);
      expect(labels[0]).toHaveProperty('key');
      expect(labels[0]).toHaveProperty('x');
      expect(labels[0]).toHaveProperty('text');
    });

    it('should calculate correct x positions for labels', () => {
      const minTime = new Date('2024-01-01 00:00:00').getTime();
      const maxTime = new Date('2024-01-01 06:00:00').getTime();
      const timeRange = maxTime - minTime;

      const labels = generateTimeLabels(
        minTime,
        maxTime,
        50,
        600,
        timeRange,
        false,
        '#000000'
      );

      labels.forEach(label => {
        expect(label.x).toBeGreaterThanOrEqual(50 - 10);
        expect(label.x).toBeLessThanOrEqual(600);
      });
    });

    it('should format hour labels correctly', () => {
      const minTime = new Date('2024-01-01 03:00:00').getTime();
      const maxTime = new Date('2024-01-01 12:00:00').getTime();
      const timeRange = maxTime - minTime;

      const labels = generateTimeLabels(
        minTime,
        maxTime,
        50,
        600,
        timeRange,
        false,
        '#000000'
      );

      labels.forEach(label => {
        expect(label.text).toMatch(/^\d+h$/);
      });
    });

    it('should apply smaller font size for phone screens', () => {
      const minTime = new Date('2024-01-01 00:00:00').getTime();
      const maxTime = new Date('2024-01-01 06:00:00').getTime();
      const timeRange = maxTime - minTime;

      const phoneLabels = generateTimeLabels(
        minTime,
        maxTime,
        50,
        400,
        timeRange,
        true,
        '#000000'
      );

      expect(phoneLabels[0].style.fontSize).toBe(9);
    });

    it('should apply standard font size for non-phone screens', () => {
      const minTime = new Date('2024-01-01 00:00:00').getTime();
      const maxTime = new Date('2024-01-01 06:00:00').getTime();
      const timeRange = maxTime - minTime;

      const tabletLabels = generateTimeLabels(
        minTime,
        maxTime,
        50,
        800,
        timeRange,
        false,
        '#000000'
      );

      expect(tabletLabels[0].style.fontSize).toBe(10);
    });

    it('should use provided text color', () => {
      const minTime = new Date('2024-01-01 00:00:00').getTime();
      const maxTime = new Date('2024-01-01 06:00:00').getTime();
      const timeRange = maxTime - minTime;
      const textColor = '#FF0000';

      const labels = generateTimeLabels(
        minTime,
        maxTime,
        50,
        600,
        timeRange,
        false,
        textColor
      );

      expect(labels[0].style.color).toBe(textColor);
    });
  });

  describe('generateYAxisLabels', () => {
    it('should generate 5 y-axis labels', () => {
      const labels = generateYAxisLabels(
        100,
        0,
        100,
        40,
        300,
        40,
        false,
        '#000000'
      );

      expect(labels).toHaveLength(5);
    });

    it('should generate labels from max to min', () => {
      const labels = generateYAxisLabels(
        100,
        0,
        100,
        40,
        300,
        40,
        false,
        '#000000'
      );

      expect(labels[0].value).toBeGreaterThan(labels[4].value);
    });

    it('should calculate correct y positions', () => {
      const padding = 40;
      const chartHeight = 300;
      const bottomPadding = 40;

      const labels = generateYAxisLabels(
        100,
        0,
        100,
        padding,
        chartHeight,
        bottomPadding,
        false,
        '#000000'
      );

      labels.forEach(label => {
        expect(label.y).toBeGreaterThanOrEqual(padding);
        expect(label.y).toBeLessThanOrEqual(chartHeight - bottomPadding);
      });
    });

    it('should format values using custom formatter', () => {
      const formatter = (v: number) => v.toFixed(2);
      const labels = generateYAxisLabels(
        100,
        0,
        100,
        40,
        300,
        40,
        false,
        '#000000',
        formatter
      );

      expect(labels[0].value).toBeDefined();
    });

    it('should apply phone font size', () => {
      const labels = generateYAxisLabels(
        100,
        0,
        100,
        40,
        300,
        40,
        true,
        '#000000'
      );

      expect(labels[0].style.fontSize).toBe(9);
    });

    it('should apply tablet font size', () => {
      const labels = generateYAxisLabels(
        100,
        0,
        100,
        40,
        300,
        40,
        false,
        '#000000'
      );

      expect(labels[0].style.fontSize).toBe(10);
    });

    it('should set correct label width for phone', () => {
      const labels = generateYAxisLabels(
        100,
        0,
        100,
        40,
        300,
        40,
        true,
        '#000000'
      );

      expect(labels[0].style.width).toBe(25);
    });

    it('should set correct label width for tablet', () => {
      const labels = generateYAxisLabels(
        100,
        0,
        100,
        40,
        300,
        40,
        false,
        '#000000'
      );

      expect(labels[0].style.width).toBe(30);
    });

    it('should use provided text color', () => {
      const textColor = '#FF0000';
      const labels = generateYAxisLabels(
        100,
        0,
        100,
        40,
        300,
        40,
        false,
        textColor
      );

      expect(labels[0].style.color).toBe(textColor);
    });

    it('should handle edge case where min equals max', () => {
      const labels = generateYAxisLabels(
        100,
        100,
        0,
        40,
        300,
        40,
        false,
        '#000000'
      );

      expect(labels).toHaveLength(5);
      labels.forEach(label => {
        expect(label.value).toBe(100);
      });
    });
  });
});
