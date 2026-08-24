import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db as firestore } from '@/config/firebase';
import type { SQLiteDatabase } from 'expo-sqlite';
import { SyncStatus, TransactionStatus } from '@/types/enums';
import type { Account, Category, Transaction } from '@/types/models';

export async function pullFromFirebase(
  db: SQLiteDatabase,
  userId: string,
  familyId?: string | null
): Promise<void> {
  const isFamily = !!familyId;
  const basePath = isFamily ? `family-groups/${familyId}` : `users/${userId}`;
  console.log(`Sync: Pulling data from Firestore path: ${basePath} for user: ${userId}`);

  // 1. Pull Accounts
  const accountsSnapshot = await getDocs(collection(firestore, `${basePath}/accounts`));
  for (const docSnap of accountsSnapshot.docs) {
    const acc = docSnap.data() as Account;
    await db.runAsync(
      `INSERT OR REPLACE INTO accounts (
        account_id, user_id, name, type, balance, description,
        account_number, institution, currency, is_active, icon, color,
        family_id, loan_details, sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        acc.accountId,
        userId,
        acc.name || 'Unnamed Account',
        acc.type || 'bank',
        acc.balance || 0,
        acc.description || null,
        acc.accountNumber || null,
        acc.institution || null,
        acc.currency || 'INR',
        acc.isActive ? 1 : 0,
        acc.icon || null,
        acc.color || null,
        familyId || '',
        acc.loanDetails ? JSON.stringify(acc.loanDetails) : null,
        SyncStatus.SYNCED,
        acc.createdAt || Date.now(),
        acc.updatedAt || Date.now(),
      ]
    );
  }

  // 2. Pull Categories
  const categoriesSnapshot = await getDocs(collection(firestore, `${basePath}/categories`));
  for (const docSnap of categoriesSnapshot.docs) {
    const cat = docSnap.data() as Category;
    await db.runAsync(
      `INSERT OR REPLACE INTO categories (
        id, user_id, name, type, icon, color, parent_category_id,
        is_sub_category, sub_categories, category_group, group_icon,
        is_system, budget, family_id, sync_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cat.id || docSnap.id,
        userId,
        cat.name || 'Unnamed Category',
        cat.type,
        cat.icon || '📦',
        cat.color || '#6366f1',
        cat.parentCategoryId || null,
        cat.isSubCategory ? 1 : 0,
        cat.subCategories ? JSON.stringify(cat.subCategories) : null,
        cat.group || null,
        cat.groupIcon || null,
        cat.isSystem ? 1 : 0,
        cat.budget ? JSON.stringify(cat.budget) : null,
        familyId || '',
        SyncStatus.SYNCED,
        cat.createdAt || Date.now(),
      ]
    );
  }

  // 3. Pull Transactions
  const txnsSnapshot = await getDocs(collection(firestore, `${basePath}/transactions`));
  for (const docSnap of txnsSnapshot.docs) {
    const txn = docSnap.data() as Transaction;
    await db.runAsync(
      `INSERT OR REPLACE INTO transactions (
        id, user_id, account_id, category_id, category, payee, amount, type, date,
        notes, status, tags, is_recurring, recurring_interval, recurring_end_date,
        from_account_id, to_account_id, family_id, user_display_name, user_photo_url,
        split_data, tax_amount, tax_percentage, taxes, settlement_id,
        settlement_family_id, settlement_from_user_id, settlement_to_user_id,
        place_name, sync_status, created_at, updated_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txn.id || docSnap.id,
        userId,
        txn.accountId || null,
        txn.categoryId || 'uncategorized',
        txn.category || '',
        txn.payee || null,
        txn.amount || 0,
        txn.type,
        txn.date,
        txn.notes || null,
        txn.status || TransactionStatus.COMPLETED,
        txn.tags ? JSON.stringify(txn.tags) : null,
        txn.isRecurring ? 1 : 0,
        txn.recurringInterval || null,
        txn.recurringEndDate || null,
        txn.fromAccountId || null,
        txn.toAccountId || null,
        familyId || '',
        txn.userDisplayName || null,
        txn.userPhotoURL || null,
        txn.splitData ? JSON.stringify(txn.splitData) : null,
        txn.taxAmount || null,
        txn.taxPercentage || null,
        txn.taxes ? JSON.stringify(txn.taxes) : null,
        txn.settlementId || null,
        txn.settlementFamilyId || null,
        txn.settlementFromUserId || null,
        txn.settlementToUserId || null,
        txn.placeName || null,
        SyncStatus.SYNCED,
        txn.createdAt || Date.now(),
        txn.updatedAt || Date.now(),
        txn.createdBy || userId,
        txn.updatedBy || userId,
      ]
    );
  }

  console.log('Sync: Pull completed successfully.');
}

function cleanObject<T extends object>(obj: T): T {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

export async function pushToFirebase(
  db: SQLiteDatabase,
  userId: string,
  familyId?: string | null
): Promise<void> {
  const isFamily = !!familyId;
  const basePath = isFamily ? `family-groups/${familyId}` : `users/${userId}`;
  console.log(`Sync: Pushing local changes to Firestore path: ${basePath} for user: ${userId}`);

  // 1. Push Accounts
  const pendingAccounts = isFamily
    ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM accounts WHERE family_id = ? AND sync_status = ?`,
        [familyId, SyncStatus.PENDING]
      )
    : await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM accounts WHERE (family_id = '' OR family_id IS NULL) AND sync_status = ?`,
        [SyncStatus.PENDING]
      );

  for (const row of pendingAccounts) {
    const accId = row.account_id as string;
    const data: Account = {
      accountId: accId,
      userId: isFamily ? familyId : userId,
      name: row.name as string,
      type: row.type as any,
      balance: row.balance as number,
      description: (row.description as string) || undefined,
      accountNumber: (row.account_number as string) || undefined,
      institution: (row.institution as string) || undefined,
      currency: (row.currency as string) || undefined,
      isActive: !!(row.is_active as number),
      icon: (row.icon as string) || undefined,
      color: (row.color as string) || undefined,
      familyId: isFamily ? familyId : '',
      loanDetails: row.loan_details ? JSON.parse(row.loan_details as string) : undefined,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
    await setDoc(doc(firestore, `${basePath}/accounts`, accId), cleanObject(data));
    await db.runAsync(`UPDATE accounts SET sync_status = ? WHERE account_id = ?`, [SyncStatus.SYNCED, accId]);
  }

  // 2. Push Categories
  const pendingCategories = isFamily
    ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM categories WHERE family_id = ? AND sync_status = ?`,
        [familyId, SyncStatus.PENDING]
      )
    : await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM categories WHERE (family_id = '' OR family_id IS NULL) AND sync_status = ?`,
        [SyncStatus.PENDING]
      );

  for (const row of pendingCategories) {
    const catId = row.id as string;
    const data: Category = {
      id: catId,
      userId: userId,
      name: row.name as string,
      type: row.type as any,
      icon: row.icon as string,
      color: row.color as string,
      parentCategoryId: (row.parent_category_id as string) || undefined,
      isSubCategory: !!(row.is_sub_category as number),
      subCategories: row.sub_categories ? JSON.parse(row.sub_categories as string) : undefined,
      group: (row.category_group as string) || undefined,
      groupIcon: (row.group_icon as string) || undefined,
      isSystem: !!(row.is_system as number),
      budget: row.budget ? JSON.parse(row.budget as string) : undefined,
      familyId: isFamily ? familyId : '',
      createdAt: row.created_at as number,
    };
    await setDoc(doc(firestore, `${basePath}/categories`, catId), cleanObject(data));
    await db.runAsync(`UPDATE categories SET sync_status = ? WHERE id = ?`, [SyncStatus.SYNCED, catId]);
  }

  // 3. Push Transactions
  const pendingTxns = isFamily
    ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM transactions WHERE family_id = ? AND sync_status = ?`,
        [familyId, SyncStatus.PENDING]
      )
    : await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM transactions WHERE (family_id = '' OR family_id IS NULL) AND sync_status = ?`,
        [SyncStatus.PENDING]
      );

  for (const row of pendingTxns) {
    const txnId = row.id as string;
    const data: Transaction = {
      id: txnId,
      userId: userId,
      accountId: (row.account_id as string) || undefined,
      categoryId: row.category_id as string,
      category: row.category as string,
      payee: (row.payee as string) || undefined,
      amount: row.amount as number,
      type: row.type as any,
      date: row.date as number,
      notes: (row.notes as string) || undefined,
      status: row.status as any,
      tags: row.tags ? JSON.parse(row.tags as string) : undefined,
      isRecurring: !!(row.is_recurring as number),
      recurringInterval: (row.recurring_interval as any) || null,
      recurringEndDate: (row.recurring_end_date as number) || null,
      fromAccountId: (row.from_account_id as string) || undefined,
      toAccountId: (row.to_account_id as string) || undefined,
      familyId: isFamily ? familyId : '',
      userDisplayName: (row.user_display_name as string) || undefined,
      userPhotoURL: (row.user_photo_url as string) || undefined,
      splitData: row.split_data ? JSON.parse(row.split_data as string) : undefined,
      taxAmount: (row.tax_amount as number) || undefined,
      taxPercentage: (row.tax_percentage as number) || undefined,
      taxes: row.taxes ? JSON.parse(row.taxes as string) : undefined,
      settlementId: (row.settlement_id as string) || undefined,
      settlementFamilyId: (row.settlement_family_id as string) || undefined,
      settlementFromUserId: (row.settlement_from_user_id as string) || undefined,
      settlementToUserId: (row.settlement_to_user_id as string) || undefined,
      placeName: (row.place_name as string) || undefined,
      syncStatus: SyncStatus.SYNCED,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      createdBy: row.created_by as string,
      updatedBy: row.updated_by as string,
    };
    await setDoc(doc(firestore, `${basePath}/transactions`, txnId), cleanObject(data));
    await db.runAsync(`UPDATE transactions SET sync_status = ? WHERE id = ?`, [SyncStatus.SYNCED, txnId]);
  }

  console.log('Sync: Push completed successfully.');
}

export async function syncWithFirebase(
  db: SQLiteDatabase,
  userId: string,
  familyId?: string | null
): Promise<void> {
  if (!userId || userId === 'local-user') return;
  try {
    // Push local pending changes first
    await pushToFirebase(db, userId, familyId);
    // Pull any remote changes from Firebase
    await pullFromFirebase(db, userId, familyId);
  } catch (error) {
    console.error('Error during Firebase synchronization:', error);
  }
}
