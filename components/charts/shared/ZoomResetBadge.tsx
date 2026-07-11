import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { borderRadius } from '../../../utils/designSystem';
import type { ThemeColors } from '../../../utils/theme';

interface ZoomResetBadgeProps {
  onPress: () => void;
  colors: ThemeColors;
  accessibilityLabel: string;
}

function ZoomResetBadgeComponent({ onPress, colors, accessibilityLabel }: ZoomResetBadgeProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.badge,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.gridLine },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Text style={[styles.label, { color: colors.text }]}>⟲</Text>
    </Pressable>
  );
}

export const ZoomResetBadge = React.memo(ZoomResetBadgeComponent);

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
