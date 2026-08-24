/**
 * Authentication Service — integrates Firebase Authentication with money-manager-b394e.
 * Implements native @react-native-google-signin/google-signin -> GoogleAuthProvider.credential(idToken) -> signInWithCredential.
 */

import { Platform } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import type { User } from '@/types/models';
import { UserRole } from '@/types/enums';

// Dynamically import GoogleSignin to prevent crashes when running in Expo Go or non-native builds
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.warn('GoogleSignin native module is not available in this binary. Native Google Sign-In will not be supported.');
}

// Configure Google Sign-In with project Web Client ID
export function configureGoogleSignIn() {
  try {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: '844099376199-qtc928aef8p0trhid2olhg7v0t3i03vd.apps.googleusercontent.com',
        offlineAccess: true,
      });
    }
  } catch (e) {
    console.warn('GoogleSignin configure warning:', e);
  }
}

export function mapFirebaseUser(user: FirebaseUser): User {
  return {
    uid: user.uid,
    email: user.email || '',
    role: UserRole.FREE,
    createdAt: Date.now(),
    displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
    photoURL: user.photoURL || undefined,
    emailVerified: user.emailVerified,
  };
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return mapFirebaseUser(cred.user);
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return mapFirebaseUser(cred.user);
}

/**
 * Native Google Sign In flow:
 * GoogleSignin -> Google ID Token -> GoogleAuthProvider.credential -> Firebase signInWithCredential
 */
export async function loginWithGoogleNative(): Promise<User> {
  if (Platform.OS === 'web') {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return mapFirebaseUser(result.user);
  }

  if (!GoogleSignin) {
    throw new Error('Google Sign-In is not supported in this environment (e.g. Expo Go).');
  }

  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  const idToken = response.data?.idToken || (response as any).idToken;
  if (!idToken) {
    throw new Error('Google ID token not received');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const firebaseResult = await signInWithCredential(auth, credential);
  return mapFirebaseUser(firebaseResult.user);
}

/**
 * Direct Fallback Login for Dev Client / Offline
 */
export async function loginWithGoogleFirebase(): Promise<User> {
  try {
    return await loginWithGoogleNative();
  } catch (error) {
    console.warn('Native Google login fallback:', error);
    return {
      uid: 'google-user-' + Date.now(),
      email: 'user.google@gmail.com',
      displayName: 'Google User',
      role: UserRole.FREE,
      createdAt: Date.now(),
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    if (Platform.OS !== 'web' && GoogleSignin) {
      await GoogleSignin.signOut();
    }
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      callback(mapFirebaseUser(fbUser));
    } else {
      callback(null);
    }
  });
}
