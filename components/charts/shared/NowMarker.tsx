import React from 'react';
import { Text } from 'react-native';
import { Line } from 'react-native-svg';

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
  const x = leftPadding + ((now - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
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

interface NowMarkerLabelProps {
  now: number;
  minTime: number;
  timeRange: number;
  chartWidth: number;
  chartHeight: number;
  leftPadding: number;
  rightPadding: number;
  bottomPadding: number;
  label: string;
}

/** Text label for the "now" marker - rendered as absolute positioned Text */
export function NowMarkerLabel({
  now,
  minTime,
  timeRange,
  chartWidth,
  chartHeight,
  leftPadding,
  rightPadding,
  bottomPadding,
  label,
}: NowMarkerLabelProps) {
  const x = leftPadding + ((now - minTime) / timeRange) * (chartWidth - leftPadding - rightPadding);
  return (
    <Text
      style={{
        position: 'absolute',
        left: x - 15,
        top: chartHeight - bottomPadding + 20,
        fontSize: 12,
        color: 'red',
        fontWeight: 'bold',
      }}
    >
      {label}
    </Text>
  );
}
