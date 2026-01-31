import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemeColors } from '../../utils/theme';

export type ButtonVariant = 'filled' | 'outlined' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  colors: ThemeColors;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
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
  const buttonStyle: ViewStyle = {
    ...styles.base,
    ...styles[`size_${size}`],
    ...styles[`variant_${variant}`],
    ...(fullWidth && { width: '100%' }),
    ...(variant === 'filled' && {
      backgroundColor: disabled ? colors.disabled : colors.primary,
    }),
    ...(variant === 'outlined' && {
      borderColor: disabled ? colors.disabled : colors.primary,
      backgroundColor: 'transparent',
    }),
    ...(variant === 'ghost' && {
      backgroundColor: 'transparent',
    }),
    ...style,
  };

  const textColor =
    variant === 'filled'
      ? '#FFFFFF'
      : disabled
      ? colors.disabled
      : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={buttonStyle}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          styles[`text_${size}`],
          { color: textColor },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
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
    elevation: 1,
  },
  variant_ghost: {
    // No additional styles
  },

  // Text
  text: {
    fontWeight: '600',
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
