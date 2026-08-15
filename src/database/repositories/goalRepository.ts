/**
 * Goal repository — CRUD operations on the goals table.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '../db';
import type { Goal, CreateGoalRequest, GoalMilestone } from '@/types/models';
import { GoalStatus, SyncStatus } from '@/types/enums';

function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) || undefined,
    type: row.type as Goal['type'],
    targetAmount: row.target_amount as number,
    currentAmount: row.current_amount as number,
    status: row.status as GoalStatus,
    startDate: row.start_date as number,
    targetDate: (row.target_date as number) || undefined,
    completedDate: (row.completed_date as number) || undefined,
    progressPercentage: row.progress_percentage as number,
    remainingAmount: row.remaining_amount as number,
    daysRemaining: (row.days_remaining as number) || undefined,
    isOnTrack: !!(row.is_on_track as number),
    monthlyContribution: (row.monthly_contribution as number) || undefined,
    contributionFrequency: (row.contribution_frequency as Goal['contributionFrequency']) || 'monthly',
    autoContribution: !!(row.auto_contribution as number),
    contributionAccountId: (row.contribution_account_id as string) || undefined,
    milestones: row.milestones ? JSON.parse(row.milestones as string) : [],
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

export async function getAllGoals(
  db: SQLiteDatabase,
  userId: string
): Promise<Goal[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(rowToGoal);
}

export async function getActiveGoals(
  db: SQLiteDatabase,
  userId: string
): Promise<Goal[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM goals WHERE user_id = ? AND status = ? ORDER BY target_date ASC`,
    [userId, GoalStatus.ACTIVE]
  );
  return rows.map(rowToGoal);
}

export async function getGoalById(
  db: SQLiteDatabase,
  id: string
): Promise<Goal | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM goals WHERE id = ?`,
    [id]
  );
  return row ? rowToGoal(row) : null;
}

export async function createGoal(
  db: SQLiteDatabase,
  userId: string,
  request: CreateGoalRequest
): Promise<Goal> {
  const id = generateId();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO goals (
      id, user_id, name, description, type, target_amount, current_amount,
      status, start_date, target_date, progress_percentage, remaining_amount,
      is_on_track, monthly_contribution, contribution_frequency,
      auto_contribution, contribution_account_id, milestones,
      alert_threshold, is_alert_enabled, sync_status,
      created_at, updated_at, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, 1, ?, ?, ?, ?, '[]', ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, userId, request.name, request.description || null,
      request.type, request.targetAmount,
      GoalStatus.ACTIVE, request.startDate, request.targetDate || null,
      request.targetAmount,
      request.monthlyContribution || null,
      request.contributionFrequency || 'monthly',
      request.autoContribution ? 1 : 0,
      request.contributionAccountId || null,
      request.alertThreshold ?? 80,
      request.isAlertEnabled !== false ? 1 : 0,
      SyncStatus.PENDING, now, now, userId, userId,
    ]
  );

  return (await getGoalById(db, id))!;
}

export async function updateGoalProgress(
  db: SQLiteDatabase,
  id: string,
  currentAmount: number
): Promise<void> {
  const goal = await getGoalById(db, id);
  if (!goal) return;

  const remaining = Math.max(0, goal.targetAmount - currentAmount);
  const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
  const now = Date.now();

  let daysRemaining: number | null = null;
  if (goal.targetDate) {
    daysRemaining = Math.max(0, Math.ceil((goal.targetDate - now) / (1000 * 60 * 60 * 24)));
  }

  // Determine if on track
  let isOnTrack = true;
  if (goal.targetDate && daysRemaining !== null) {
    const totalDays = Math.ceil((goal.targetDate - goal.startDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = totalDays - daysRemaining;
    const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
    isOnTrack = progress >= expectedProgress * 0.8; // Allow 20% buffer
  }

  const newStatus = progress >= 100 ? GoalStatus.COMPLETED : goal.status;

  await db.runAsync(
    `UPDATE goals SET
      current_amount = ?, remaining_amount = ?, progress_percentage = ?,
      days_remaining = ?, is_on_track = ?, status = ?,
      completed_date = ?, sync_status = ?, updated_at = ?
    WHERE id = ?`,
    [
      currentAmount, remaining, Math.min(progress, 100),
      daysRemaining, isOnTrack ? 1 : 0, newStatus,
      newStatus === GoalStatus.COMPLETED ? now : null,
      SyncStatus.PENDING, now, id,
    ]
  );
}

export async function deleteGoal(
  db: SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE goals SET status = ?, sync_status = ?, updated_at = ? WHERE id = ?`,
    [GoalStatus.CANCELLED, SyncStatus.PENDING, Date.now(), id]
  );
  return result.changes > 0;
}
