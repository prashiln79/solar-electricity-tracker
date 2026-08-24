/**
 * Standard Firebase Configuration & SDK Initialization for Money Manager.
 * Ported from Angular project environment.ts (money-manager-b394e).
 *
 * Features:
 * - Singleton App initialization
 * - AsyncStorage Auth persistence for React Native
 * - Cloud Firestore instance export
 * - Environment variable override support (EXPO_PUBLIC_FIREBASE_*)
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// @ts-ignore — getReactNativePersistence is exported by Firebase React Native entrypoint at runtime
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCbi9w0M2U4jtO6tkf78SHvXrgvL4TbyqI',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'money-manager-b394e.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'money-manager-b394e',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'money-manager-b394e.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '844099376199',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:844099376199:web:d778d53279e65258b48d62',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-G75KP504VD',
};

// 1. Initialize Firebase App (Singleton Pattern)
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firebase Auth with AsyncStorage Persistence
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  // Fast Refresh / HMR safe fallback
  authInstance = getAuth(app);
}

export const auth: Auth = authInstance;

// 3. Initialize Cloud Firestore Instance
export const db: Firestore = getFirestore(app);
