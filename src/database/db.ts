/**
 * Database initialization and migration for Money Manager.
 * Uses expo-sqlite with the schema from schema.ts.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

const DB_VERSION = 1;

/**
 * Initialize the database — create tables and run migrations.
 * Passed to SQLiteProvider's onInit callback.
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  // Enable WAL mode for better concurrent read/write performance
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Check current schema version
  const versionResult = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion < DB_VERSION) {
    await db.execAsync(CREATE_TABLES_SQL);
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  }
}

/**
 * Generate a unique ID for new entities.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
