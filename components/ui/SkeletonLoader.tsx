import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  const [containerWidth, setContainerWidth] = useState(0);
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    shimmerX.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
    return () => cancelAnimation(shimmerX);
  }, [shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * containerWidth }],
  }));

  const shimmerColors: [string, string, string] = isDark
    ? ['transparent', 'rgba(255,255,255,0.10)', 'transparent']
    : ['transparent', 'rgba(255,255,255,0.45)', 'transparent'];

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: borderRadius.md,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {containerWidth > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
          <LinearGradient
            colors={shimmerColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: containerWidth, height: '100%' }}
          />
        </Animated.View>
      )}
    </View>
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
