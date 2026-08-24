import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { currencySymbol, isFamilyMode } = useSettingsStore();

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

  // Smart metrics calculations
  const netSavings = summary.totalIncome - summary.totalExpense;
  const savingsRate = summary.totalIncome > 0 
    ? Math.max(0, Math.min(100, (netSavings / summary.totalIncome) * 100))
    : 0;

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Reports & Analytics</Text>
          {isFamilyMode && (
            <Text style={[styles.subtitle, { color: colors.primary }]}>Family Mode Active</Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Key Metrics Ledger Card Grid */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Savings Rate */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Savings Rate</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {savingsRate.toFixed(1)}%
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textTertiary }]}>
              of total income
            </Text>
          </View>

          {/* Card 2: Top Category */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.accentContainer }]}>
              <Ionicons name="trending-down-outline" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Top Category</Text>
            <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
              {topCategory ? topCategory.category : 'None'}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textTertiary }]}>
              {topCategory ? formatCurrency(topCategory.amount, currencySymbol) : 'No expenses'}
            </Text>
          </View>

          {/* Card 3: Net Savings */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Net Savings</Text>
            <Text style={[styles.metricValue, { color: netSavings >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(netSavings, currencySymbol)}
            </Text>
            <Text style={[styles.metricMeta, { color: colors.textTertiary }]}>
              surplus this period
            </Text>
          </View>
        </View>

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
              <View style={styles.progressContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${item.percentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    ...Typography.titleLarge,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricMeta: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },

  overviewCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    ...Typography.titleSmall,
    marginBottom: Spacing.md,
  },
  barContainer: {
    height: 16,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  bar: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  legendItem: {
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  legendValue: {
    ...Typography.titleSmall,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    marginBottom: Spacing.md,
  },
  catRow: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  catName: {
    ...Typography.titleSmall,
  },
  catAmount: {
    ...Typography.bodySmall,
  },
  progressContainer: {
    height: 6,
    width: '100%',
  },
  progressBarBg: {
    height: '100%',
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  emptyCard: {
    borderRadius: BorderRadius.xl,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
