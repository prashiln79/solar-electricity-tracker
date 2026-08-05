/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F2F5F3',
    backgroundSelected: '#E2ECE5',
    textSecondary: '#5A635C',
    primary: '#1B5E20',
    primaryLight: '#E8F5E9',
    accent: '#F5B041',
    accentLight: '#FEF9E7',
    info: '#1F618D',
    infoLight: '#EBF5FB',
    error: '#C0392B',
    errorLight: '#FDEDEC',
  },
  dark: {
    text: '#ffffff',
    background: '#0E110F',
    backgroundElement: '#1A231C',
    backgroundSelected: '#2A3B2F',
    textSecondary: '#9CAD9F',
    primary: '#4CAF50',
    primaryLight: '#0D2D10',
    accent: '#F1C40F',
    accentLight: '#2C2505',
    info: '#3498DB',
    infoLight: '#112233',
    error: '#E74C3C',
    errorLight: '#3C1515',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
