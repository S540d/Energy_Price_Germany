import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { AppearanceSection } from './AppearanceSection';

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  onOpenCustomize: () => void;
  onOpenAbout: () => void;
}

/**
 * Settings menu modal with theme, language, and action links
 * Main entry point for app configuration
 */
export function SettingsMenu({
  visible,
  onClose,
  onOpenCustomize,
  onOpenAbout,
}: SettingsMenuProps) {
  const { t } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(300);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      overlayOpacity.value = withTiming(0.5, { duration: 200 });
    } else if (isMounted) {
      translateY.value = withTiming(300, { duration: 250 });
      overlayOpacity.value = withTiming(0, { duration: 250 }, () => {
        runOnJS(setIsMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isMounted) return null;

  return (
    <>
      {/* Animated Overlay */}
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Animated Menu Panel */}
      <Animated.View style={[styles.menu, { backgroundColor: colors.surface }, menuAnimatedStyle]}>
        {/* Header with Close Button */}
        <View style={[styles.menuHeader, { borderBottomColor: colors.gridLine }]}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>{t.settings}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Customize Button */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[
              styles.customizeButton,
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => {
              onOpenCustomize();
              onClose();
            }}
          >
            <Text style={[styles.customizeButtonText, { color: '#fff' }]}>{t.customize}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

        {/* Appearance Section */}
        <AppearanceSection />

        <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

        {/* Feedback, Support & About - Three Links in One Row */}
        <View style={[styles.menuSection, styles.menuSectionRow]}>
          <TouchableOpacity
            style={styles.menuLinkFlex}
            onPress={() => {
              Linking.openURL('mailto:devsven@posteo.de?subject=Energy Price Germany Feedback');
              onClose();
            }}
          >
            <Text style={[styles.menuLinkText, { color: colors.primary }]}>{t.feedback}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuLinkFlex}
            onPress={() => {
              Linking.openURL('https://ko-fi.com/devsven');
              onClose();
            }}
          >
            <Text style={[styles.menuLinkText, { color: colors.primary }]}>{t.supportProject}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuLinkFlex}
            onPress={() => {
              onOpenAbout();
              onClose();
            }}
          >
            <Text style={[styles.menuLinkText, { color: colors.primary }]}>{t.about}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 1)',
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
  menuSection: {
    gap: 12,
  },
  menuSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  customizeButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuLinkFlex: {
    flex: 1,
    alignItems: 'center',
  },
  menuLinkText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
