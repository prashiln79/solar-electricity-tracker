/**
 * Transaction repository — CRUD operations on the transactions table.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '../db';
import type { Transaction, CreateTransactionRequest, TransactionFilter } from '@/types/models';
import { SyncStatus, TransactionStatus } from '@/types/enums';

/** Map a DB row to a Transaction object. */
function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    accountId: (row.account_id as string) || undefined,
    categoryId: row.category_id as string,
    category: row.category as string,
    payee: (row.payee as string) || undefined,
    amount: row.amount as number,
    type: row.type as Transaction['type'],
    date: row.date as number,
    notes: (row.notes as string) || undefined,
    status: row.status as TransactionStatus,
    tags: row.tags ? JSON.parse(row.tags as string) : undefined,
    isSplitTransaction: !!(row.is_split_transaction as number),
    splitGroupId: (row.split_group_id as string) || undefined,
    fromAccountId: (row.from_account_id as string) || undefined,
    toAccountId: (row.to_account_id as string) || undefined,
    isRecurring: !!(row.is_recurring as number),
    recurringInterval: (row.recurring_interval as Transaction['recurringInterval']) || null,
    recurringEndDate: (row.recurring_end_date as number) || null,
    nextOccurrence: (row.next_occurrence as number) || null,
    familyId: row.family_id as string,
    userDisplayName: (row.user_display_name as string) || undefined,
    userPhotoURL: (row.user_photo_url as string) || undefined,
    splitData: row.split_data ? JSON.parse(row.split_data as string) : undefined,
    isCategorySplit: !!(row.is_category_split as number),
    categorySplits: row.category_splits ? JSON.parse(row.category_splits as string) : undefined,
    totalSplitAmount: (row.total_split_amount as number) || undefined,
    taxAmount: (row.tax_amount as number) || undefined,
    taxPercentage: (row.tax_percentage as number) || undefined,
    taxes: row.taxes ? JSON.parse(row.taxes as string) : undefined,
    syncStatus: row.sync_status as SyncStatus,
    isPending: !!(row.is_pending as number),
    lastSyncedAt: (row.last_synced_at as number) || undefined,
    settlementId: (row.settlement_id as string) || undefined,
    settlementFamilyId: (row.settlement_family_id as string) || undefined,
    settlementFromUserId: (row.settlement_from_user_id as string) || undefined,
    settlementToUserId: (row.settlement_to_user_id as string) || undefined,
    flagged: !!(row.flagged as number),
    flagMessage: (row.flag_message as string) || undefined,
    flaggedBy: (row.flagged_by as string) || null,
    flaggedAt: (row.flagged_at as number) || null,
    placeName: (row.place_name as string) || undefined,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    createdBy: row.created_by as string,
    updatedBy: row.updated_by as string,
  };
}

/** Get all transactions for a user, ordered by date descending. */
export async function getAllTransactions(
  db: SQLiteDatabase,
  userId: string
): Promise<Transaction[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM transactions WHERE user_id = ? AND status != ? ORDER BY date DESC`,
    [userId, TransactionStatus.DELETED]
  );
  return rows.map(rowToTransaction);
}

/** Get a single transaction by ID. */
export async function getTransactionById(
  db: SQLiteDatabase,
  id: string
): Promise<Transaction | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM transactions WHERE id = ?`,
    [id]
  );
  return row ? rowToTransaction(row) : null;
}

/** Get transactions with optional filters. */
export async function getFilteredTransactions(
  db: SQLiteDatabase,
  userId: string,
  filter: TransactionFilter
): Promise<Transaction[]> {
  let query = `SELECT * FROM transactions WHERE user_id = ? AND status != ?`;
  const params: unknown[] = [userId, TransactionStatus.DELETED];

  if (filter.types && filter.types.length > 0) {
    const placeholders = filter.types.map(() => '?').join(',');
    query += ` AND type IN (${placeholders})`;
    params.push(...filter.types);
  }
  if (filter.categoryIds && filter.categoryIds.length > 0) {
    const placeholders = filter.categoryIds.map(() => '?').join(',');
    query += ` AND category_id IN (${placeholders})`;
    params.push(...filter.categoryIds);
  }
  if (filter.accountIds && filter.accountIds.length > 0) {
    const placeholders = filter.accountIds.map(() => '?').join(',');
    query += ` AND account_id IN (${placeholders})`;
    params.push(...filter.accountIds);
  }
  if (filter.dateFrom) {
    query += ` AND date >= ?`;
    params.push(filter.dateFrom);
  }
  if (filter.dateTo) {
    query += ` AND date <= ?`;
    params.push(filter.dateTo);
  }
  if (filter.amountMin !== undefined) {
    query += ` AND amount >= ?`;
    params.push(filter.amountMin);
  }
  if (filter.amountMax !== undefined) {
    query += ` AND amount <= ?`;
    params.push(filter.amountMax);
  }
  if (filter.payee) {
    query += ` AND payee LIKE ?`;
    params.push(`%${filter.payee}%`);
  }

  query += ` ORDER BY date DESC`;

  const rows = await db.getAllAsync<Record<string, unknown>>(query, params);
  return rows.map(rowToTransaction);
}

