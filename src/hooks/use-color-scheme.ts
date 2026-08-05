import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useEnergyStore } from '@/store/useEnergyStore';

export function useColorScheme() {
  const darkModeSetting = useEnergyStore((state) => state.settings.darkMode);
  const deviceScheme = useDeviceColorScheme();

  if (darkModeSetting === 'light') {
    return 'light';
  }
  if (darkModeSetting === 'dark') {
    return 'dark';
  }
  return deviceScheme === 'unspecified' || !deviceScheme ? 'light' : deviceScheme;
}
