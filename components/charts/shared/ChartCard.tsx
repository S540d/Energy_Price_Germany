import React, { useRef, useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import { Animated, Easing } from 'react-native';

interface ChartCardProps {
  backgroundColor: string;
  margin: number;
  cardPadding: number;
  children: React.ReactNode;
  style?: ViewStyle;
  animateIn?: boolean;
}

function ChartCardComponent({
  backgroundColor,
  margin,
  cardPadding,
  children,
  style,
  animateIn = true,
}: ChartCardProps) {
  const opacity = useRef(new Animated.Value(animateIn ? 0 : 1)).current;

  useEffect(() => {
    if (!animateIn) return;

    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
    // opacity is a stable Animated.Value ref – intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateIn]);

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor,
        margin,
        padding: cardPadding,
        borderRadius: 16,
        alignSelf: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        ...style,
      }}
    >
      {children}
    </Animated.View>
  );
}

export const ChartCard = React.memo(ChartCardComponent);
