import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { sanitizePostalCodeInput } from '../../utils/postalCodeUtils';

/**
 * Postal code input section for regional data customization
 * Allows users to enter their German postal code (PLZ) for regional data
 */
export function PostalCodeSection() {
  const { t } = useLanguageContext();
  const { theme, postalCode, setPostalCode } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.region}</Text>
      <View>
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>{t.postalCodeHint}</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.gridLine,
            },
          ]}
          placeholder={t.postalCode}
          placeholderTextColor={colors.textSecondary}
          value={postalCode}
          onChangeText={text => {
            setPostalCode(sanitizePostalCodeInput(text));
          }}
          keyboardType="numeric"
          maxLength={5}
        />
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
  hintText: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
