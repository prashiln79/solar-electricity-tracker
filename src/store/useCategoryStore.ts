/**
 * Category store — manages category state and operations.
 */

import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category } from '@/types/models';
import * as categoryRepo from '@/database/repositories/categoryRepository';
import { TransactionType } from '@/types/enums';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Computed getters
  expenseCategories: Category[];
  incomeCategories: Category[];

  // Actions
  loadCategories: (db: SQLiteDatabase, userId: string) => Promise<void>;
  addCategory: (
    db: SQLiteDatabase,
    userId: string,
    data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'syncStatus' | 'lastSyncAt'>
  ) => Promise<Category>;
  editCategory: (
    db: SQLiteDatabase,
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'budget' | 'group' | 'groupIcon'>>
  ) => Promise<Category | null>;
  removeCategory: (db: SQLiteDatabase, id: string) => Promise<boolean>;
  seedDefaults: (db: SQLiteDatabase, userId: string) => Promise<void>;
  clearError: () => void;
}

function splitCategories(categories: Category[]) {
  return {
    expenseCategories: categories.filter((c) => c.type === TransactionType.EXPENSE),
    incomeCategories: categories.filter((c) => c.type === TransactionType.INCOME),
  };
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  expenseCategories: [],
  incomeCategories: [],

  loadCategories: async (db, userId) => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoryRepo.getAllCategories(db, userId);
      set({ categories, ...splitCategories(categories), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCategory: async (db, userId, data) => {
    try {
      const category = await categoryRepo.createCategory(db, userId, data);
      const categories = [...get().categories, category];
      set({ categories, ...splitCategories(categories) });
      return category;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  editCategory: async (db, id, updates) => {
    try {
      const updated = await categoryRepo.updateCategory(db, id, updates);
      if (updated) {
        const categories = get().categories.map((c) => (c.id === id ? updated : c));
        set({ categories, ...splitCategories(categories) });
      }
      return updated;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  removeCategory: async (db, id) => {
    try {
      const success = await categoryRepo.deleteCategory(db, id);
      if (success) {
        const categories = get().categories.filter((c) => c.id !== id);
        set({ categories, ...splitCategories(categories) });
      }
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  seedDefaults: async (db, userId) => {
    await categoryRepo.seedDefaultCategories(db, userId);
    // Reload after seeding
    const categories = await categoryRepo.getAllCategories(db, userId);
    set({ categories, ...splitCategories(categories) });
  },

  clearError: () => set({ error: null }),
}));
