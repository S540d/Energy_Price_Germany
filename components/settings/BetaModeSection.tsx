import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Switch, Platform } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BETA_MODE_KEY = '@energy_price_germany:beta_mode';

/**
 * Beta Mode section for Settings menu
 * Allows users to opt-in to beta updates (staging channel)
 */
export function BetaModeSection() {
  const { t } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const [betaModeEnabled, setBetaModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load beta mode state on mount
  useEffect(() => {
    loadBetaMode();
  }, []);

  const loadBetaMode = async () => {
    try {
      const storedValue = await AsyncStorage.getItem(BETA_MODE_KEY);
      setBetaModeEnabled(storedValue === 'true');
    } catch (error) {
      // Silent fail - default to false
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBetaMode = async () => {
    const newValue = !betaModeEnabled;
    setBetaModeEnabled(newValue);

    try {
      // Save to storage
      await AsyncStorage.setItem(BETA_MODE_KEY, String(newValue));

      // Switch update channel if EAS Updates is available
      if (Updates.channel) {
        const targetChannel = newValue ? 'staging' : 'production';

        // Note: expo-updates doesn't have a direct setChannel method
        // The channel switch will take effect on next app restart
        // We store the preference and the app will use it on next launch
      }
    } catch (error) {
      // Revert on error
      setBetaModeEnabled(!newValue);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.betaMode}
      </Text>

      {/* Toggle Switch */}
      <View style={[styles.betaRow, { backgroundColor: colors.surface }]}>
        <View style={styles.betaTextContainer}>
          <Text style={[styles.betaLabel, { color: colors.text }]}>
            {t.betaModeEnabled}
          </Text>
          <Text style={[styles.betaDescription, { color: colors.textSecondary }]}>
            {t.betaModeDescription}
          </Text>
        </View>
        <Switch
          value={betaModeEnabled}
          onValueChange={toggleBetaMode}
          trackColor={{ false: colors.gridLine, true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
          ios_backgroundColor={colors.gridLine}
        />
      </View>

      {/* Warning or Status Message */}
      {betaModeEnabled ? (
        <View style={[styles.warningBox, { backgroundColor: colors.warningBackground }]}>
          <Text style={[styles.warningText, { color: colors.warningText }]}>
            {t.betaModeWarning}
          </Text>
          <Text style={[styles.statusText, { color: colors.warningText }]}>
            {t.betaModeActive}
          </Text>
        </View>
      ) : (
        <View style={[styles.infoBox, { backgroundColor: colors.infoBackground }]}>
          <Text style={[styles.infoText, { color: colors.infoText }]}>
            {t.betaModeInactive}
          </Text>
        </View>
      )}
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
  betaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  betaTextContainer: {
    flex: 1,
    gap: 4,
  },
  betaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  betaDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 11,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
