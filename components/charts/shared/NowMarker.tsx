import React from 'react';
import { Line } from 'react-native-svg';
import { scaleToX } from './chartScale';

interface NowMarkerLineProps {
  now: number;
  minTime: number;
  timeRange: number;
  chartWidth: number;
  chartHeight: number;
  leftPadding: number;
  rightPadding: number;
  padding: number;
  bottomPadding: number;
}

/** SVG line for the "now" marker - must be rendered inside an <Svg> element */
export function NowMarkerLine({
  now,
  minTime,
  timeRange,
  chartWidth,
  chartHeight,
  leftPadding,
  rightPadding,
  padding,
  bottomPadding,
}: NowMarkerLineProps) {
  const x = scaleToX(now, {
    domainMin: minTime,
    domainRange: timeRange,
    chartWidth,
    leftPadding,
    rightPadding,
  });
  return (
    <Line
      x1={x}
      y1={padding}
      x2={x}
      y2={chartHeight - bottomPadding}
      stroke="red"
      strokeWidth="2"
      strokeDasharray="5,5"
    />
  );
}
