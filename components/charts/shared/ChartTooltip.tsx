import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = 0;
    scale.value = 0.9;

    opacity.value = withTiming(1, { duration: 150 });
    scale.value = withTiming(1, { duration: 150 });

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
    // shared values are stable refs – intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tooltipLeft]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
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
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
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
