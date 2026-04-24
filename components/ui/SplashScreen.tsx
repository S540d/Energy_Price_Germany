import React, { useEffect, useMemo } from 'react';
import { Image, Platform, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { useLanguageContext } from '../../context/LanguageContext';

interface SplashScreenProps {
  onFinish: () => void;
  version: string;
}

function AnimatedBar({
  progress,
  heightFactor,
  color,
}: {
  progress: SharedValue<number>;
  heightFactor: number;
  color: string;
}) {
  const barStyle = useAnimatedStyle(() => ({
    height: progress.value * heightFactor * 32,
    opacity: progress.value,
  }));

  return <Animated.View style={[styles.bar, { backgroundColor: color }, barStyle]} />;
}

const ICON_SIZE = 120;
const ANIMATION_DURATION = 600;

export function SplashScreen({ onFinish, version }: SplashScreenProps) {
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);
  const { t } = useLanguageContext();

  const iconScale = useSharedValue(0.3);
  const iconOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(12);
  const subtitleOpacity = useSharedValue(0);
  const bar0 = useSharedValue(0);
  const bar1 = useSharedValue(0);
  const bar2 = useSharedValue(0);
  const bar3 = useSharedValue(0);
  const barProgress = useMemo(() => [bar0, bar1, bar2, bar3], [bar0, bar1, bar2, bar3]);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Icon scales up with a slight bounce
    iconOpacity.value = withTiming(1, { duration: ANIMATION_DURATION * 0.5 });
    iconScale.value = withSequence(
      withTiming(1.05, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 200 })
    );

    // 2. Title fades in and slides up
    titleOpacity.value = withDelay(
      ANIMATION_DURATION * 0.4,
      withTiming(1, { duration: ANIMATION_DURATION * 0.6 })
    );
    titleTranslateY.value = withDelay(
      ANIMATION_DURATION * 0.4,
      withTiming(0, { duration: ANIMATION_DURATION * 0.6, easing: Easing.out(Easing.quad) })
    );

    // 3. Subtitle fades in
    subtitleOpacity.value = withDelay(
      ANIMATION_DURATION * 0.7,
      withTiming(1, { duration: ANIMATION_DURATION * 0.5 })
    );

    // 4. Mini bar chart bars grow sequentially
    barProgress.forEach((bar, i) => {
      bar.value = withDelay(
        ANIMATION_DURATION * 0.8 + i * 100,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) })
      );
    });

    // 5. Fade out entire splash and call onFinish
    const totalDuration = ANIMATION_DURATION * 0.8 + 4 * 100 + 300 + 400;
    containerOpacity.value = withDelay(totalDuration, withTiming(0, { duration: 300 }));

    const timer = setTimeout(onFinish, totalDuration + 350);
    return () => clearTimeout(timer);
  }, [
    onFinish,
    barProgress,
    containerOpacity,
    iconOpacity,
    iconScale,
    subtitleOpacity,
    titleOpacity,
    titleTranslateY,
  ]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const barHeights = [0.4, 0.6, 0.85, 1.0];
  const barColors = ['#66BB6A', '#43A047', '#2E7D32', '#1B5E20'];

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.background }, containerStyle]}
    >
      {/* Icon */}
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title – intentionally not translated (app brand name) */}
      <Animated.View style={titleStyle}>
        <Text style={[styles.title, { color: colors.text }]}>Energy Prices</Text>
        <Text style={[styles.titleAccent, { color: colors.primary }]}>Germany</Text>
      </Animated.View>

      {/* Mini bar chart animation */}
      <View style={styles.barsContainer}>
        {barHeights.map((heightFactor, i) => (
          <AnimatedBar
            key={i}
            progress={barProgress[i]}
            heightFactor={heightFactor}
            color={barColors[i]}
          />
        ))}
      </View>

      {/* Subtitle */}
      <Animated.View style={subtitleStyle}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.loadingData}</Text>
      </Animated.View>

      {/* Version */}
      <Animated.View style={[styles.versionContainer, subtitleStyle]}>
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          v{version} ·{' '}
          {Platform.OS === 'web' ? 'Web' : Platform.OS === 'android' ? 'Android' : 'iOS'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : {}),
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 24,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: -2,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 36,
    marginTop: 24,
    marginBottom: 16,
  },
  bar: {
    width: 10,
    marginHorizontal: 3,
    borderRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 48,
  },
  version: {
    fontSize: 12,
  },
});
