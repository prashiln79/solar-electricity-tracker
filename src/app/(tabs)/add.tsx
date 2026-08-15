/**
 * Add Transaction screen — form to create a new transaction.
 * Accessible via the center FAB tab button.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { TransactionType } from '@/types/enums';
import type { CreateTransactionRequest, Category, Account } from '@/types/models';

type TxnTypeTab = 'expense' | 'income' | 'transfer';

export default function AddTransactionScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const colors = useThemeColors();

  const user = useAuthStore((s) => s.user);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const { expenseCategories, incomeCategories } = useCategoryStore();
  const { accounts } = useAccountStore();
  const { currencySymbol } = useSettingsStore();

  // Form state
  const [type, setType] = useState<TxnTypeTab>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [payee, setPayee] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showCategories, setShowCategories] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSave = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category for this transaction.');
      return;
    }
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      const request: CreateTransactionRequest = {
        amount: parseFloat(amount),
        type: type as TransactionType,
        categoryId: selectedCategory.id!,
        category: selectedCategory.name,
        accountId: selectedAccount?.accountId,
        payee: payee || undefined,
        notes: notes || undefined,
        date: date.getTime(),
      };

      await addTransaction(db, user.uid, request);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [amount, selectedCategory, selectedAccount, payee, notes, date, type, user?.uid, db]);

  const typeConfig = {
    expense: { color: colors.expense, bg: colors.expenseLight, icon: 'arrow-up-circle' as const },
    income: { color: colors.income, bg: colors.incomeLight, icon: 'arrow-down-circle' as const },
    transfer: { color: colors.transfer, bg: colors.transferLight, icon: 'swap-horizontal' as const },
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Transaction</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 }]}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Selector */}
        <View style={styles.typeRow}>
          {(['expense', 'income', 'transfer'] as TxnTypeTab[]).map((t) => {
            const isActive = type === t;
            const config = typeConfig[t];
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeChip,
                  { backgroundColor: isActive ? config.bg : colors.surfaceVariant },
                ]}
                onPress={() => {
                  setType(t);
                  setSelectedCategory(null);
                }}
              >
                <Ionicons name={config.icon} size={18} color={isActive ? config.color : colors.textTertiary} />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: isActive ? config.color : colors.textSecondary },
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={[styles.currencySymbol, { color: typeConfig[type].color }]}>
            {currencySymbol}
          </Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Category Selector */}
        <TouchableOpacity
          style={[styles.fieldRow, { backgroundColor: colors.surface }]}
          onPress={() => setShowCategories(!showCategories)}
        >
          <View style={styles.fieldIcon}>
            <Text style={{ fontSize: 20 }}>{selectedCategory?.icon || '📦'}</Text>
          </View>
          <View style={styles.fieldContent}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
            <Text style={[styles.fieldValue, { color: selectedCategory ? colors.text : colors.textTertiary }]}>
              {selectedCategory?.name || 'Select category'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Category Grid (expandable) */}
        {showCategories && (
          <View style={[styles.categoryGrid, { backgroundColor: colors.surface }]}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: selectedCategory?.id === cat.id ? colors.primaryContainer : colors.surfaceVariant,
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  setShowCategories(false);
                }}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[styles.categoryName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Account Selector */}
        {type !== 'transfer' && (
          <TouchableOpacity
            style={[styles.fieldRow, { backgroundColor: colors.surface }]}
            onPress={() => setShowAccounts(!showAccounts)}
          >
            <View style={[styles.fieldIconSquare, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Account</Text>
              <Text style={[styles.fieldValue, { color: selectedAccount ? colors.text : colors.textTertiary }]}>
                {selectedAccount?.name || 'Select account (optional)'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}

        {showAccounts && (
          <View style={[styles.categoryGrid, { backgroundColor: colors.surface }]}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.accountId}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: selectedAccount?.accountId === acc.accountId ? colors.primaryContainer : colors.surfaceVariant,
                  },
                ]}
                onPress={() => {
                  setSelectedAccount(acc);
                  setShowAccounts(false);
                }}
              >
                <Ionicons name="wallet" size={16} color={colors.primary} />
                <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
            {accounts.length === 0 && (
              <Text style={[styles.emptyPicker, { color: colors.textTertiary }]}>
                No accounts yet. Add one from the More tab.
              </Text>
            )}
          </View>
        )}

        {/* Payee */}
        <View style={[styles.fieldRow, { backgroundColor: colors.surface }]}>
          <View style={[styles.fieldIconSquare, { backgroundColor: colors.accentContainer }]}>
            <Ionicons name="person-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.fieldContent}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Payee</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={payee}
              onChangeText={setPayee}
              placeholder="Who did you pay?"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.fieldRow, { backgroundColor: colors.surface }]}>
          <View style={[styles.fieldIconSquare, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="document-text-outline" size={20} color={colors.warning} />
          </View>
          <View style={styles.fieldContent}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note"
              placeholderTextColor={colors.textTertiary}
              multiline
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.titleLarge },
  saveButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  saveButtonText: {
    ...Typography.labelMedium,
    color: '#FFFFFF',
  },

  content: { paddingHorizontal: Spacing.lg },

  // Type Selector
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  typeLabel: { ...Typography.labelMedium },

  // Amount
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 100,
  },

  // Field Rows
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  fieldIconSquare: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  fieldContent: { flex: 1 },
  fieldLabel: { ...Typography.labelSmall, marginBottom: 2 },
  fieldValue: { ...Typography.bodyMedium },
  fieldInput: { ...Typography.bodyMedium, padding: 0 },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryIcon: { fontSize: 16 },
  categoryName: { ...Typography.labelSmall, maxWidth: 80 },
  emptyPicker: { ...Typography.bodySmall, padding: Spacing.md },
});
