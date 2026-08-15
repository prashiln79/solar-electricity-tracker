import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useAccountStore } from '@/store/useAccountStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AccountType } from '@/types/enums';
import type { Account } from '@/types/models';

function getAccountIcon(type: AccountType): string {
  switch (type) {
    case AccountType.BANK:
      return 'business-outline';
    case AccountType.CASH:
      return 'cash-outline';
    case AccountType.CREDIT:
      return 'card-outline';
    case AccountType.LOAN:
      return 'document-text-outline';
    case AccountType.INVESTMENT:
      return 'trending-up-outline';
    default:
      return 'wallet-outline';
  }
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function AccountsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { accounts, totalBalance } = useAccountStore();
  const { currencySymbol } = useSettingsStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Accounts</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/accounts/add' as any)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Balance Card */}
        <View style={[styles.totalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Net Worth / Balance</Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatCurrency(totalBalance, currencySymbol)}
          </Text>
          <Text style={[styles.totalCount, { color: colors.textTertiary }]}>
            {accounts.length} active {accounts.length === 1 ? 'account' : 'accounts'}
          </Text>
        </View>

        {/* Accounts List */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your Accounts</Text>

        {accounts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="wallet-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No accounts added yet</Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/accounts/add' as any)}
            >
              <Text style={styles.createButtonText}>Add Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          accounts.map((acc: Account) => (
            <View key={acc.accountId} style={[styles.accountCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name={getAccountIcon(acc.type) as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: colors.text }]}>{acc.name}</Text>
                <Text style={[styles.accountType, { color: colors.textTertiary }]}>
                  {acc.type.toUpperCase()} {acc.institution ? `· ${acc.institution}` : ''}
                </Text>
              </View>
              <Text style={[styles.accountBalance, { color: acc.balance >= 0 ? colors.text : colors.expense }]}>
                {formatCurrency(acc.balance, currencySymbol)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { padding: Spacing.xs },
  title: { ...Typography.titleLarge },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  totalCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  totalLabel: { ...Typography.labelMedium, marginBottom: Spacing.xs },
  totalAmount: { ...Typography.amountLarge, marginBottom: Spacing.xs },
  totalCount: { ...Typography.bodySmall },

  sectionTitle: {
    ...Typography.labelMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  accountInfo: { flex: 1 },
  accountName: { ...Typography.titleMedium, marginBottom: 2 },
  accountType: { ...Typography.labelSmall },
  accountBalance: { ...Typography.amountSmall },

  emptyState: {
    padding: Spacing.xxxl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  emptyText: { ...Typography.bodyMedium, marginTop: Spacing.md, marginBottom: Spacing.lg },
  createButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  createButtonText: { ...Typography.labelMedium, color: '#FFFFFF' },
});
