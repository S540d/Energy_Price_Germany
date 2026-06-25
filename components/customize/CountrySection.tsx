import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { useCountryContext } from '../../context/CountryContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { COUNTRIES, COUNTRY_CODES } from '../../utils/countries';

/**
 * Country selection section for the Customize menu.
 * Switches the active country (national data only). Determines data
 * availability and whether the regional/PLZ UI is shown (Issue #356).
 */
export function CountrySection() {
  const { t } = useLanguageContext();
  const { country, setCountry } = useCountryContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.country}</Text>
      <View style={styles.countryToggle}>
        {COUNTRY_CODES.map(code => {
          const config = COUNTRIES[code];
          const active = country === code;
          return (
            <TouchableOpacity
              key={code}
              style={[
                styles.countryButton,
                active && styles.countryButtonActive,
                { backgroundColor: active ? colors.primary : colors.gridLine },
              ]}
              onPress={() => setCountry(code)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={{
                  color: active ? '#fff' : colors.text,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {config.flag} {t[config.translationKey]}
                {config.beta ? ` ${t.countryBeta}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  countryToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  countryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
