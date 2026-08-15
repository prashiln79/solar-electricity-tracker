/**
 * Custom hook to detect system color scheme.
 * Compatible with Expo SDK 57.
 */

import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  return useRNColorScheme() ?? 'light';
}
