import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { LanguageSection } from '../settings/LanguageSection';
import { BetaModeSection } from '../settings/BetaModeSection';
import { PostalCodeSection } from './PostalCodeSection';
import { GridFeesSection } from './GridFeesSection';

interface CustomizeModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Customize modal for regional and pricing configuration
 * Allows users to set postal code, grid fees, and language
 */
export function CustomizeModal({ visible, onClose }: CustomizeModalProps) {
  const { t } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Modal Panel */}
      <ScrollView style={[styles.menu, { backgroundColor: colors.surface }]}>
        {/* Header with Close Button */}
        <View style={[styles.menuHeader, { borderBottomColor: colors.gridLine }]}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            {t.customize}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <LanguageSection />

        <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

        {/* Beta Mode Section */}
        <BetaModeSection />

        <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

        {/* Postal Code Section */}
        <PostalCodeSection />

        <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

        {/* Grid Fees Section */}
        <GridFeesSection />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 8,
    width: 320,
    maxHeight: '85%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    padding: 16,
    gap: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '300',
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
});
