import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { borderRadius } from '../../utils/designSystem';

interface ChipProps {
  label: string;
  backgroundColor: string;
  textColor: string;
  onPress?: () => void;
}

export function Chip({ label, backgroundColor, textColor, onPress }: ChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (onPress) {
    return (
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        onPress={onPress}
      >
        <Animated.View style={[styles.chip, { backgroundColor }, animatedStyle]}>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[styles.chip, { backgroundColor }, animatedStyle]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minWidth: 32,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
});
