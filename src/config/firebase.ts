/**
 * Firebase configuration for Money Manager.
 * Ported from Angular project environment.ts (money-manager-b394e).
 * Configured with AsyncStorage for React Native auth state persistence.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore — getReactNativePersistence is exported by Firebase React Native entrypoint at runtime
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: 'AIzaSyCbi9w0M2U4jtO6tkf78SHvXrgvL4TbyqI',
  authDomain: 'money-manager-b394e.firebaseapp.com',
  projectId: 'money-manager-b394e',
  storageBucket: 'money-manager-b394e.firebasestorage.app',
  messagingSenderId: '844099376199',
  appId: '1:844099376199:web:d778d53279e65258b48d62',
  measurementId: 'G-G75KP504VD',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with AsyncStorage persistence
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  // Fallback if auth is already initialized (Fast Refresh / HMR)
  authInstance = getAuth(app);
}

export const auth = authInstance;
