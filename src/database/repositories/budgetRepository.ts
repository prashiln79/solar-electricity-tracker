/**
 * Budget repository — CRUD operations on the budgets table.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '../db';
import type { Budget, CreateBudgetRequest } from '@/types/models';
import { SyncStatus } from '@/types/enums';

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) || undefined,
    amount: row.amount as number,
    period: row.period as Budget['period'],
    categoryIds: row.category_ids ? JSON.parse(row.category_ids as string) : [],
    startDate: row.start_date as number,
    endDate: (row.end_date as number) || undefined,
    isActive: !!(row.is_active as number),
    spentAmount: row.spent_amount as number,
    remainingAmount: row.remaining_amount as number,
    progressPercentage: row.progress_percentage as number,
    alertThreshold: row.alert_threshold as number,
    isAlertEnabled: !!(row.is_alert_enabled as number),
    syncStatus: row.sync_status as SyncStatus,
    lastSyncedAt: (row.last_synced_at as number) || undefined,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    createdBy: row.created_by as string,
    updatedBy: row.updated_by as string,
  };
}

export async function getAllBudgets(
  db: SQLiteDatabase,
  userId: string
): Promise<Budget[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(rowToBudget);
}

export async function getActiveBudgets(
  db: SQLiteDatabase,
  userId: string
): Promise<Budget[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM budgets WHERE user_id = ? AND is_active = 1 ORDER BY name ASC`,
    [userId]
  );
  return rows.map(rowToBudget);
}

export async function getBudgetById(
  db: SQLiteDatabase,
  id: string
): Promise<Budget | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM budgets WHERE id = ?`,
    [id]
  );
  return row ? rowToBudget(row) : null;
}

export async function createBudget(
  db: SQLiteDatabase,
  userId: string,
  request: CreateBudgetRequest
): Promise<Budget> {
  const id = generateId();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO budgets (
      id, user_id, name, description, amount, period, category_ids,
      start_date, end_date, is_active, spent_amount, remaining_amount,
      progress_percentage, alert_threshold, is_alert_enabled,
      sync_status, created_at, updated_at, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, userId, request.name, request.description || null,
      request.amount, request.period, JSON.stringify(request.categoryIds),
      request.startDate, request.endDate || null,
      request.amount,
      request.alertThreshold ?? 80,
      request.isAlertEnabled !== false ? 1 : 0,
      SyncStatus.PENDING, now, now, userId, userId,
    ]
  );

  return (await getBudgetById(db, id))!;
}

export async function updateBudgetProgress(
  db: SQLiteDatabase,
  id: string,
  spentAmount: number
): Promise<void> {
  const budget = await getBudgetById(db, id);
  if (!budget) return;

  const remaining = Math.max(0, budget.amount - spentAmount);
  const progress = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

  await db.runAsync(
    `UPDATE budgets SET
      spent_amount = ?, remaining_amount = ?, progress_percentage = ?,
      sync_status = ?, updated_at = ?
    WHERE id = ?`,
    [spentAmount, remaining, Math.min(progress, 100), SyncStatus.PENDING, Date.now(), id]
  );
}

export async function deleteBudget(
  db: SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE budgets SET is_active = 0, sync_status = ?, updated_at = ? WHERE id = ?`,
    [SyncStatus.PENDING, Date.now(), id]
  );
  return result.changes > 0;
}
