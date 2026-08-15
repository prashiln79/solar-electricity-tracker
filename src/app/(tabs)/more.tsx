/**
 * More tab — settings, tools, and navigation to secondary features.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAccountStore } from '@/store/useAccountStore';
import { ThemeType } from '@/types/enums';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  id: string;
  label: string;
  icon: IoniconsName;
  iconColor: string;
  iconBg: string;
  route?: string;
  onPress?: () => void;
  badge?: string;
}

export default function MoreScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const { themeMode, setThemeMode } = useSettingsStore();
  const { summary } = useTransactionStore();
  const { accounts } = useAccountStore();

  const toggleTheme = () => {
    if (themeMode === ThemeType.LIGHT) setThemeMode(ThemeType.DARK);
    else if (themeMode === ThemeType.DARK) setThemeMode(ThemeType.AUTO);
    else setThemeMode(ThemeType.LIGHT);
  };

  const themeLabel =
    themeMode === ThemeType.LIGHT ? 'Light' : themeMode === ThemeType.DARK ? 'Dark' : 'Auto';

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Navigation',
      items: [
        {
          id: 'accounts',
          label: 'Accounts',
          icon: 'wallet-outline',
          iconColor: colors.primary,
          iconBg: colors.primaryContainer,
          badge: `${accounts.length}`,
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: 'grid-outline',
          iconColor: colors.accent,
          iconBg: colors.accentContainer,
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: 'bar-chart-outline',
          iconColor: colors.income,
          iconBg: colors.incomeLight,
        },
        {
          id: 'goals',
          label: 'Goals',
          icon: 'flag-outline',
          iconColor: colors.warning,
          iconBg: colors.warningLight,
        },
        {
          id: 'recurring',
          label: 'Recurring',
          icon: 'repeat-outline',
          iconColor: colors.transfer,
          iconBg: colors.transferLight,
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          id: 'backup',
          label: 'Backup & Restore',
          icon: 'cloud-upload-outline',
          iconColor: colors.info,
          iconBg: colors.infoLight,
        },
        {
          id: 'calculator',
          label: 'Loan Calculator',
          icon: 'calculator-outline',
          iconColor: colors.expense,
          iconBg: colors.expenseLight,
        },
        {
          id: 'family',
          label: 'Family Groups',
          icon: 'people-outline',
          iconColor: colors.transfer,
          iconBg: colors.transferLight,
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          id: 'theme',
          label: `Theme: ${themeLabel}`,
          icon:
            themeMode === ThemeType.DARK
              ? 'moon-outline'
              : themeMode === ThemeType.LIGHT
                ? 'sunny-outline'
                : 'contrast-outline',
          iconColor: colors.warning,
          iconBg: colors.warningLight,
          onPress: toggleTheme,
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: 'person-outline',
          iconColor: colors.primary,
          iconBg: colors.primaryContainer,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: 'notifications-outline',
          iconColor: colors.accent,
          iconBg: colors.accentContainer,
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

      {/* User Card */}
      <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.displayName || 'Guest User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || 'guest@local'}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>
            {user?.role?.toUpperCase() || 'FREE'}
          </Text>
        </View>
      </View>

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
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 60 },

  header: { marginBottom: Spacing.xl },
  title: { ...Typography.displaySmall },

  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xxl,
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
    paddingVertical: Spacing.xxl,
  },
  appName: { ...Typography.labelSmall, marginBottom: 4 },
  appStats: { ...Typography.labelSmall },
});
