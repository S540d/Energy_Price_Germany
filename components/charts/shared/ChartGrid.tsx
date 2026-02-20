import React from 'react';
import Svg, { Line } from 'react-native-svg';

interface ChartGridProps {
  chartWidth: number;
  chartHeight: number;
  leftPadding: number;
  rightPadding: number;
  padding: number;
  bottomPadding: number;
  gridColor: string;
  /** Number of horizontal grid lines (default: 5) */
  horizontalLines?: number;
  /** Number of vertical grid lines (default: 0, used by scatter chart) */
  verticalLines?: number;
}

function ChartGridComponent({
  chartWidth,
  chartHeight,
  leftPadding,
  rightPadding,
  padding,
  bottomPadding,
  gridColor,
  horizontalLines = 5,
  verticalLines = 0,
}: ChartGridProps) {
  return (
    <Svg width={chartWidth} height={chartHeight} style={{ position: 'absolute' }}>
      {Array.from({ length: horizontalLines }, (_, i) => {
        const y = padding + (i / (horizontalLines - 1)) * (chartHeight - padding - bottomPadding);
        return (
          <Line
            key={`hgrid-${i}`}
            x1={leftPadding}
            y1={y}
            x2={chartWidth - rightPadding}
            y2={y}
            stroke={gridColor}
            strokeWidth="1"
            strokeDasharray="4,8"
            opacity={0.15}
          />
        );
      })}
      {verticalLines > 0 &&
        Array.from({ length: verticalLines }, (_, i) => {
          const x =
            leftPadding + (i / (verticalLines - 1)) * (chartWidth - leftPadding - rightPadding);
          return (
            <Line
              key={`vgrid-${i}`}
              x1={x}
              y1={padding}
              x2={x}
              y2={chartHeight - bottomPadding}
              stroke={gridColor}
              strokeWidth="1"
              strokeDasharray="4,8"
              opacity={0.15}
            />
          );
        })}
    </Svg>
  );
}

export const ChartGrid = React.memo(ChartGridComponent);
