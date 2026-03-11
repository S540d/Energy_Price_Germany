import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useLanguageContext } from '../../context/LanguageContext';
import type { Theme } from '../../utils/theme';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';

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

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.appearance}</Text>
      <View style={styles.themeToggle}>
        {themes.map(themeOption => (
          <ThemeButton
            key={themeOption}
            label={t[themeOption]}
            isActive={theme === themeOption}
            activeColor={colors.primary}
            inactiveColor={colors.gridLine}
            activeTextColor="#fff"
            inactiveTextColor={colors.text}
            onPress={() => setTheme(themeOption)}
          />
        ))}
      </View>
    </View>
  );
}

interface ThemeButtonProps {
  label: string;
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
  activeTextColor: string;
  inactiveTextColor: string;
  onPress: () => void;
}

function ThemeButton({
  label,
  isActive,
  activeColor,
  inactiveColor,
  activeTextColor,
  inactiveTextColor,
  onPress,
}: ThemeButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={styles.pressable}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.themeButton,
          isActive && styles.themeButtonActive,
          { backgroundColor: isActive ? activeColor : inactiveColor },
          animatedStyle,
        ]}
      >
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
    gap: 8,
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
  themeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
