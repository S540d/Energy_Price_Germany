import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors, Theme } from '../../utils/theme';
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
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.appearance}
      </Text>
      <View style={styles.themeToggle}>
        {themes.map((themeOption) => (
          <TouchableOpacity
            key={themeOption}
            style={[
              styles.themeButton,
              theme === themeOption && styles.themeButtonActive,
              { backgroundColor: theme === themeOption ? colors.primary : colors.gridLine }
            ]}
            onPress={() => setTheme(themeOption)}
          >
            <Text style={{
              color: theme === themeOption ? '#fff' : colors.text,
              fontSize: 12,
              fontWeight: '600'
            }}>
              {t[themeOption]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
  themeButton: {
    flex: 1,
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
});
