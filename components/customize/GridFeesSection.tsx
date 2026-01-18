import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';

/**
 * Grid fees input section for cost customization
 * Allows users to customize grid fees and taxes (EUR/MWh)
 */
export function GridFeesSection() {
  const { t } = useLanguageContext();
  const { theme, gridFees, setGridFees } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const handleGridFeesChange = (text: string) => {
    // Allow only numbers and decimal point
    const sanitized = text.replace(/[^0-9.]/g, '');

    // If empty, keep current value (don't update state)
    if (sanitized === '') {
      return;
    }

    const value = parseFloat(sanitized);
    if (!isNaN(value) && value > 0) {
      setGridFees(value);
    }
  };

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.gridFees}
      </Text>
      <View>
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          {t.gridFeesHint}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.gridLine,
            }
          ]}
          placeholder={t.gridFeesValue}
          placeholderTextColor={colors.textSecondary}
          value={gridFees.toString()}
          onChangeText={handleGridFeesChange}
          keyboardType="numeric"
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
