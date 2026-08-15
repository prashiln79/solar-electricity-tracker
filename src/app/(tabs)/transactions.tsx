/**
 * Transactions tab — full transaction list with filters and search.
 */

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { TransactionType } from '@/types/enums';
import type { Transaction } from '@/types/models';

type FilterTab = 'all' | 'income' | 'expense' | 'transfer';

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDateGroup(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupTransactionsByDate(transactions: Transaction[]): { title: string; data: Transaction[] }[] {
  const groups = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    const key = formatDateGroup(txn.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(txn);
  }

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

export default function TransactionsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const colors = useThemeColors();

  const user = useAuthStore((s) => s.user);
  const { transactions, isLoading, loadTransactions, summary } = useTransactionStore();
  const { currencySymbol } = useSettingsStore();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredTransactions = transactions.filter((txn) => {
    if (activeFilter === 'all') return true;
    return txn.type === activeFilter;
  });

  const groups = groupTransactionsByDate(filteredTransactions);

  const onRefresh = useCallback(async () => {
    if (user?.uid) await loadTransactions(db, user.uid);
  }, [db, user?.uid]);

  const filters: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' },
    { key: 'transfer', label: 'Transfer' },
  ];

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === TransactionType.INCOME;
    const isTransfer = item.type === TransactionType.TRANSFER;
    const amountColor = isTransfer ? colors.transfer : isIncome ? colors.income : colors.expense;
    const prefix = isTransfer ? '' : isIncome ? '+' : '-';

    return (
      <TouchableOpacity
        style={[styles.txnItem, { backgroundColor: colors.surface }]}
        activeOpacity={0.7}
        onPress={() => {
          // Navigate to transaction detail in Phase 3
        }}
      >
        <View style={[styles.txnIconContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={styles.txnIcon}>
            {isTransfer ? '↔️' : isIncome ? '📈' : '📉'}
          </Text>
        </View>
        <View style={styles.txnDetails}>
          <Text style={[styles.txnCategory, { color: colors.text }]} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={[styles.txnMeta, { color: colors.textTertiary }]} numberOfLines={1}>
            {item.payee || item.notes || new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[styles.txnAmount, { color: amountColor }]}>
          {prefix}{formatCurrency(item.amount, currencySymbol)}
        </Text>
      </TouchableOpacity>
    );
  };

  const flatData = groups.flatMap((group) => [
    { type: 'header' as const, title: group.title, id: `header-${group.title}` },
    ...group.data.map((txn) => ({ type: 'item' as const, ...txn })),
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <View style={styles.headerSummary}>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {filteredTransactions.length} transactions
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surfaceVariant,
                },
              ]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: isActive ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transaction List */}
      <FlatList
        data={flatData}
        keyExtractor={(item) => ('id' in item && item.id ? item.id : `h-${(item as any).title}`)}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Text style={[styles.dateHeader, { color: colors.textSecondary }]}>
                {item.title}
              </Text>
            );
          }
          return renderTransaction({ item: item as unknown as Transaction });
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No transactions found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              {activeFilter !== 'all' ? 'Try a different filter' : 'Add your first transaction to get started'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { ...Typography.displaySmall },
  headerSummary: { marginTop: Spacing.xs },
  headerCount: { ...Typography.bodySmall },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterLabel: { ...Typography.labelMedium },

  // List
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  dateHeader: {
    ...Typography.labelMedium,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // Transaction item
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  txnIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  txnIcon: { fontSize: 20 },
  txnDetails: { flex: 1 },
  txnCategory: { ...Typography.titleSmall, marginBottom: 2 },
  txnMeta: { ...Typography.labelSmall },
  txnAmount: { ...Typography.amountSmall },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    ...Typography.titleMedium,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
