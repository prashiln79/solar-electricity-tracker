import { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { initializeDatabase } from '@/database/db';
import { useEnergyStore } from '@/store/useEnergyStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Slot } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppInitializer() {
  const db = useSQLiteContext();
  const loadStore = useEnergyStore((state) => state.loadStore);
  const isLoading = useEnergyStore((state) => state.isLoading);

  useEffect(() => {
    async function init() {
      try {
        await loadStore(db);
      } catch (e) {
        console.error('Failed to load store during app initialization:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, [db]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <>
      <Slot />
      <AnimatedSplashOverlay />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName="solar_tracker.db" onInit={initializeDatabase}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppInitializer />
      </ThemeProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
