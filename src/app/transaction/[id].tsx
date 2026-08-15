import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { TransactionType } from '@/types/enums';
import type { Transaction } from '@/types/models';

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const colors = useThemeColors();

  const user = useAuthStore((s) => s.user);
  const { transactions, removeTransaction } = useTransactionStore();
  const { currencySymbol } = useSettingsStore();

  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (id) {
      const found = transactions.find((t) => t.id === id);
      if (found) setTransaction(found);
    }
  }, [id, transactions]);

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (user?.uid && id) {
            await removeTransaction(db, id, user.uid);
            router.back();
          }
        },
      },
    ]);
  };

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isIncome = transaction.type === TransactionType.INCOME;
  const isTransfer = transaction.type === TransactionType.TRANSFER;
  const amountColor = isTransfer ? colors.transfer : isIncome ? colors.income : colors.expense;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction Details</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color={colors.expense} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconBox, { backgroundColor: amountColor + '20' }]}>
            <Text style={{ fontSize: 32 }}>{isTransfer ? '↔️' : isIncome ? '📈' : '📉'}</Text>
          </View>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(transaction.amount, currencySymbol)}
          </Text>
          <Text style={[styles.category, { color: colors.text }]}>{transaction.category}</Text>
          <Text style={[styles.date, { color: colors.textTertiary }]}>
            {new Date(transaction.date).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Details List */}
        <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
            <Text style={[styles.value, { color: colors.text }]}>{transaction.type.toUpperCase()}</Text>
          </View>
          {transaction.payee && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Payee</Text>
              <Text style={[styles.value, { color: colors.text }]}>{transaction.payee}</Text>
            </View>
          )}
          {transaction.notes && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
              <Text style={[styles.value, { color: colors.text }]}>{transaction.notes}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
            <Text style={[styles.value, { color: colors.income }]}>{transaction.status.toUpperCase()}</Text>
          </View>
        </View>
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
  headerTitle: { ...Typography.titleLarge },

  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  mainCard: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  amount: { ...Typography.displayMedium, marginBottom: Spacing.xs },
  category: { ...Typography.titleLarge, marginBottom: 4 },
  date: { ...Typography.bodySmall },

  detailsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  label: { ...Typography.labelMedium },
  value: { ...Typography.bodyMedium, fontWeight: '500' },

  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { ...Typography.bodyMedium },
});
