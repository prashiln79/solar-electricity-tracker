import React, { useState } from 'react';
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
import { useCategoryStore } from '@/store/useCategoryStore';
import type { Category } from '@/types/models';

type Tab = 'expense' | 'income';

export default function CategoriesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { expenseCategories, incomeCategories } = useCategoryStore();
  const [tab, setTab] = useState<Tab>('expense');

  const categories = tab === 'expense' ? expenseCategories : incomeCategories;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: tab === 'expense' ? colors.expenseLight : colors.surfaceVariant },
          ]}
          onPress={() => setTab('expense')}
        >
          <Text style={[styles.tabText, { color: tab === 'expense' ? colors.expense : colors.textSecondary }]}>
            Expenses ({expenseCategories.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: tab === 'income' ? colors.incomeLight : colors.surfaceVariant },
          ]}
          onPress={() => setTab('income')}
        >
          <Text style={[styles.tabText, { color: tab === 'income' ? colors.income : colors.textSecondary }]}>
            Income ({incomeCategories.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {categories.map((cat: Category) => (
            <View key={cat.id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
                <Text style={styles.icon}>{cat.icon}</Text>
              </View>
              <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                {cat.name}
              </Text>
              {cat.group && (
                <Text style={[styles.groupBadge, { color: colors.textTertiary }]}>
                  {cat.group}
                </Text>
              )}
            </View>
          ))}
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
  title: { ...Typography.titleLarge },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  tabText: { ...Typography.labelMedium },

  content: { paddingHorizontal: Spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  icon: { fontSize: 24 },
  catName: { ...Typography.titleSmall, marginBottom: 2 },
  groupBadge: { ...Typography.labelSmall },
});
