/**
 * Root layout — initializes SQLite, loads stores, applies theme.
 * Money Manager app entry point.
 */

import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { Slot } from 'expo-router';

import { initializeDatabase } from '@/database/db';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAccountStore } from '@/store/useAccountStore';
import { APP_CONFIG } from '@/constants/config';
import { Colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

/** Offline guest user ID (used when no Firebase auth is set up yet). */
const GUEST_USER_ID = 'local-user';

function AppInitializer() {
  const db = useSQLiteContext();
  const setUser = useAuthStore((s) => s.setUser);
  const colorScheme = useSettingsStore((s) => s.colorScheme);

  useEffect(() => {
    async function init() {
      try {
        // For Phase 1, use a local offline guest user.
        // Firebase auth will be integrated in Phase 2.
        setUser({
          uid: GUEST_USER_ID,
          email: 'guest@local',
          role: 'free' as any,
          createdAt: Date.now(),
          displayName: 'Guest User',
        });

        // Seed default categories if empty
        const categoryStore = useCategoryStore.getState();
        await categoryStore.loadCategories(db, GUEST_USER_ID);
        if (categoryStore.categories.length === 0) {
          await categoryStore.seedDefaults(db, GUEST_USER_ID);
        }

        // Load accounts and transactions
        await useAccountStore.getState().loadAccounts(db, GUEST_USER_ID);
        await useTransactionStore.getState().loadTransactions(db, GUEST_USER_ID);
      } catch (e) {
        console.error('Failed to initialize app:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, [db]);

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useSettingsStore((s) => s.colorScheme);

  return (
    <SQLiteProvider databaseName={APP_CONFIG.DB_NAME} onInit={initializeDatabase}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppInitializer />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
