import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';

/**
 * Price display mode section in Customize modal.
 * Switches between market price only and end-customer price (market + grid fees) display.
 */
export function PriceDisplayModeSection() {
  const { t } = useLanguageContext();
  const { theme, priceDisplayMode, setPriceDisplayMode } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.priceDisplayMode}
      </Text>
      <View style={styles.toggle}>
        {(['marketOnly', 'withGridFees'] as const).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.toggleButton,
              { backgroundColor: priceDisplayMode === mode ? colors.primary : colors.gridLine },
            ]}
            onPress={() => setPriceDisplayMode(mode)}
          >
            <Text
              style={{
                color: priceDisplayMode === mode ? '#fff' : colors.text,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {mode === 'marketOnly' ? t.priceDisplayMarketOnly : t.priceDisplayWithFees}
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
  toggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
