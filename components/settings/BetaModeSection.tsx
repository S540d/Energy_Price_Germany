import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, Switch, Platform, Alert } from 'react-native';
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

    try {
      // Save to storage
      await AsyncStorage.setItem(BETA_MODE_KEY, String(newValue));
      setBetaModeEnabled(newValue);

      // Show restart alert (channel switch requires app restart)
      if (Platform.OS !== 'web') {
        const channelName = newValue ? 'Beta (Staging)' : 'Stable (Production)';
        Alert.alert(
          t.betaModeRestartTitle || 'Restart Required',
          t.betaModeRestartMessage?.replace('{channel}', channelName) ||
            `To switch to ${channelName} updates, please restart the app.`,
          [
            {
              text: t.betaModeRestartLater || 'Later',
              style: 'cancel',
            },
            {
              text: t.betaModeRestartNow || 'Restart Now',
              onPress: async () => {
                await Updates.reloadAsync();
              },
            },
          ]
        );
      }
    } catch (error) {
      // Revert on error and show user feedback
      setBetaModeEnabled(!newValue);
      Alert.alert(
        t.error || 'Error',
        t.betaModeSaveError || 'Failed to save beta mode preference. Please try again.',
        [{ text: 'OK' }]
      );
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
