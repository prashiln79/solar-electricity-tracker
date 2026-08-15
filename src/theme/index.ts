/**
 * Theme hook — resolves the current color palette based on settings.
 */

import { useSettingsStore } from '@/store/useSettingsStore';
import { Colors, type ThemeColors } from './colors';

export function useThemeColors(): ThemeColors {
  const colorScheme = useSettingsStore((s) => s.colorScheme);
  return Colors[colorScheme];
}

export { Colors } from './colors';
export { Typography } from './typography';
export { Spacing, BorderRadius, IconSize } from './spacing';
