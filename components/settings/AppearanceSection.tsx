import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Pressable } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useLanguageContext } from '../../context/LanguageContext';
import type { Theme } from '../../utils/theme';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { borderRadius } from '../../utils/designSystem';

interface ButtonLayout {
  x: number;
  width: number;
  height: number;
}

/**
 * Theme/Appearance selection section for Settings menu
 * Allows switching between Light, Dark, and System themes
 */
export function AppearanceSection() {
  const { t } = useLanguageContext();
  const { theme, setTheme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const themes: Theme[] = ['light', 'dark', 'system'];
  const layouts = useRef<Partial<Record<Theme, ButtonLayout>>>({});
  const [layoutsReady, setLayoutsReady] = useState(false);

  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillHeight = useSharedValue(0);
  const pillColor = useSharedValue(colors.primary);

  useEffect(() => {
    pillColor.value = colors.primary;
  }, [pillColor, colors.primary]);

  const pillStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: pillX.value,
    width: pillWidth.value,
    height: pillHeight.value,
    backgroundColor: pillColor.value,
    borderRadius: borderRadius.md,
    zIndex: 0,
  }));

  const handleLayout = (themeOption: Theme) => (e: LayoutChangeEvent) => {
    const { x, width, height } = e.nativeEvent.layout;
    layouts.current[themeOption] = { x, width, height };
    if (themes.every(t => layouts.current[t])) {
      const active = layouts.current[theme];
      if (active) {
        pillX.value = active.x;
        pillWidth.value = active.width;
        pillHeight.value = active.height;
        setLayoutsReady(true);
      }
    }
  };

  useEffect(() => {
    if (!layoutsReady) return;
    const active = layouts.current[theme];
    if (active) {
      pillX.value = withSpring(active.x, { damping: 20, stiffness: 300 });
      pillWidth.value = withSpring(active.width, { damping: 20, stiffness: 300 });
      pillHeight.value = withSpring(active.height, { damping: 20, stiffness: 300 });
    }
  }, [theme, layoutsReady, pillX, pillWidth, pillHeight]);

  const handleThemePress = (themeOption: Theme) => {
    setTheme(themeOption);
    const target = layouts.current[themeOption];
    if (target) {
      pillX.value = withSpring(target.x, { damping: 20, stiffness: 300 });
      pillWidth.value = withSpring(target.width, { damping: 20, stiffness: 300 });
      pillHeight.value = withSpring(target.height, { damping: 20, stiffness: 300 });
    }
  };

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.appearance}</Text>
      <View
        style={[
          styles.themeToggle,
          { backgroundColor: colors.gridLine, borderRadius: borderRadius.md },
        ]}
      >
        {layoutsReady && <Animated.View style={pillStyle} />}
        {themes.map(themeOption => (
          <ThemeButton
            key={themeOption}
            label={t[themeOption]}
            isActive={theme === themeOption}
            activeTextColor="#fff"
            inactiveTextColor={colors.text}
            onPress={() => handleThemePress(themeOption)}
            onLayout={handleLayout(themeOption)}
          />
        ))}
      </View>
    </View>
  );
}

interface ThemeButtonProps {
  label: string;
  isActive: boolean;
  activeTextColor: string;
  inactiveTextColor: string;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}

function ThemeButton({
  label,
  isActive,
  activeTextColor,
  inactiveTextColor,
  onPress,
  onLayout,
}: ThemeButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    zIndex: 1,
  }));

  return (
    <Pressable
      style={styles.pressable}
      onLayout={onLayout}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[styles.themeButton, animatedStyle]}>
        <Text
          style={[styles.buttonText, { color: isActive ? activeTextColor : inactiveTextColor }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeToggle: {
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
  },
  themeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
