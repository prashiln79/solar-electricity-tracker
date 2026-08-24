import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import {
  loginWithEmail,
  loginWithGoogleNative,
  loginWithGoogleFirebase,
} from '@/services/authService';

export default function SignInScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const colors = useThemeColors();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loadUserDataFor = async (userId: string) => {
    try {
      const categoryStore = useCategoryStore.getState();
      await categoryStore.loadCategories(db, userId);
      if (categoryStore.categories.length === 0) {
        await categoryStore.seedDefaults(db, userId);
      }
      await useAccountStore.getState().loadAccounts(db, userId);
      await useTransactionStore.getState().loadTransactions(db, userId);
    } catch (e) {
      console.warn('Failed to load user data on login:', e);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogleNative();
      setUser(user);
      await loadUserDataFor(user.uid);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.warn('Google Sign In error:', error);
      const fallbackUser = await loginWithGoogleFirebase();
      setUser(fallbackUser);
      await loadUserDataFor(fallbackUser.uid);
      router.replace('/(tabs)');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    const guestUser = {
      uid: 'local-user',
      email: 'guest@local',
      displayName: 'Guest User',
      role: 'free' as any,
      createdAt: Date.now(),
    };
    setUser(guestUser);
    await loadUserDataFor(guestUser.uid);
    router.replace('/(tabs)');
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Sign In', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      setUser(user);
      await loadUserDataFor(user.uid);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Failed', error?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header / Logo */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.appIconImage}
            contentFit="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>Money Manager</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Smart budgeting, simplified.
          </Text>
        </View>

        {/* Actions Container */}
        <View style={styles.form}>
          {/* Sign In with Google Button */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              googleLoading && { opacity: 0.7 },
            ]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <View style={styles.googleIconCircle}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                </View>
                <Text style={[styles.googleButtonText, { color: colors.text }]}>
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Or Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Use Offline Button */}
          <TouchableOpacity
            style={[styles.offlineButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={handleGuestSignIn}
            activeOpacity={0.8}
          >
            <Ionicons name="wifi-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.offlineButtonText, { color: colors.textSecondary }]}>
              Use Offline
            </Text>
          </TouchableOpacity>

          {/* Email / Password section */}
          <View style={styles.emailSection}>
            <Input
              label="Email Address"
              placeholder="enter@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />}
            />

            <Button
              title="Sign In with Email"
              onPress={handleEmailSignIn}
              loading={loading}
              style={styles.signInButton}
            />
          </View>
        </View>

        {/* Trust Badges Footer */}
        <View style={[styles.trustSection, { borderTopColor: colors.borderLight }]}>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <Text style={[styles.trustText, { color: colors.textSecondary }]}>Encrypted</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={[styles.trustText, { color: colors.textSecondary }]}>Private</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="hardware-chip-outline" size={18} color={colors.primary} />
              <Text style={[styles.trustText, { color: colors.textSecondary }]}>Stored Locally</Text>
            </View>
          </View>
        </View>

        {/* Register link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 70,
    paddingBottom: Spacing.xxl,
  },

  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  appIconImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  appName: {
    ...Typography.headlineLarge,
    marginBottom: 4,
  },
  tagline: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },

  form: {
    marginBottom: Spacing.xxl,
  },

  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    ...Typography.labelLarge,
    fontWeight: '600',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    ...Typography.labelSmall,
  },

  // Offline button
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  offlineButtonText: {
    ...Typography.labelMedium,
  },

  emailSection: {
    marginTop: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  signInButton: {
    marginTop: Spacing.md,
  },

  // Trust section
  trustSection: {
    paddingTop: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xl,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustItem: {
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    ...Typography.labelSmall,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.bodyMedium,
  },
  signUpLink: {
    ...Typography.labelLarge,
  },
});
