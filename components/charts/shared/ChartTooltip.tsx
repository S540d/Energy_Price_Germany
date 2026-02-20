import React from 'react';
import { View, Platform } from 'react-native';
import type { ThemeColors } from '../../../utils/theme';

interface ChartTooltipProps {
  tooltipLeft: number;
  cardPadding: number;
  backgroundColor: string;
  colors: ThemeColors;
  children: React.ReactNode;
  minWidth?: number;
}

function ChartTooltipComponent({
  tooltipLeft,
  cardPadding,
  backgroundColor,
  colors,
  children,
  minWidth,
}: ChartTooltipProps) {
  const tooltipBgColor = backgroundColor === colors.surface ? colors.background : colors.surface;

  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: tooltipBgColor,
        borderWidth: 1,
        borderColor: colors.gridLine,
        borderRadius: 12,
        position: 'absolute',
        top: cardPadding + 30,
        left: tooltipLeft,
        zIndex: 10,
        ...(minWidth ? { minWidth } : {}),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        ...(Platform.OS === 'web' && {
          backdropFilter: 'blur(10px)',
        }),
      }}
    >
      {children}
    </View>
  );
}

export const ChartTooltip = React.memo(ChartTooltipComponent);

/**
 * Calculate tooltip left position with boundary clamping
 */
export function getTooltipLeft(x: number, tooltipWidth: number, chartWidth: number): number {
  let left = x - tooltipWidth / 2;
  if (left < 0) left = 8;
  if (left + tooltipWidth > chartWidth) left = chartWidth - tooltipWidth - 8;
  return left;
}
