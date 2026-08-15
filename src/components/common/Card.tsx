import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { useThemeColors, BorderRadius, Spacing } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'flat' | 'elevated' | 'bordered';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
  const colors = useThemeColors();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'bordered':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.surfaceVariant,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        };
    }
  };

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
});
