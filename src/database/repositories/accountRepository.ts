/**
 * Account repository — CRUD operations on the accounts table.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '../db';
import type { Account, CreateAccountRequest, UpdateAccountRequest } from '@/types/models';
import { SyncStatus } from '@/types/enums';

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    accountId: row.account_id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as Account['type'],
    balance: row.balance as number,
    description: (row.description as string) || undefined,
    accountNumber: (row.account_number as string) || undefined,
    institution: (row.institution as string) || undefined,
    currency: (row.currency as string) || 'INR',
    isActive: row.is_active === 1,
    icon: (row.icon as string) || undefined,
    color: (row.color as string) || undefined,
    familyId: row.family_id as string,
    loanDetails: row.loan_details ? JSON.parse(row.loan_details as string) : undefined,
    syncStatus: row.sync_status as SyncStatus,
    lastSyncAt: (row.last_sync_at as number) || undefined,
    createdAt: row.created_at as number,
    updatedAt: (row.updated_at as number) || undefined,
  };
}

export async function getAllAccounts(
  db: SQLiteDatabase,
  userId: string,
  familyId?: string | null
): Promise<Account[]> {
  const rows = familyId
    ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM accounts WHERE user_id = ? AND family_id = ? AND is_active = 1 ORDER BY name ASC`,
        [userId, familyId]
      )
    : await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM accounts WHERE user_id = ? AND (family_id = '' OR family_id IS NULL) AND is_active = 1 ORDER BY name ASC`,
        [userId]
      );
  return rows.map(rowToAccount);
}

export async function getAccountById(
  db: SQLiteDatabase,
  accountId: string
): Promise<Account | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM accounts WHERE account_id = ?`,
    [accountId]
  );
  return row ? rowToAccount(row) : null;
}

export async function createAccount(
  db: SQLiteDatabase,
  userId: string,
  request: CreateAccountRequest
): Promise<Account> {
  const accountId = generateId();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO accounts (
      account_id, user_id, name, type, balance, description,
      account_number, institution, currency, is_active, family_id,
      sync_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '', ?, ?, ?)`,
    [
      accountId, userId, request.name, request.type, request.balance,
      request.description || null, request.accountNumber || null,
      request.institution || null, request.currency || 'INR',
      SyncStatus.PENDING, now, now,
    ]
  );

  return (await getAccountById(db, accountId))!;
}

export async function updateAccount(
  db: SQLiteDatabase,
  accountId: string,
  updates: UpdateAccountRequest
): Promise<Account | null> {
  const now = Date.now();

  await db.runAsync(
    `UPDATE accounts SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      balance = COALESCE(?, balance),
      description = COALESCE(?, description),
      account_number = COALESCE(?, account_number),
      institution = COALESCE(?, institution),
      currency = COALESCE(?, currency),
      is_active = COALESCE(?, is_active),
      sync_status = ?,
      updated_at = ?
    WHERE account_id = ?`,
    [
      updates.name ?? null, updates.type ?? null, updates.balance ?? null,
      updates.description ?? null, updates.accountNumber ?? null,
      updates.institution ?? null, updates.currency ?? null,
      updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
      SyncStatus.PENDING, now, accountId,
    ]
  );

  return getAccountById(db, accountId);
}

export async function deleteAccount(
  db: SQLiteDatabase,
  accountId: string
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE accounts SET is_active = 0, sync_status = ?, updated_at = ? WHERE account_id = ?`,
    [SyncStatus.PENDING, Date.now(), accountId]
  );
  return result.changes > 0;
}

/** Update account balance (used after transaction CRUD). */
export async function updateAccountBalance(
  db: SQLiteDatabase,
  accountId: string,
  newBalance: number
): Promise<void> {
  await db.runAsync(
    `UPDATE accounts SET balance = ?, sync_status = ?, updated_at = ? WHERE account_id = ?`,
    [newBalance, SyncStatus.PENDING, Date.now(), accountId]
  );
}

export async function getTotalBalance(
  db: SQLiteDatabase,
  userId: string,
  familyId?: string | null
): Promise<number> {
  const result = familyId
    ? await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE user_id = ? AND family_id = ? AND is_active = 1`,
        [userId, familyId]
      )
    : await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE user_id = ? AND (family_id = '' OR family_id IS NULL) AND is_active = 1`,
        [userId]
      );
  return result?.total ?? 0;
}
