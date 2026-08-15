/**
 * Typography scale for Money Manager.
 */

import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const Typography = {
  // Display
  displayLarge: {
    fontFamily,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  displaySmall: {
    fontFamily,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.2,
  },

  // Heading
  headlineLarge: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  headlineMedium: {
    fontFamily,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  headlineSmall: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },

  // Title
  titleLarge: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  titleMedium: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleSmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },

  // Label
  labelLarge: {
    fontFamily,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.5,
  },

  // Amount (special for monetary values)
  amountLarge: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  amountMedium: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
  amountSmall: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;
