/**
 * Category repository — CRUD operations on the categories table.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '../db';
import type { Category } from '@/types/models';
import { SyncStatus } from '@/types/enums';

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as Category['type'],
    icon: row.icon as string,
    color: row.color as string,
    parentCategoryId: (row.parent_category_id as string) || undefined,
    isSubCategory: !!(row.is_sub_category as number),
    subCategories: row.sub_categories ? JSON.parse(row.sub_categories as string) : undefined,
    group: (row.category_group as string) || undefined,
    groupIcon: (row.group_icon as string) || undefined,
    isSystem: !!(row.is_system as number),
    budget: row.budget ? JSON.parse(row.budget as string) : undefined,
    familyId: row.family_id as string,
    syncStatus: (row.sync_status as string) || SyncStatus.PENDING,
    lastSyncAt: (row.last_sync_at as number) || undefined,
    createdAt: row.created_at as number,
  };
}

export async function getAllCategories(
  db: SQLiteDatabase,
  userId: string,
  familyId?: string | null
): Promise<Category[]> {
  const rows = familyId
    ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM categories WHERE user_id = ? AND family_id = ? ORDER BY name ASC`,
        [userId, familyId]
      )
    : await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM categories WHERE user_id = ? AND (family_id = '' OR family_id IS NULL) ORDER BY name ASC`,
        [userId]
      );
  return rows.map(rowToCategory);
}

export async function getCategoriesByType(
  db: SQLiteDatabase,
  userId: string,
  type: string
): Promise<Category[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY name ASC`,
    [userId, type]
  );
  return rows.map(rowToCategory);
}

export async function getCategoryById(
  db: SQLiteDatabase,
  id: string
): Promise<Category | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM categories WHERE id = ?`,
    [id]
  );
  return row ? rowToCategory(row) : null;
}

export async function createCategory(
  db: SQLiteDatabase,
  userId: string,
  data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'syncStatus' | 'lastSyncAt'>
): Promise<Category> {
  const id = generateId();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO categories (
      id, user_id, name, type, icon, color, parent_category_id,
      is_sub_category, sub_categories, category_group, group_icon,
      is_system, budget, family_id, sync_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, userId, data.name, data.type, data.icon, data.color,
      data.parentCategoryId || null,
      data.isSubCategory ? 1 : 0,
      data.subCategories ? JSON.stringify(data.subCategories) : null,
      data.group || null, data.groupIcon || null,
      data.isSystem ? 1 : 0,
      data.budget ? JSON.stringify(data.budget) : null,
      data.familyId || '',
      SyncStatus.PENDING, now,
    ]
  );

  return (await getCategoryById(db, id))!;
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'budget' | 'group' | 'groupIcon'>>
): Promise<Category | null> {
  await db.runAsync(
    `UPDATE categories SET
      name = COALESCE(?, name),
      icon = COALESCE(?, icon),
      color = COALESCE(?, color),
      budget = COALESCE(?, budget),
      category_group = COALESCE(?, category_group),
      group_icon = COALESCE(?, group_icon),
      sync_status = ?
    WHERE id = ?`,
    [
      updates.name ?? null,
      updates.icon ?? null,
      updates.color ?? null,
      updates.budget ? JSON.stringify(updates.budget) : null,
      updates.group ?? null,
      updates.groupIcon ?? null,
      SyncStatus.PENDING,
      id,
    ]
  );

  return getCategoryById(db, id);
}

export async function deleteCategory(
  db: SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync(
    `DELETE FROM categories WHERE id = ? AND is_system = 0`,
    [id]
  );
  return result.changes > 0;
}

/** Seed default categories for a new user. */
export async function seedDefaultCategories(
  db: SQLiteDatabase,
  userId: string
): Promise<void> {
  const defaultExpenseCategories = [
    { name: 'Food & Dining', icon: '🍔', color: '#ef4444', group: 'Essentials', groupIcon: '🏠' },
    { name: 'Groceries', icon: '🛒', color: '#f97316', group: 'Essentials', groupIcon: '🏠' },
    { name: 'Transportation', icon: '🚗', color: '#3b82f6', group: 'Essentials', groupIcon: '🏠' },
    { name: 'Utilities', icon: '💡', color: '#eab308', group: 'Essentials', groupIcon: '🏠' },
    { name: 'Rent', icon: '🏠', color: '#8b5cf6', group: 'Essentials', groupIcon: '🏠' },
    { name: 'Healthcare', icon: '🏥', color: '#ec4899', group: 'Personal', groupIcon: '👤' },
    { name: 'Entertainment', icon: '🎬', color: '#14b8a6', group: 'Lifestyle', groupIcon: '✨' },
    { name: 'Shopping', icon: '🛍️', color: '#f43f5e', group: 'Lifestyle', groupIcon: '✨' },
    { name: 'Education', icon: '📚', color: '#6366f1', group: 'Personal', groupIcon: '👤' },
    { name: 'Insurance', icon: '🛡️', color: '#0ea5e9', group: 'Financial', groupIcon: '💰' },
    { name: 'Subscriptions', icon: '📱', color: '#a855f7', group: 'Lifestyle', groupIcon: '✨' },
    { name: 'Travel', icon: '✈️', color: '#06b6d4', group: 'Lifestyle', groupIcon: '✨' },
    { name: 'Personal Care', icon: '💇', color: '#d946ef', group: 'Personal', groupIcon: '👤' },
    { name: 'Gifts', icon: '🎁', color: '#f472b6', group: 'Personal', groupIcon: '👤' },
    { name: 'Other', icon: '📦', color: '#78716c', group: 'Other', groupIcon: '📦' },
  ];

  const defaultIncomeCategories = [
    { name: 'Salary', icon: '💼', color: '#22c55e', group: 'Primary', groupIcon: '💰' },
    { name: 'Freelance', icon: '💻', color: '#10b981', group: 'Primary', groupIcon: '💰' },
    { name: 'Investment', icon: '📈', color: '#059669', group: 'Passive', groupIcon: '📊' },
    { name: 'Business', icon: '🏢', color: '#16a34a', group: 'Primary', groupIcon: '💰' },
    { name: 'Rental Income', icon: '🏘️', color: '#4ade80', group: 'Passive', groupIcon: '📊' },
    { name: 'Dividends', icon: '💹', color: '#34d399', group: 'Passive', groupIcon: '📊' },
    { name: 'Other Income', icon: '💰', color: '#86efac', group: 'Other', groupIcon: '📦' },
  ];

  const now = Date.now();

  for (const cat of defaultExpenseCategories) {
    const id = generateId();
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (
        id, user_id, name, type, icon, color, is_system,
        category_group, group_icon, family_id, sync_status, created_at
      ) VALUES (?, ?, ?, 'expense', ?, ?, 1, ?, ?, '', ?, ?)`,
      [id, userId, cat.name, cat.icon, cat.color, cat.group, cat.groupIcon, SyncStatus.PENDING, now]
    );
  }

  for (const cat of defaultIncomeCategories) {
    const id = generateId();
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (
        id, user_id, name, type, icon, color, is_system,
        category_group, group_icon, family_id, sync_status, created_at
      ) VALUES (?, ?, ?, 'income', ?, ?, 1, ?, ?, '', ?, ?)`,
      [id, userId, cat.name, cat.icon, cat.color, cat.group, cat.groupIcon, SyncStatus.PENDING, now]
    );
  }
}
