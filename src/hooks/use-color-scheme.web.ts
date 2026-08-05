import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useEnergyStore } from '@/store/useEnergyStore';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const darkModeSetting = useEnergyStore((state) => state.settings.darkMode);
  const deviceScheme = useRNColorScheme();

  if (hasHydrated) {
    if (darkModeSetting === 'light') return 'light';
    if (darkModeSetting === 'dark') return 'dark';
    return deviceScheme === 'unspecified' || !deviceScheme ? 'light' : deviceScheme;
  }

  return 'light';
}
