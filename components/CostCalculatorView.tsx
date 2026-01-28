import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLanguageContext } from '../context/LanguageContext';
import { getThemeColors } from '../utils/theme';
import { useSettingsContext } from '../context/SettingsContext';
import { CostCalculator } from './CostCalculator';

interface CostCalculatorViewProps {
  visible: boolean;
  onClose: () => void;
  currentPrice: number;
  priceData?: Array<{ start_timestamp: number; marketprice: number; renewable_share?: number }>;
  gridFees?: number;
}

/**
 * Full-screen Cost Calculator View
 * Dedicated page for calculating electricity costs for household appliances
 */
export function CostCalculatorView({
  visible,
  onClose,
  currentPrice,
  priceData,
  gridFees
}: CostCalculatorViewProps) {
  const { t } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  if (!visible) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.gridLine }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.costCalculatorTitle}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <CostCalculator
          currentPrice={currentPrice}
          priceData={priceData}
          gridFees={gridFees}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
});
