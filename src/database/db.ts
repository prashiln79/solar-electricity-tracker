import { type SQLiteDatabase } from 'expo-sqlite';

/**
 * Initializes the SQLite database by enabling WAL mode and setting up the schema.
 * Pre-populates the settings table with default config.
 */
export async function initializeDatabase(db: SQLiteDatabase) {
  try {
    // Enable Write-Ahead Logging (WAL) for better concurrent performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // 1. Settings table (strictly one row with id = 1)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        tariff REAL NOT NULL DEFAULT 7.5,
        currency TEXT NOT NULL DEFAULT '₹',
        netMeteringMethod TEXT NOT NULL DEFAULT 'Net Metering',
        darkMode TEXT NOT NULL DEFAULT 'system',
        notificationEnabled INTEGER NOT NULL DEFAULT 1
      );
    `);

    // Insert default settings if they do not exist
    await db.execAsync(`
      INSERT OR IGNORE INTO Settings (id, tariff, currency, netMeteringMethod, darkMode, notificationEnabled)
      VALUES (1, 7.5, '₹', 'Net Metering', 'system', 1);
    `);

    // 2. Daily Readings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS DailyReadings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        solarGenerated REAL NOT NULL,
        gridImport REAL NOT NULL,
        gridExport REAL NOT NULL,
        houseConsumption REAL NOT NULL,
        moneySaved REAL NOT NULL,
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on date for faster lookups/sorting
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_readings_date ON DailyReadings (date);
    `);

    // 3. Monthly Bills table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT UNIQUE NOT NULL, -- Format: YYYY-MM
        amount REAL NOT NULL,
        importedUnits REAL NOT NULL,
        exportedUnits REAL NOT NULL,
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on month for faster lookups/sorting
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_bills_month ON Bills (month);
    `);

    console.log('[SQLite DB] Schema initialized successfully.');
  } catch (error) {
    console.error('[SQLite DB] Initialization failed:', error);
    throw error;
  }
}
