/**
 * Shared coordinate math for the SVG charts.
 *
 * Every chart projects a domain value (timestamp, renewable share, price) onto
 * the plot area with the same linear formula. Keeping it in one place avoids the
 * drift that put tooltips beside their bar instead of on top of it: the tooltip
 * call sites in PriceBarChart/RenewableBarChart had dropped `rightPadding` from
 * the plot width, so the offset grew towards the right chart edge.
 */

export interface XScale {
  /** Domain value mapped to the left edge of the plot area */
  domainMin: number;
  /** Size of the domain (max - min) */
  domainRange: number;
  /** Total chart width, including both paddings */
  chartWidth: number;
  leftPadding: number;
  rightPadding: number;
}

export interface YScale {
  /** Domain value mapped to the bottom edge of the plot area */
  domainMin: number;
  /** Size of the domain (max - min) */
  domainRange: number;
  /** Total chart height, including both paddings */
  chartHeight: number;
  /** Top padding */
  padding: number;
  bottomPadding: number;
}

/** Drawable width, i.e. the chart minus its horizontal paddings. */
export function getPlotWidth(
  chartWidth: number,
  leftPadding: number,
  rightPadding: number
): number {
  return chartWidth - leftPadding - rightPadding;
}

/** Drawable height, i.e. the chart minus its vertical paddings. */
export function getPlotHeight(chartHeight: number, padding: number, bottomPadding: number): number {
  return chartHeight - padding - bottomPadding;
}

/**
 * Projects a domain value onto its x coordinate.
 *
 * A non-positive `domainRange` (single data point, or all points sharing a
 * value) collapses to the left edge instead of producing NaN/Infinity.
 */
export function scaleToX(value: number, scale: XScale): number {
  const { domainMin, domainRange, chartWidth, leftPadding, rightPadding } = scale;
  if (domainRange <= 0) return leftPadding;
  return (
    leftPadding +
    ((value - domainMin) / domainRange) * getPlotWidth(chartWidth, leftPadding, rightPadding)
  );
}

/**
 * Projects a domain value onto its y coordinate. The y axis is inverted:
 * `domainMin` sits at the bottom edge of the plot area.
 *
 * A non-positive `domainRange` collapses to the bottom edge.
 */
export function scaleToY(value: number, scale: YScale): number {
  const { domainMin, domainRange, chartHeight, padding, bottomPadding } = scale;
  const baseline = chartHeight - bottomPadding;
  if (domainRange <= 0) return baseline;
  return (
    baseline -
    ((value - domainMin) / domainRange) * getPlotHeight(chartHeight, padding, bottomPadding)
  );
}

/** Height of a bar spanning from the baseline up to `value`. */
export function getBarHeight(value: number, scale: YScale): number {
  const { domainMin, domainRange, chartHeight, padding, bottomPadding } = scale;
  if (domainRange <= 0) return 0;
  return ((value - domainMin) / domainRange) * getPlotHeight(chartHeight, padding, bottomPadding);
}

/** Width of a single bar when `count` bars share the plot area. */
export function getBarWidth(
  chartWidth: number,
  leftPadding: number,
  rightPadding: number,
  count: number,
  fillRatio: number
): number {
  if (count <= 0) return 0;
  return (getPlotWidth(chartWidth, leftPadding, rightPadding) / count) * fillRatio;
}
