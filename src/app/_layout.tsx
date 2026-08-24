/**
 * Root layout — initializes SQLite, subscribes to Firebase Auth, loads stores.
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
import { subscribeToAuthChanges } from '@/services/authService';
import { APP_CONFIG } from '@/constants/config';

SplashScreen.preventAutoHideAsync();

const GUEST_USER_ID = 'local-user';

function AppInitializer() {
  const db = useSQLiteContext();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let isMounted = true;

    async function loadUserData(userId: string) {
      try {
        const categoryStore = useCategoryStore.getState();
        await categoryStore.loadCategories(db, userId);
        if (categoryStore.categories.length === 0) {
          await categoryStore.seedDefaults(db, userId);
        }
        await useAccountStore.getState().loadAccounts(db, userId);
        await useTransactionStore.getState().loadTransactions(db, userId);
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    }

    // Subscribe to real-time Firebase Auth state changes
    const unsubscribe = subscribeToAuthChanges((fbUser) => {
      if (!isMounted) return;

      const activeUser = fbUser || {
        uid: GUEST_USER_ID,
        email: 'guest@local',
        role: 'free' as any,
        createdAt: Date.now(),
        displayName: 'Guest User',
      };

      setUser(activeUser);
      loadUserData(activeUser.uid).finally(() => {
        SplashScreen.hideAsync();
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
