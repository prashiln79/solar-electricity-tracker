/**
 * More tab — settings, tools, navigation to secondary features, and authentication.
 * Uses MaterialIcons matching Angular Material icons.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAccountStore } from '@/store/useAccountStore';
import { ThemeType } from '@/types/enums';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface MenuItem {
  id: string;
  label: string;
  icon: MaterialIconName;
  iconColor: string;
  iconBg: string;
  route?: string;
  onPress?: () => void;
  badge?: string;
  isDanger?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const { user, logout } = useAuthStore();
  const { themeMode, setThemeMode } = useSettingsStore();
  const { summary } = useTransactionStore();
  const { accounts } = useAccountStore();

  const isGuest = !user || user.uid === 'local-user' || user.email === 'guest@local';

  const toggleTheme = () => {
    if (themeMode === ThemeType.LIGHT) setThemeMode(ThemeType.DARK);
    else if (themeMode === ThemeType.DARK) setThemeMode(ThemeType.AUTO);
    else setThemeMode(ThemeType.LIGHT);
  };

  const handleUserCardPress = () => {
    if (isGuest) {
      router.push('/(auth)/sign-in');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const themeLabel =
    themeMode === ThemeType.DARK ? 'Dark' : themeMode === ThemeType.LIGHT ? 'Light' : 'Auto';

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Navigation',
      items: [
        {
          id: 'accounts',
          label: 'Accounts',
          icon: 'account-balance',
          iconColor: colors.primary,
          iconBg: colors.primaryContainer,
          badge: `${accounts.length}`,
          onPress: () => router.push('/accounts' as any),
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: 'layers',
          iconColor: colors.accent,
          iconBg: colors.accentContainer,
          onPress: () => router.push('/categories' as any),
        },
        {
          id: 'reports',
          label: 'Reports & Analytics',
          icon: 'assessment',
          iconColor: colors.income,
          iconBg: colors.incomeLight,
          onPress: () => router.push('/reports' as any),
        },
        {
          id: 'goals',
          label: 'Financial Goals',
          icon: 'flag',
          iconColor: colors.warning,
          iconBg: colors.warningLight,
          onPress: () => router.push('/goals' as any),
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          id: 'family',
          label: 'Family Groups',
          icon: 'family-restroom',
          iconColor: colors.transfer,
          iconBg: colors.transferLight,
          onPress: () => router.push('/family' as any),
        },
      ],
    },
    {
      title: 'Settings & Account',
      items: [
        {
          id: 'theme',
          label: `Theme: ${themeLabel}`,
          icon:
            themeMode === ThemeType.DARK
              ? 'brightness-4'
              : themeMode === ThemeType.LIGHT
                ? 'brightness-7'
                : 'palette',
          iconColor: colors.warning,
          iconBg: colors.warningLight,
          onPress: toggleTheme,
        },
        isGuest
          ? {
              id: 'sign-in',
              label: 'Sign In / Register',
              icon: 'login',
              iconColor: colors.primary,
              iconBg: colors.primaryContainer,
              onPress: () => router.push('/(auth)/sign-in'),
            }
          : {
              id: 'sign-out',
              label: 'Sign Out',
              icon: 'logout',
              iconColor: colors.expense,
              iconBg: colors.expenseLight,
              isDanger: true,
              onPress: handleSignOut,
            },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>More</Text>
      </View>

      {/* User Card — Clickable */}
      <TouchableOpacity
        style={[styles.userCard, { backgroundColor: colors.surface }]}
        onPress={handleUserCardPress}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name="person" size={28} color={colors.primary} />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {isGuest ? 'Guest User' : user?.displayName || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {isGuest ? 'Tap here to sign in' : user?.email}
          </Text>
        </View>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: isGuest ? colors.accentContainer : colors.primaryContainer },
          ]}
        >
          <Text
            style={[
              styles.roleText,
              { color: isGuest ? colors.accent : colors.primary },
            ]}
          >
            {isGuest ? 'SIGN IN' : user?.role?.toUpperCase() || 'FREE'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Menu Sections */}
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {section.title}
          </Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index < section.items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.borderLight,
                  },
                ]}
                onPress={item.onPress || (() => {})}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    { color: item.isDanger ? colors.expense : colors.text },
                  ]}
                >
                  {item.label}
                </Text>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appName, { color: colors.textTertiary }]}>
          Money Manager v1.0.0
        </Text>
        <Text style={[styles.appStats, { color: colors.textTertiary }]}>
          {summary.transactionCount} transactions · {accounts.length} accounts
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 120 : 100, paddingBottom: 110 },

  header: { marginBottom: Spacing.xl },
  title: { ...Typography.displaySmall },

  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xxl,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  userInfo: { flex: 1 },
  userName: { ...Typography.titleLarge, marginBottom: 2 },
  userEmail: { ...Typography.bodySmall },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: { ...Typography.labelSmall, fontWeight: '700' },

  // Sections
  section: { marginBottom: Spacing.xxl },
  sectionTitle: {
    ...Typography.labelMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuGroup: { borderRadius: BorderRadius.lg, overflow: 'hidden' },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: { ...Typography.bodyMedium, flex: 1 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: { ...Typography.labelSmall },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  appName: { ...Typography.labelSmall, marginBottom: 4 },
  appStats: { ...Typography.labelSmall },
});
