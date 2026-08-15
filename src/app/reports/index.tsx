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
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { TransactionType } from '@/types/enums';

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export default function ReportsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { transactions, summary } = useTransactionStore();
  const { currencySymbol } = useSettingsStore();

  // Category breakdown calculation
  const categoryTotals = new Map<string, number>();
  let totalExpense = 0;

  for (const txn of transactions) {
    if (txn.type === TransactionType.EXPENSE) {
      const current = categoryTotals.get(txn.category) || 0;
      categoryTotals.set(txn.category, current + txn.amount);
      totalExpense += txn.amount;
    }
  }

  const categoryBreakdown = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Reports & Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Income vs Expense Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Financial Overview</Text>

          <View style={styles.barContainer}>
            <View style={[styles.bar, { backgroundColor: colors.surfaceVariant }]}>
              {summary.totalIncome + summary.totalExpense > 0 && (
                <>
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: colors.income,
                      width: `${(summary.totalIncome / (summary.totalIncome + summary.totalExpense)) * 100}%`,
                    }}
                  />
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: colors.expense,
                      width: `${(summary.totalExpense / (summary.totalIncome + summary.totalExpense)) * 100}%`,
                    }}
                  />
                </>
              )}
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.income }]} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>
                {formatCurrency(summary.totalIncome, currencySymbol)}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.expense }]} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Expense</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>
                {formatCurrency(summary.totalExpense, currencySymbol)}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Spending Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Spending by Category</Text>

        {categoryBreakdown.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expense data available</Text>
          </View>
        ) : (
          categoryBreakdown.map((item) => (
            <View key={item.category} style={[styles.catRow, { backgroundColor: colors.surface }]}>
              <View style={styles.catInfo}>
                <Text style={[styles.catName, { color: colors.text }]}>{item.category}</Text>
                <Text style={[styles.catAmount, { color: colors.textSecondary }]}>
                  {formatCurrency(item.amount, currencySymbol)} ({item.percentage.toFixed(1)}%)
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${Math.min(item.percentage, 100)}%` },
                  ]}
                />
              </View>
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
  title: { ...Typography.titleLarge },

  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  overviewCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xxl,
  },
  cardTitle: { ...Typography.labelMedium, marginBottom: Spacing.md },

  barContainer: { marginBottom: Spacing.lg },
  bar: {
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  legendRow: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  legendLabel: { ...Typography.labelSmall, marginBottom: 2 },
  legendValue: { ...Typography.titleMedium },

  sectionTitle: {
    ...Typography.labelMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },

  catRow: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  catName: { ...Typography.titleMedium },
  catAmount: { ...Typography.bodySmall },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },

  emptyCard: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  emptyText: { ...Typography.bodyMedium },
});
