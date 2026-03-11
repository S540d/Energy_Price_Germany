import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { borderRadius } from '../../utils/designSystem';

interface BadgeProps {
  label: string;
  backgroundColor: string;
  textColor?: string;
  accessibilityLabel?: string;
}

export function Badge({
  label,
  backgroundColor,
  textColor = '#FFFFFF',
  accessibilityLabel,
}: BadgeProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    return () => cancelAnimation(scale);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.badge, { backgroundColor }, animatedStyle]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
