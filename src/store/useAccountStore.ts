/**
 * Account store — manages account state and operations.
 */

import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Account, CreateAccountRequest, UpdateAccountRequest } from '@/types/models';
import * as accountRepo from '@/database/repositories/accountRepository';
import { pushToFirebase } from '@/services/syncService';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface AccountState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  totalBalance: number;

  // Actions
  loadAccounts: (db: SQLiteDatabase, userId: string) => Promise<void>;
  addAccount: (db: SQLiteDatabase, userId: string, request: CreateAccountRequest) => Promise<Account>;
  editAccount: (db: SQLiteDatabase, accountId: string, updates: UpdateAccountRequest) => Promise<Account | null>;
  removeAccount: (db: SQLiteDatabase, accountId: string) => Promise<boolean>;
  refreshBalance: (db: SQLiteDatabase, userId: string) => Promise<void>;
  clearError: () => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,
  totalBalance: 0,

  loadAccounts: async (db, userId) => {
    set({ isLoading: true, error: null });
    try {
      const { isFamilyMode, activeFamilyId } = useSettingsStore.getState();
      const familyId = isFamilyMode ? activeFamilyId : null;
      const accounts = await accountRepo.getAllAccounts(db, userId, familyId);
      const totalBalance = await accountRepo.getTotalBalance(db, userId, familyId);
      set({ accounts, totalBalance, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addAccount: async (db, userId, request) => {
    try {
      const account = await accountRepo.createAccount(db, userId, request);
      const accounts = [...get().accounts, account];
      const totalBalance = await accountRepo.getTotalBalance(db, userId);
      set({ accounts, totalBalance });
      const { isFamilyMode, activeFamilyId } = useSettingsStore.getState();
      const familyId = isFamilyMode ? activeFamilyId : null;
      pushToFirebase(db, userId, familyId).catch(err => console.error("Sync error:", err));
      return account;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  editAccount: async (db, accountId, updates) => {
    try {
      const updated = await accountRepo.updateAccount(db, accountId, updates);
      if (updated) {
        const accounts = get().accounts.map((a) => (a.accountId === accountId ? updated : a));
        const total = accounts.reduce((sum, a) => (a.isActive ? sum + a.balance : sum), 0);
        set({ accounts, totalBalance: total });
      }
      // Note: we fetch the userId of the active user to sync
      const activeUser = useAuthStore.getState().user;
      if (activeUser?.uid) {
        const { isFamilyMode, activeFamilyId } = useSettingsStore.getState();
        const familyId = isFamilyMode ? activeFamilyId : null;
        pushToFirebase(db, activeUser.uid, familyId).catch(err => console.error("Sync error:", err));
      }
      return updated;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  removeAccount: async (db, accountId) => {
    try {
      const success = await accountRepo.deleteAccount(db, accountId);
      if (success) {
        const accounts = get().accounts.filter((a) => a.accountId !== accountId);
        const total = accounts.reduce((sum, a) => (a.isActive ? sum + a.balance : sum), 0);
        set({ accounts, totalBalance: total });
      }
      const activeUser = useAuthStore.getState().user;
      if (activeUser?.uid) {
        const { isFamilyMode, activeFamilyId } = useSettingsStore.getState();
        const familyId = isFamilyMode ? activeFamilyId : null;
        pushToFirebase(db, activeUser.uid, familyId).catch(err => console.error("Sync error:", err));
      }
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  refreshBalance: async (db, userId) => {
    const totalBalance = await accountRepo.getTotalBalance(db, userId);
    set({ totalBalance });
  },

  clearError: () => set({ error: null }),
}));
