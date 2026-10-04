import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { scaleToX } from './chartScale';

interface XAxisHourLabelsProps {
  minTime: number;
  maxTime: number;
  timeRange: number;
  chartWidth: number;
  chartHeight: number;
  leftPadding: number;
  rightPadding: number;
  bottomPadding: number;
  textColor: string;
  /** Chart-specific base style (font size/weight) */
  labelStyle: StyleProp<TextStyle>;
}

const LABEL_INTERVAL_HOURS = 6;

/** X-axis hour labels ("0h", "6h", …) every 6 hours, absolutely positioned. */
export function XAxisHourLabels({
  minTime,
  maxTime,
  timeRange,
  chartWidth,
  chartHeight,
  leftPadding,
  rightPadding,
  bottomPadding,
  textColor,
  labelStyle,
}: XAxisHourLabelsProps) {
  const labels: React.ReactElement[] = [];
  const endDate = new Date(maxTime);
  const current = new Date(minTime);
  current.setHours(
    Math.ceil(current.getHours() / LABEL_INTERVAL_HOURS) * LABEL_INTERVAL_HOURS,
    0,
    0,
    0
  );

  while (current <= endDate) {
    const timestamp = current.getTime();
    const x = scaleToX(timestamp, {
      domainMin: minTime,
      domainRange: timeRange,
      chartWidth,
      leftPadding,
      rightPadding,
    });

    labels.push(
      <Text
        key={`xlabel-${timestamp}`}
        style={[
          labelStyle,
          { left: x - 10, top: chartHeight - bottomPadding + 5, color: textColor },
        ]}
      >
        {current.getHours()}h
      </Text>
    );

    current.setHours(current.getHours() + LABEL_INTERVAL_HOURS);
  }

  return <>{labels}</>;
}