/** Create a new transaction. Returns the created transaction. */
export async function createTransaction(
  db: SQLiteDatabase,
  userId: string,
  request: CreateTransactionRequest
): Promise<Transaction> {
  const id = generateId();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO transactions (
      id, user_id, account_id, category_id, category, payee, amount, type, date,
      notes, status, tags, is_recurring, recurring_interval, recurring_end_date,
      family_id, user_display_name, user_photo_url, split_data,
      tax_amount, tax_percentage, taxes,
      settlement_id, settlement_family_id, settlement_from_user_id, settlement_to_user_id,
      place_name, sync_status, created_at, updated_at, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      request.accountId || null,
      request.categoryId,
      request.category || '',
      request.payee || null,
      request.amount,
      request.type,
      request.date,
      request.notes || null,
      TransactionStatus.COMPLETED,
      request.tags ? JSON.stringify(request.tags) : null,
      request.isRecurring ? 1 : 0,
      request.recurringInterval || null,
      request.recurringEndDate || null,
      request.familyId || '',
      request.userDisplayName || null,
      request.userPhotoURL || null,
      request.splitData ? JSON.stringify(request.splitData) : null,
      request.taxAmount || null,
      request.taxPercentage || null,
      request.taxes ? JSON.stringify(request.taxes) : null,
      request.settlementId || null,
      request.settlementFamilyId || null,
      request.settlementFromUserId || null,
      request.settlementToUserId || null,
      request.placeName || null,
      SyncStatus.PENDING,
      now,
      now,
      userId,
      userId,
    ]
  );

  const created = await getTransactionById(db, id);
  return created!;
}

/** Update an existing transaction. */
export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  userId: string,
  updates: Partial<CreateTransactionRequest>
): Promise<Transaction | null> {
  const existing = await getTransactionById(db, id);
  if (!existing) return null;

  const now = Date.now();

  await db.runAsync(
    `UPDATE transactions SET
      account_id = COALESCE(?, account_id),
      category_id = COALESCE(?, category_id),
      category = COALESCE(?, category),
      payee = COALESCE(?, payee),
      amount = COALESCE(?, amount),
      type = COALESCE(?, type),
      date = COALESCE(?, date),
      notes = COALESCE(?, notes),
      tags = COALESCE(?, tags),
      family_id = COALESCE(?, family_id),
      tax_amount = COALESCE(?, tax_amount),
      tax_percentage = COALESCE(?, tax_percentage),
      place_name = COALESCE(?, place_name),
      sync_status = ?,
      updated_at = ?,
      updated_by = ?
    WHERE id = ?`,
    [
      updates.accountId ?? null,
      updates.categoryId ?? null,
      updates.category ?? null,
      updates.payee ?? null,
      updates.amount ?? null,
      updates.type ?? null,
      updates.date ?? null,
      updates.notes ?? null,
      updates.tags ? JSON.stringify(updates.tags) : null,
      updates.familyId ?? null,
      updates.taxAmount ?? null,
      updates.taxPercentage ?? null,
      updates.placeName ?? null,
      SyncStatus.PENDING,
      now,
      userId,
      id,
    ]
  );

  return getTransactionById(db, id);
}

/** Soft-delete a transaction (set status to DELETED). */
export async function deleteTransaction(
  db: SQLiteDatabase,
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE transactions SET status = ?, sync_status = ?, updated_at = ?, updated_by = ? WHERE id = ?`,
    [TransactionStatus.DELETED, SyncStatus.PENDING, Date.now(), userId, id]
  );
  return result.changes > 0;
}

/** Get transaction count for a user. */
export async function getTransactionCount(
  db: SQLiteDatabase,
  userId: string
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status != ?`,
    [userId, TransactionStatus.DELETED]
  );
  return result?.count ?? 0;
}
