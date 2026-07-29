import {
  scaleToX,
  scaleToY,
  getPlotWidth,
  getPlotHeight,
  getBarWidth,
  getBarHeight,
} from '../chartScale';

const xScale = {
  domainMin: 1000,
  domainRange: 4000,
  chartWidth: 340,
  leftPadding: 40,
  rightPadding: 20,
};

const yScale = {
  domainMin: 0,
  domainRange: 50,
  chartHeight: 220,
  padding: 20,
  bottomPadding: 40,
};

describe('chartScale', () => {
  describe('getPlotWidth / getPlotHeight', () => {
    it('subtracts both paddings', () => {
      expect(getPlotWidth(340, 40, 20)).toBe(280);
      expect(getPlotHeight(220, 20, 40)).toBe(160);
    });
  });

  describe('scaleToX', () => {
    it('maps the domain minimum to the left padding', () => {
      expect(scaleToX(1000, xScale)).toBe(40);
    });

    it('maps the domain maximum to the right edge of the plot area', () => {
      // leftPadding + plotWidth = 40 + 280 = 320 = chartWidth - rightPadding
      expect(scaleToX(5000, xScale)).toBe(320);
      expect(scaleToX(5000, xScale)).toBe(xScale.chartWidth - xScale.rightPadding);
    });

    it('maps the domain midpoint to the centre of the plot area', () => {
      expect(scaleToX(3000, xScale)).toBe(180);
    });

    it('never lets a scaled value run under the right padding', () => {
      // Regression: the tooltip call sites used to omit rightPadding from the
      // plot width, which pushed the marker past the last bar.
      const maxX = scaleToX(5000, xScale);
      expect(maxX).toBeLessThanOrEqual(xScale.chartWidth - xScale.rightPadding);
    });

    it('collapses to the left padding when the domain has no range', () => {
      expect(scaleToX(1000, { ...xScale, domainRange: 0 })).toBe(40);
      expect(scaleToX(1000, { ...xScale, domainRange: 0 })).not.toBeNaN();
    });

    it('does not produce NaN for a negative domain range', () => {
      expect(scaleToX(1000, { ...xScale, domainRange: -5 })).toBe(40);
    });
  });

  describe('scaleToY', () => {
    it('maps the domain minimum to the baseline', () => {
      // chartHeight - bottomPadding = 220 - 40 = 180
      expect(scaleToY(0, yScale)).toBe(180);
    });

    it('maps the domain maximum to the top padding', () => {
      expect(scaleToY(50, yScale)).toBe(20);
      expect(scaleToY(50, yScale)).toBe(yScale.padding);
    });

    it('inverts the axis: larger values sit higher on screen', () => {
      expect(scaleToY(40, yScale)).toBeLessThan(scaleToY(10, yScale));
    });

    it('collapses to the baseline when the domain has no range', () => {
      expect(scaleToY(0, { ...yScale, domainRange: 0 })).toBe(180);
    });
  });

  describe('getBarHeight', () => {
    it('is the distance from the baseline to the scaled value', () => {
      expect(getBarHeight(25, yScale)).toBe(80);
      expect(getBarHeight(25, yScale)).toBeCloseTo(
        yScale.chartHeight - yScale.bottomPadding - scaleToY(25, yScale)
      );
    });

    it('is zero for a degenerate domain', () => {
      expect(getBarHeight(25, { ...yScale, domainRange: 0 })).toBe(0);
    });
  });

  describe('getBarWidth', () => {
    it('splits the plot area across the bars', () => {
      expect(getBarWidth(340, 40, 20, 4, 1)).toBe(70);
    });

    it('applies the fill ratio for the gap between bars', () => {
      expect(getBarWidth(340, 40, 20, 4, 0.8)).toBeCloseTo(56);
    });

    it('returns zero for an empty dataset instead of dividing by zero', () => {
      expect(getBarWidth(340, 40, 20, 0, 0.95)).toBe(0);
    });
  });

  describe('bar and tooltip alignment', () => {
    const { domainMin, domainRange, chartWidth, leftPadding, rightPadding } = xScale;

    // The formula every chart is supposed to use.
    const correctX = (value: number) =>
      leftPadding + ((value - domainMin) / domainRange) * (chartWidth - leftPadding - rightPadding);

    // What the tooltip call sites used to compute: rightPadding was missing
    // from the plot width, so the marker drifted right of its bar.
    const buggyX = (value: number) =>
      leftPadding + ((value - domainMin) / domainRange) * (chartWidth - leftPadding);

    it('matches the reference formula that includes rightPadding', () => {
      for (const ts of [1000, 2500, 4000, 5000]) {
        expect(scaleToX(ts, xScale)).toBeCloseTo(correctX(ts));
      }
    });

    it('does not reproduce the old formula that dropped rightPadding', () => {
      // Both agree at the left edge, and diverge by up to rightPadding towards
      // the right edge — which is exactly what made the tooltip look detached.
      expect(scaleToX(1000, xScale)).toBeCloseTo(buggyX(1000));
      expect(scaleToX(5000, xScale)).not.toBeCloseTo(buggyX(5000));
      expect(buggyX(5000) - scaleToX(5000, xScale)).toBeCloseTo(rightPadding);
    });
  });
});
