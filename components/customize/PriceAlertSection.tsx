import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { parseThresholdInput } from '../../utils/priceAlertUtils';
import { requestAlertNotificationPermission } from '../../hooks/usePriceAlertNotification';

/**
 * Price alert thresholds section in Customize modal.
 * Lets users set low/high end-customer price thresholds (¢/kWh).
 * Values are persisted via the cross-platform storage abstraction.
 */
export function PriceAlertSection() {
  const { t } = useLanguageContext();
  const { theme, priceAlertLow, setPriceAlertLow, priceAlertHigh, setPriceAlertHigh } =
    useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  // Draft text keeps intermediate input like "0." or "2." that the numeric value cannot represent
  const [lowText, setLowText] = useState(priceAlertLow !== null ? priceAlertLow.toString() : '');
  const [highText, setHighText] = useState(
    priceAlertHigh !== null ? priceAlertHigh.toString() : ''
  );

  // Re-sync drafts when the stored value changes from outside (e.g. reset, async settings load)
  useEffect(() => {
    setLowText(prev =>
      parseThresholdInput(prev).value === priceAlertLow
        ? prev
        : priceAlertLow !== null
          ? priceAlertLow.toString()
          : ''
    );
  }, [priceAlertLow]);
  useEffect(() => {
    setHighText(prev =>
      parseThresholdInput(prev).value === priceAlertHigh
        ? prev
        : priceAlertHigh !== null
          ? priceAlertHigh.toString()
          : ''
    );
  }, [priceAlertHigh]);

  const handleLowChange = (raw: string) => {
    const { text, value } = parseThresholdInput(raw);
    setLowText(text);
    setPriceAlertLow(value);
    if (value !== null) requestAlertNotificationPermission();
  };

  const handleHighChange = (raw: string) => {
    const { text, value } = parseThresholdInput(raw);
    setHighText(text);
    setPriceAlertHigh(value);
    if (value !== null) requestAlertNotificationPermission();
  };

  const handleReset = () => {
    setPriceAlertLow(null);
    setPriceAlertHigh(null);
  };

  const hasAlerts = priceAlertLow !== null || priceAlertHigh !== null;

  // Warn when thresholds conflict (low >= high)
  const thresholdConflict =
    priceAlertLow !== null && priceAlertHigh !== null && priceAlertLow >= priceAlertHigh;

  return (
    <View style={styles.menuSection}>
      <View style={styles.titleRow}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t.priceAlertSection}
        </Text>
        {hasAlerts && (
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetButton, { color: colors.primary }]}>{t.priceAlertReset}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.hintText, { color: colors.textSecondary }]}>{t.priceAlertHint}</Text>
      {thresholdConflict && (
        <Text style={[styles.conflictWarning, { color: colors.error }]}>
          {t.priceAlertConflict}
        </Text>
      )}
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {t.priceAlertLow}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: priceAlertLow !== null ? colors.success : colors.gridLine,
              },
            ]}
            placeholder={t.priceAlertLowPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={lowText}
            onChangeText={handleLowChange}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {t.priceAlertHigh}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: priceAlertHigh !== null ? colors.error : colors.gridLine,
              },
            ]}
            placeholder={t.priceAlertHighPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={highText}
            onChangeText={handleHighChange}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuSection: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resetButton: {
    fontSize: 12,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
  },
  conflictWarning: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
