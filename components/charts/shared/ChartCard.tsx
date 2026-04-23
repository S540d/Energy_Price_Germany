import React, { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ChartCardProps {
  backgroundColor: string;
  margin: number;
  cardPadding: number;
  children: React.ReactNode;
  style?: ViewStyle;
  animateIn?: boolean;
  accentColor?: string;
}

function ChartCardComponent({
  backgroundColor,
  margin,
  cardPadding,
  children,
  style,
  animateIn = true,
  accentColor,
}: ChartCardProps) {
  const opacity = useSharedValue(animateIn ? 0 : 1);
  const translateY = useSharedValue(animateIn ? 8 : 0);

  useEffect(() => {
    if (!animateIn) return;

    opacity.value = withTiming(1, { duration: 350 });
    translateY.value = withTiming(0, { duration: 350 });

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
    // shared values are stable refs – intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateIn]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor,
          margin,
          padding: cardPadding,
          borderRadius: 20,
          alignSelf: 'stretch',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
          ...(accentColor?.startsWith('#')
            ? { borderWidth: 1, borderColor: accentColor + '33' }
            : {}),
          ...style,
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export const ChartCard = React.memo(ChartCardComponent);
