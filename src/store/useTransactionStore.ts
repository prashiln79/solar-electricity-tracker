/**
 * Transaction store — manages transaction state and operations.
 * Uses SQLite via repositories for persistence.
 */

import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Transaction, CreateTransactionRequest, TransactionFilter, TransactionSummary } from '@/types/models';
import * as txnRepo from '@/database/repositories/transactionRepository';
import { TransactionType } from '@/types/enums';
import { pushToFirebase } from '@/services/syncService';
import { useSettingsStore } from '@/store/useSettingsStore';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filter: TransactionFilter;

  // Computed
  summary: TransactionSummary;

  // Actions
  loadTransactions: (db: SQLiteDatabase, userId: string) => Promise<void>;
  addTransaction: (db: SQLiteDatabase, userId: string, request: CreateTransactionRequest) => Promise<Transaction>;
  editTransaction: (db: SQLiteDatabase, id: string, userId: string, updates: Partial<CreateTransactionRequest>) => Promise<Transaction | null>;
  removeTransaction: (db: SQLiteDatabase, id: string, userId: string) => Promise<boolean>;
  setFilter: (filter: TransactionFilter) => void;
  applyFilter: (db: SQLiteDatabase, userId: string) => Promise<void>;
  clearError: () => void;
}

function computeSummary(transactions: Transaction[]): TransactionSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTax = 0;
  let largest = 0;
  let smallest = Infinity;

  for (const txn of transactions) {
    if (txn.type === TransactionType.INCOME) {
      totalIncome += txn.amount;
    } else if (txn.type === TransactionType.EXPENSE) {
      totalExpense += txn.amount;
    }
    if (txn.taxAmount) totalTax += txn.taxAmount;
    if (txn.amount > largest) largest = txn.amount;
    if (txn.amount < smallest) smallest = txn.amount;
  }

  const count = transactions.length;
  return {
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    transactionCount: count,
    averageAmount: count > 0 ? (totalIncome + totalExpense) / count : 0,
    largestTransaction: largest,
    smallestTransaction: smallest === Infinity ? 0 : smallest,
    totalTax,
  };
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  filter: {},
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    transactionCount: 0,
    averageAmount: 0,
    largestTransaction: 0,
    smallestTransaction: 0,
    totalTax: 0,
  },

  loadTransactions: async (db, userId) => {
    set({ isLoading: true, error: null });
    try {
      const { isFamilyMode, activeFamilyId } = useSettingsStore.getState();
      const familyId = isFamilyMode ? activeFamilyId : null;
      const transactions = await txnRepo.getAllTransactions(db, userId, familyId);
      set({ transactions, summary: computeSummary(transactions), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTransaction: async (db, userId, request) => {
    try {
      const txn = await txnRepo.createTransaction(db, userId, request);
      const transactions = [txn, ...get().transactions];
      set({ transactions, summary: computeSummary(transactions) });
      
      const { isFamilyMode, activeFamilyId } = useSettingsStore.getState();
      const familyId = isFamilyMode ? activeFamilyId : null;
      pushToFirebase(db, userId, familyId).catch(err => console.error("Sync error:", err));
      return txn;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  editTransaction: async (db, id, userId, updates) => {
    try {
      const updated = await txnRepo.updateTransaction(db, id, userId, updates);
      if (updated) {
        const transactions = get().transactions.map((t) => (t.id === id ? updated : t));
        set({ transactions, summary: computeSummary(transactions) });
      }
      const { isFamilyMode, activeFamilyId } = useSettingsStore.getState();
      const familyId = isFamilyMode ? activeFamilyId : null;
      pushToFirebase(db, userId, familyId).catch(err => console.error("Sync error:", err));
      return updated;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  removeTransaction: async (db, id, userId) => {
    try {
      const success = await txnRepo.deleteTransaction(db, id, userId);
      if (success) {
        const transactions = get().transactions.filter((t) => t.id !== id);
        set({ transactions, summary: computeSummary(transactions) });
      }
      const { isFamilyMode, activeFamilyId } = useSettingsStore.getState();
      const familyId = isFamilyMode ? activeFamilyId : null;
      pushToFirebase(db, userId, familyId).catch(err => console.error("Sync error:", err));
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setFilter: (filter) => set({ filter }),

  applyFilter: async (db, userId) => {
    set({ isLoading: true });
    try {
      const transactions = await txnRepo.getFilteredTransactions(db, userId, get().filter);
      set({ transactions, summary: computeSummary(transactions), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
