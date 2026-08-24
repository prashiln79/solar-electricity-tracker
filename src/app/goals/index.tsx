import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Goal } from '@/types/models';

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export default function GoalsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { currencySymbol } = useSettingsStore();

  // Mock goals for Phase 4 display (Goal store hook integration)
  const [goals] = useState<Goal[]>([
    {
      id: 'g1',
      userId: 'local-user',
      name: 'Emergency Fund',
      description: '6 months of living expenses',
      type: 'savings' as any,
      targetAmount: 100000,
      currentAmount: 65000,
      status: 'active' as any,
      startDate: Date.now() - 90 * 86400000,
      targetDate: Date.now() + 90 * 86400000,
      progressPercentage: 65,
      remainingAmount: 35000,
      isOnTrack: true,
      autoContribution: false,
      contributionFrequency: 'monthly',
      milestones: [],
      alertThreshold: 80,
      isAlertEnabled: true,
      syncStatus: 'pending' as any,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'local-user',
      updatedBy: 'local-user',
    },
    {
      id: 'g2',
      userId: 'local-user',
      name: 'New Laptop',
      description: 'MacBook Pro M3',
      type: 'purchase' as any,
      targetAmount: 150000,
      currentAmount: 45000,
      status: 'active' as any,
      startDate: Date.now() - 30 * 86400000,
      targetDate: Date.now() + 180 * 86400000,
      progressPercentage: 30,
      remainingAmount: 105000,
      isOnTrack: true,
      autoContribution: false,
      contributionFrequency: 'monthly',
      milestones: [],
      alertThreshold: 80,
      isAlertEnabled: true,
      syncStatus: 'pending' as any,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'local-user',
      updatedBy: 'local-user',
    },
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Financial Goals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {goals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name="flag" size={20} color={colors.primary} />
                </View>
                <View style={styles.goalTitleBox}>
                  <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                  {goal.description && (
                    <Text style={[styles.goalDesc, { color: colors.textTertiary }]}>
                      {goal.description}
                    </Text>
                  )}
                </View>
                <Text style={[styles.progressBadge, { color: colors.primary }]}>
                  {progress.toFixed(0)}%
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.track, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.fill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  Saved: {formatCurrency(goal.currentAmount, currencySymbol)}
                </Text>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  Target: {formatCurrency(goal.targetAmount, currencySymbol)}
                </Text>
              </View>
            </View>
          );
        })}
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

  goalCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  goalTitleBox: { flex: 1 },
  goalName: { ...Typography.titleMedium },
  goalDesc: { ...Typography.labelSmall },
  progressBadge: { ...Typography.titleMedium, fontWeight: '700' },

  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  fill: { height: '100%', borderRadius: 5 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: { ...Typography.bodySmall },
});
