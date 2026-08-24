import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Switch,
  Pressable,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useAuthStore } from '@/store/useAuthStore';
import { TransactionType } from '@/types/enums';
import type { Category, Account, CreateTransactionRequest } from '@/types/models';

interface AddTransactionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

// Format date helper: "24 Aug 2026 Today"
function formatDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateStr = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (date.toDateString() === today.toDateString()) {
    return `${dateStr} Today`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `${dateStr} Yesterday`;
  } else {
    return dateStr;
  }
}

export default function AddTransactionBottomSheet({ visible, onClose }: AddTransactionBottomSheetProps) {
  const db = useSQLiteContext();
  const colors = useThemeColors();

  const user = useAuthStore((s) => s.user);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const { categories, expenseCategories, incomeCategories, addCategory, loadCategories } = useCategoryStore();
  const { accounts, addAccount, loadAccounts } = useAccountStore();

  // Form State
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(null);
  const [isTransfer, setIsTransfer] = useState(false);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());

  // Expandable selector states
  const [showCategories, setShowCategories] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showToAccounts, setShowToAccounts] = useState(false);

  // Modal selector states
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Add State (Category / Account)
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'category' | 'account' | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  // Determine active categories
  const activeCategories = type === TransactionType.INCOME ? incomeCategories : expenseCategories;

  // Load database choices and reset form values when sheet becomes visible
  useEffect(() => {
    if (visible) {
      setType(TransactionType.EXPENSE);
      setAmount('');
      setSelectedCategory(null);
      setSelectedToAccount(null);
      setIsTransfer(false);
      setNotes('');
      setDate(new Date());
      setShowCategories(false);
      setShowAccounts(false);
      setShowToAccounts(false);

      if (user?.uid) {
        Promise.all([
          loadCategories(db, user.uid),
          loadAccounts(db, user.uid)
        ]).then(() => {
          const latestAccounts = useAccountStore.getState().accounts;
          setSelectedAccount(latestAccounts[0] || null);
        }).catch(err => {
          console.error("Failed to load choices:", err);
        });
      }
    }
  }, [visible, user?.uid, db]);

  // Handle Save
  const handleSave = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!isTransfer && !selectedCategory) {
      Alert.alert('Select Category', 'Please select a category.');
      return;
    }
    if (!selectedAccount) {
      Alert.alert('Select Account', 'Please select a source account.');
      return;
    }
    if (isTransfer && !selectedToAccount) {
      Alert.alert('Select To Account', 'Please select the destination account.');
      return;
    }
    if (isTransfer && selectedToAccount && selectedAccount.accountId === selectedToAccount.accountId) {
      Alert.alert('Invalid Transfer', 'Source and destination accounts must be different.');
      return;
    }
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      const finalType = isTransfer ? TransactionType.TRANSFER : type;

      const request: CreateTransactionRequest = {
        amount: parseFloat(amount),
        type: finalType,
        categoryId: isTransfer ? 'transfer' : selectedCategory!.id!,
        category: isTransfer ? 'Transfer' : selectedCategory!.name,
        accountId: selectedAccount.accountId,
        notes: notes || undefined,
        date: date.getTime(),
        fromAccountId: selectedAccount.accountId,
        toAccountId: isTransfer && selectedToAccount ? selectedToAccount.accountId : undefined,
      };

      await addTransaction(db, user.uid, request);
      
      // Refresh stores so screens update immediately
      await loadTransactions(db, user.uid);
      await loadAccounts(db, user.uid);

      onClose();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [amount, selectedCategory, selectedAccount, selectedToAccount, isTransfer, notes, date, type, user?.uid, db, onClose]);

  // Quick Add confirm
  const handleQuickAddConfirm = async () => {
    if (!quickAddValue.trim() || !user?.uid) return;

    try {
      if (quickAddType === 'category') {
        const newCat = await addCategory(db, user.uid, {
          name: quickAddValue.trim(),
          type: type,
          icon: '📦',
          color: colors.primary,
          isSystem: false,
          familyId: '',
        });
        setSelectedCategory(newCat);
      } else {
        const newAcc = await addAccount(db, user.uid, {
          name: quickAddValue.trim(),
          type: 'bank' as any,
          balance: 0,
          currency: 'INR',
        });
        if (showToAccounts) {
          setSelectedToAccount(newAcc);
        } else {
          setSelectedAccount(newAcc);
        }
      }
      setQuickAddVisible(false);
      setQuickAddValue('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Add Transaction</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Scrollable Form */}
              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* ─── CARD 1: Type, Amount, Category, Date ─── */}
                <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                  {/* Segmented Controls for Expense/Income (only show if not transfer) */}
                  {!isTransfer && (
                    <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceVariant }]}>
                      <TouchableOpacity
                        style={[
                          styles.segmentButton,
                          type === TransactionType.EXPENSE && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          setType(TransactionType.EXPENSE);
                          setSelectedCategory(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: type === TransactionType.EXPENSE ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          Expense
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.segmentButton,
                          type === TransactionType.INCOME && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          setType(TransactionType.INCOME);
                          setSelectedCategory(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: type === TransactionType.INCOME ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          Income
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Amount Input */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount *</Text>
                  <View style={[styles.amountBox, { borderColor: colors.primary }]}>
                    <TextInput
                      style={[styles.amountInput, { color: colors.text }]}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="decimal-pad"
                      maxLength={10}
                    />
                  </View>

                  {/* Category Selection (hide if transfer) */}
                  {!isTransfer && (
                    <View style={styles.formItem}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setQuickAddType('category');
                            setQuickAddVisible(true);
                          }}
                        >
                          <Text style={[styles.addLink, { color: colors.primary }]}>+ Add</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[styles.selectorBox, { borderColor: colors.border }]}
                        onPress={() => {
                          setShowCategories(true);
                          setShowAccounts(false);
                        }}
                      >
                        <Text style={[styles.selectorValue, { color: selectedCategory ? colors.text : colors.textTertiary }]}>
                          {selectedCategory ? `${selectedCategory.icon}  ${selectedCategory.name}` : 'Select a category'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Date Input */}
                  <View style={[styles.formItem, { marginTop: 14 }]}>
                    <TouchableOpacity
                      style={[styles.selectorBox, { borderColor: colors.border }]}
                      onPress={() => setShowCalendar(true)}
                    >
                      <View style={styles.dateSelectorLeft}>
                        <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                        <View>
                          <Text style={[styles.dateSelectorSub, { color: colors.textTertiary }]}>DATE</Text>
                          <Text style={[styles.selectorValue, { color: colors.text }]}>{formatDateLabel(date)}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ─── CARD 2: Account selection, Transfer Toggle ─── */}
                <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                  {/* Account Selector */}
                  <View style={styles.formItem}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Account *</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setQuickAddType('account');
                          setShowToAccounts(false);
                          setQuickAddVisible(true);
                        }}
                      >
                        <Text style={[styles.addLink, { color: colors.primary }]}>+ Add</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.selectorBox, { borderColor: colors.border }]}
                      onPress={() => {
                        setShowAccounts(!showAccounts);
                        setShowCategories(false);
                        setShowToAccounts(false);
                      }}
                    >
                      <View style={styles.selectorLeftWithIcon}>
                        <Ionicons name="wallet-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={[styles.selectorValue, { color: selectedAccount ? colors.text : colors.textTertiary }]}>
                          {selectedAccount ? selectedAccount.name : 'Select an account'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>

                    {showAccounts && (
                      <View style={[styles.pickerDropdown, { borderColor: colors.borderLight, backgroundColor: colors.surfaceVariant }]}>
                        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                          {accounts.map((acc) => (
                            <TouchableOpacity
                              key={acc.accountId}
                              style={styles.pickerItem}
                              onPress={() => {
                                  setSelectedAccount(acc);
                                  setShowAccounts(false);
                                }}
                            >
                              <Text style={[styles.pickerItemText, { color: colors.text }]}>💳  {acc.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Transfer Toggle */}
                  <View style={styles.toggleRow}>
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>Transfer to another account</Text>
                    <Switch
                      value={isTransfer}
                      onValueChange={(val) => {
                        setIsTransfer(val);
                        setSelectedCategory(null);
                        setSelectedToAccount(null);
                        setShowToAccounts(false);
                        setShowCategories(false);
                      }}
                      trackColor={{ false: '#767577', true: colors.primaryLight }}
                      thumbColor={isTransfer ? colors.primary : '#f4f3f4'}
                    />
                  </View>

                  {/* Destination Account Selection (only if Transfer is active) */}
                  {isTransfer && (
                    <View style={[styles.formItem, { marginTop: 14 }]}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>To Account *</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setQuickAddType('account');
                            setShowToAccounts(true);
                            setQuickAddVisible(true);
                          }}
                        >
                          <Text style={[styles.addLink, { color: colors.primary }]}>+ Add</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[styles.selectorBox, { borderColor: colors.border }]}
                        onPress={() => {
                          setShowToAccounts(!showToAccounts);
                          setShowAccounts(false);
                          setShowCategories(false);
                        }}
                      >
                        <View style={styles.selectorLeftWithIcon}>
                          <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                          <Text style={[styles.selectorValue, { color: selectedToAccount ? colors.text : colors.textTertiary }]}>
                            {selectedToAccount ? selectedToAccount.name : 'Select destination account'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                      </TouchableOpacity>

                      {showToAccounts && (
                        <View style={[styles.pickerDropdown, { borderColor: colors.borderLight, backgroundColor: colors.surfaceVariant }]}>
                          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                            {accounts
                              .filter((a) => a.accountId !== selectedAccount?.accountId)
                              .map((acc) => (
                                <TouchableOpacity
                                  key={acc.accountId}
                                  style={styles.pickerItem}
                                  onPress={() => {
                                    setSelectedToAccount(acc);
                                    setShowToAccounts(false);
                                  }}
                                >
                                  <Text style={[styles.pickerItemText, { color: colors.text }]}>💳  {acc.name}</Text>
                                </TouchableOpacity>
                              ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* ─── CARD 3: Notes ─── */}
                <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
                  <TextInput
                    style={[styles.notesInput, { color: colors.text, borderColor: colors.border }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add a note"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ─── CALENDAR PICKER OVERLAY ─── */}
      <CalendarPicker
        visible={showCalendar}
        value={date}
        onChange={setDate}
        onClose={() => setShowCalendar(false)}
      />

      {/* ─── QUICK ADD DIALOG OVERLAY ─── */}
      <QuickAddPrompt
        visible={quickAddVisible}
        type={quickAddType}
        value={quickAddValue}
        onChangeText={setQuickAddValue}
        onConfirm={handleQuickAddConfirm}
        onClose={() => {
          setQuickAddVisible(false);
          setQuickAddValue('');
        }}
      />

      {/* ─── CATEGORY PICKER OVERLAY ─── */}
      <CategoryPickerBottomSheet
        visible={showCategories}
        categories={activeCategories}
        onSelect={setSelectedCategory}
        onClose={() => setShowCategories(false)}
        colors={colors}
      />
    </>
  );
}

// ─── CATEGORY PICKER BOTTOM SHEET COMPONENT ───
function CategoryPickerBottomSheet({
  visible,
  categories,
  onSelect,
  onClose,
  colors,
}: {
  visible: boolean;
  categories: Category[];
  onSelect: (cat: Category) => void;
  onClose: () => void;
  colors: any;
}) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setSearch('');
    }
  }, [visible]);

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.bottomSheetBackdrop} onPress={onClose}>
        <Pressable style={[styles.bottomSheetContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.bottomSheetHeader, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Select Category</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBarContainer, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchBarInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search categories..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* List */}
          <ScrollView contentContainerStyle={styles.bottomSheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.categoryGrid}>
              {filtered.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryGridCard, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => {
                    onSelect(cat);
                    onClose();
                  }}
                >
                  <View style={[styles.categoryGridIconBox, { backgroundColor: cat.color + '20' }]}>
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                  </View>
                  <Text style={[styles.categoryGridName, { color: colors.text }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {filtered.length === 0 && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24, fontSize: 13, marginBottom: 40 }}>
                No matching categories found.
              </Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── CALENDAR PICKER COMPONENT ───
function CalendarPicker({ visible, value, onChange, onClose }: {
  visible: boolean;
  value: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const [currentMonth, setCurrentMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  useEffect(() => {
    if (visible) {
      setCurrentMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    }
  }, [visible, value]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={[styles.calendarCard, { backgroundColor: colors.surface }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.calendarMonthTitle, { color: colors.text }]}>{monthName}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarWeekdays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={[styles.calendarWeekday, { color: colors.textTertiary }]}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {days.map((day, i) => {
              if (day === null) {
                return <View key={`empty-${i}`} style={styles.calendarDayCell} />;
              }

              const isSelected = day.toDateString() === value.toDateString();
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <TouchableOpacity
                  key={`day-${i}`}
                  style={[
                    styles.calendarDayCell,
                    isSelected && { backgroundColor: colors.primary, borderRadius: 20 },
                  ]}
                  onPress={() => {
                    onChange(day);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                      isToday && !isSelected && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── QUICK ADD PROMPT COMPONENT ───
function QuickAddPrompt({ visible, type, value, onChangeText, onConfirm, onClose }: {
  visible: boolean;
  type: 'category' | 'account' | null;
  value: string;
  onChangeText: (t: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={[styles.promptCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.promptTitle, { color: colors.text }]}>
            Add New {type === 'category' ? 'Category' : 'Account'}
          </Text>
          <TextInput
            style={[styles.promptInput, { color: colors.text, borderColor: colors.border }]}
            placeholder={`Enter name`}
            placeholderTextColor={colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            autoFocus
          />
          <View style={styles.promptActions}>
            <TouchableOpacity style={styles.promptButton} onPress={onClose}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.promptButton, { backgroundColor: colors.primary }]}
              onPress={onConfirm}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    maxHeight: '90%',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confirmButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: 'rgba(0,0,0,0.02)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  amountBox: {
    borderWidth: 2,
    borderRadius: 12,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  formItem: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectorBox: {
    borderWidth: 1,
    borderRadius: 10,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelectorSub: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
  selectorLeftWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerDropdown: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -2,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 12,
    color: '#888',
    padding: 12,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 80,
  },
  // Calendar styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCard: {
    width: 320,
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavBtn: {
    padding: 6,
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekday: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Prompt styles
  promptCard: {
    width: 280,
    borderRadius: 16,
    padding: 20,
    elevation: 8,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  promptInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  promptActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  promptButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '75%',
    paddingBottom: 40,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bottomSheetTitle: {
    ...Typography.titleLarge,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: BorderRadius.md,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 6,
  },
  bottomSheetScroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryGridCard: {
    width: '30%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryGridIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryGridName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
