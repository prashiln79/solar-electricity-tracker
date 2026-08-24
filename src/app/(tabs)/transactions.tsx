/**
 * Transactions tab — full transaction list with inline search and date period navigation.
 */

import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  TextInput,
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

function getPeriodDetails(date: Date, view: 'WEEKLY' | 'MONTHLY' | 'YEARLY') {
  const start = new Date(date);
  const end = new Date(date);

  if (view === 'WEEKLY') {
    // Start of week (Sunday)
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);

    // End of week (Saturday)
    end.setDate(end.getDate() + (6 - day));
    end.setHours(23, 59, 59, 999);

    const startLabel = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const endLabel = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return {
      start,
      end,
      label: `${startLabel} - ${endLabel}`,
    };
  } else if (view === 'YEARLY') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
    return {
      start,
      end,
      label: start.getFullYear().toString(),
    };
  } else {
    // MONTHLY
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return {
      start,
      end,
      label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };
  }
}

export default function TransactionsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const colors = useThemeColors();

  const user = useAuthStore((s) => s.user);
  const { transactions, isLoading, loadTransactions } = useTransactionStore();
  const { currencySymbol, appView } = useSettingsStore();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Date range calculations
  const period = useMemo(() => {
    return getPeriodDetails(currentDate, appView || 'MONTHLY');
  }, [currentDate, appView]);

  const handlePrevPeriod = () => {
    const d = new Date(currentDate);
    if (appView === 'WEEKLY') d.setDate(d.getDate() - 7);
    else if (appView === 'YEARLY') d.setFullYear(d.getFullYear() - 1);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextPeriod = () => {
    const d = new Date(currentDate);
    if (appView === 'WEEKLY') d.setDate(d.getDate() + 7);
    else if (appView === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // 1. Filter by date period
      const inPeriod = txn.date >= period.start.getTime() && txn.date <= period.end.getTime();
      if (!inPeriod) return false;

      // 2. Filter by type tab
      if (activeFilter !== 'all' && txn.type !== activeFilter) return false;

      // 3. Filter by search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCat = txn.category?.toLowerCase().includes(query);
        const matchesPayee = txn.payee?.toLowerCase().includes(query);
        const matchesNotes = txn.notes?.toLowerCase().includes(query);
        if (!matchesCat && !matchesPayee && !matchesNotes) return false;
      }

      return true;
    });
  }, [transactions, period, activeFilter, searchQuery]);

  const groups = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

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
          router.push(`/transaction/${item.id}` as any);
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

  const flatData = useMemo(() => {
    return groups.flatMap((group) => [
      { rowType: 'header' as const, title: group.title, id: `header-${group.title}` },
      ...group.data.map((txn) => ({ rowType: 'item' as const, ...txn })),
    ]);
  }, [groups]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <View style={styles.headerSummary}>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {filteredTransactions.length} transactions in this period
          </Text>
        </View>
      </View>

      {/* Inline Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search category, payee, notes..."
          placeholderTextColor={colors.textTertiary}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && Platform.OS !== 'ios' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Date Period Navigator */}
      <View style={styles.navigatorContainer}>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.surfaceVariant }]} onPress={handlePrevPeriod}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.navigatorPill, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.navigatorText, { color: colors.text }]}>{period.label}</Text>
        </View>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.surfaceVariant }]} onPress={handleNextPeriod}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
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
          if (item.rowType === 'header') {
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
              {searchQuery || activeFilter !== 'all' ? 'Try a different filter or search term' : 'Add your first transaction to get started'}
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
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  title: { ...Typography.displaySmall },
  headerSummary: { marginTop: Spacing.xs },
  headerCount: { ...Typography.bodySmall },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },

  // Date Navigator
  navigatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  navigatorPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  navigatorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

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
