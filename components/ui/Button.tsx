import React from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Platform, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { ThemeColors } from '../../utils/theme';

export type ButtonVariant = 'filled' | 'outlined' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  colors: ThemeColors;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

/**
 * Modern, reusable Button component
 * Provides consistent styling across the app
 *
 * Variants:
 * - filled: Primary action button with solid background
 * - outlined: Secondary action with border only
 * - ghost: Minimal button with no border
 *
 * Sizes:
 * - small: Compact button (e.g., chips, inline actions)
 * - medium: Standard button (default)
 * - large: Prominent action (e.g., CTAs)
 */
export function Button({
  children,
  onPress,
  variant = 'outlined',
  size = 'medium',
  colors,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonStyle: StyleProp<ViewStyle> = [
    styles.base,
    styles[`size_${size}` as keyof typeof styles],
    styles[`variant_${variant}` as keyof typeof styles],
    fullWidth && { width: '100%' },
    variant === 'filled' && {
      backgroundColor: disabled ? colors.disabled : colors.primary,
    },
    variant === 'outlined' && {
      borderColor: disabled ? colors.disabled : colors.primary,
      backgroundColor: 'transparent',
    },
    variant === 'ghost' && {
      backgroundColor: 'transparent',
    },
    style,
  ];

  const textColor = variant === 'filled' ? '#FFFFFF' : disabled ? colors.disabled : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
    >
      <Animated.View style={[buttonStyle, animatedStyle]}>
        <Text
          style={[
            styles.text,
            styles[`text_${size}` as keyof typeof styles],
            { color: textColor },
            textStyle,
          ]}
        >
          {children}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // Sizes
  size_small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  size_medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  size_large: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },

  // Variants
  variant_filled: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  variant_outlined: {
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
  },
  variant_ghost: {
    // No additional styles
  },

  // Text
  text: {
    fontWeight: Platform.OS === 'android' ? 'bold' : '600',
  },
  text_small: {
    fontSize: 12,
  },
  text_medium: {
    fontSize: 14,
  },
  text_large: {
    fontSize: 16,
  },
});
