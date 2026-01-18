import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';

/**
 * Language selection section for Settings and Customize menus
 * Allows switching between English and German
 */
export function LanguageSection() {
  const { language, setLanguage, t } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.language}
      </Text>
      <View style={styles.languageToggle}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            language === 'en' && styles.languageButtonActive,
            { backgroundColor: language === 'en' ? colors.primary : colors.gridLine }
          ]}
          onPress={() => setLanguage('en')}
        >
          <Text style={{
            color: language === 'en' ? '#fff' : colors.text,
            fontSize: 12,
            fontWeight: '600'
          }}>
            {t.english}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.languageButton,
            language === 'de' && styles.languageButtonActive,
            { backgroundColor: language === 'de' ? colors.primary : colors.gridLine }
          ]}
          onPress={() => setLanguage('de')}
        >
          <Text style={{
            color: language === 'de' ? '#fff' : colors.text,
            fontSize: 12,
            fontWeight: '600'
          }}>
            {t.german}
          </Text>
        </TouchableOpacity>
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
  languageToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
