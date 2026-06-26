import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { useCountryContext } from '../../context/CountryContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { COUNTRIES, COUNTRY_CODES } from '../../utils/countries';

/**
 * Country selection section for the Customize menu.
 * Renders a vertical list so any number of countries fits without overflow.
 * Switches the active country (national data only). Determines data
 * availability and whether the regional/PLZ UI is shown (Issue #356, #368).
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
      <View style={[styles.countryList, { borderColor: colors.gridLine }]}>
        {COUNTRY_CODES.map((code, index) => {
          const config = COUNTRIES[code];
          const active = country === code;
          const isLast = index === COUNTRY_CODES.length - 1;
          return (
            <TouchableOpacity
              key={code}
              style={[
                styles.countryRow,
                !isLast && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.gridLine,
                },
              ]}
              onPress={() => setCountry(code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={styles.flag}>{config.flag}</Text>
              <Text style={[styles.countryName, { color: colors.text }]}>
                {t[config.translationKey]}
                {config.beta ? (
                  <Text style={[styles.betaBadge, { color: colors.textSecondary }]}>
                    {' '}
                    {t.countryBeta}
                  </Text>
                ) : null}
              </Text>
              {active && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
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
  countryList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    overflow: 'hidden',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  betaBadge: {
    fontSize: 12,
    fontWeight: '400',
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
});
