import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Badge } from './ui/Badge';
import type { ThemeColors } from '../utils/theme';

type AlertState = 'none' | 'low' | 'high';

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  isDataStale: boolean;
  alertState: AlertState;
  livePulseStyle: AnimatedStyle;
  alertLowLabel: string;
  alertHighLabel: string;
  onOpenCalculator: () => void;
  onOpenSettings: () => void;
};

export function AppHeader({
  colors,
  isDark,
  isDataStale,
  alertState,
  livePulseStyle,
  alertLowLabel,
  alertHighLabel,
  onOpenCalculator,
  onOpenSettings,
}: Props) {
  const glassButtonStyle = isDark
    ? { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.06)' }
    : { borderColor: colors.gridLine, backgroundColor: colors.background };

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.surface, borderBottomColor: colors.gridLine },
      ]}
    >
      <View style={styles.titleBlock}>
        <View style={styles.liveRow}>
          <Animated.View
            style={[
              styles.liveDot,
              { backgroundColor: isDataStale ? colors.accentAmber : colors.accentGreen },
              livePulseStyle,
            ]}
          />
          <Text
            style={[
              styles.liveLabel,
              { color: isDataStale ? colors.accentAmber : colors.accentGreen },
            ]}
          >
            LIVE
          </Text>
        </View>
        <Text style={[styles.titleLine1, { color: colors.text }]}>Energy Price</Text>
        <Text style={[styles.titleLine2, { color: colors.accentGreen }]}>Germany</Text>
      </View>

      <View style={styles.buttons}>
        {alertState !== 'none' && (
          <Badge
            label={alertState === 'low' ? '↓' : '↑'}
            backgroundColor={alertState === 'low' ? colors.success : colors.error}
            accessibilityLabel={alertState === 'low' ? alertLowLabel : alertHighLabel}
          />
        )}
        <TouchableOpacity
          onPress={onOpenCalculator}
          style={[styles.button, glassButtonStyle]}
          aria-label="Cost Calculator"
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>€</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onOpenSettings}
          style={[styles.button, glassButtonStyle]}
          aria-label="Settings"
        >
          <Text style={[styles.settingsButtonText, { color: colors.text }]}>⋮</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  titleBlock: {
    flex: 1,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  titleLine1: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  titleLine2: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingsButtonText: {
    fontSize: 24,
    fontWeight: '500',
  },
});
