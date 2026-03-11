import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { borderRadius, spacing } from '../../utils/designSystem';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  style?: StyleProp<ViewStyle>;
}

function SkeletonBase({ width = '100%', height, style }: SkeletonProps) {
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1,
      false
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: borderRadius.md,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonText({
  width = '60%',
  style,
}: {
  width?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
}) {
  return <SkeletonBase width={width} height={14} style={style} />;
}

export function SkeletonBar({ width = '100%', height = 24, style }: SkeletonProps) {
  return <SkeletonBase width={width} height={height} style={style} />;
}

export function SkeletonCard({
  height = 200,
  style,
}: {
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        style,
      ]}
    >
      <SkeletonBase width="100%" height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
