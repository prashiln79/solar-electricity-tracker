import { create } from 'zustand';
import { type SQLiteDatabase } from 'expo-sqlite';

export interface Settings {
  tariff: number;
  currency: string;
  netMeteringMethod: 'Net Metering' | 'Net Billing';
  darkMode: 'system' | 'light' | 'dark';
  notificationEnabled: boolean;
}

export interface DailyReading {
  id: number;
  date: string;
  solarGenerated: number;
  gridImport: number;
  gridExport: number;
  houseConsumption: number;
  moneySaved: number;
  notes?: string;
  createdAt?: string;
}

export interface Bill {
  id: number;
  month: string; // YYYY-MM
  amount: number;
  importedUnits: number;
  exportedUnits: number;
  notes?: string;
  createdAt?: string;
}

interface EnergyState {
  settings: Settings;
  readings: DailyReading[];
  bills: Bill[];
  isLoading: boolean;

  // Actions
  loadStore: (db: SQLiteDatabase) => Promise<void>;
  updateSettings: (db: SQLiteDatabase, newSettings: Partial<Settings>) => Promise<void>;
  
  // Readings CRUD
  addReading: (db: SQLiteDatabase, reading: {
    date: string;
    solarGenerated: number;
    gridImport: number;
    gridExport: number;
    notes?: string;
  }) => Promise<void>;
  updateReading: (db: SQLiteDatabase, id: number, reading: {
    date: string;
    solarGenerated: number;
    gridImport: number;
    gridExport: number;
    notes?: string;
  }) => Promise<void>;
  deleteReading: (db: SQLiteDatabase, id: number) => Promise<void>;

  // Bills CRUD
  addBill: (db: SQLiteDatabase, bill: {
    month: string;
    amount: number;
    importedUnits: number;
    exportedUnits: number;
    notes?: string;
  }) => Promise<void>;
  updateBill: (db: SQLiteDatabase, id: number, bill: {
    month: string;
    amount: number;
    importedUnits: number;
    exportedUnits: number;
    notes?: string;
  }) => Promise<void>;
  deleteBill: (db: SQLiteDatabase, id: number) => Promise<void>;
}

export const useEnergyStore = create<EnergyState>((set, get) => ({
  settings: {
    tariff: 7.5,
    currency: '₹',
    netMeteringMethod: 'Net Metering',
    darkMode: 'system',
    notificationEnabled: true,
  },
  readings: [],
  bills: [],
  isLoading: true,

  loadStore: async (db: SQLiteDatabase) => {
    set({ isLoading: true });
    try {
      // 1. Fetch settings (should always have exactly one row with id = 1)
      const rawSettings = await db.getFirstAsync<{
        tariff: number;
        currency: string;
        netMeteringMethod: 'Net Metering' | 'Net Billing';
        darkMode: 'system' | 'light' | 'dark';
        notificationEnabled: number;
      }>('SELECT * FROM Settings WHERE id = 1');

      let parsedSettings = get().settings;
      if (rawSettings) {
        parsedSettings = {
          tariff: rawSettings.tariff,
          currency: rawSettings.currency,
          netMeteringMethod: rawSettings.netMeteringMethod,
          darkMode: rawSettings.darkMode,
          notificationEnabled: rawSettings.notificationEnabled === 1,
        };
      }

      // 2. Fetch daily readings (ordered by date descending)
      const rawReadings = await db.getAllAsync<DailyReading>(
        'SELECT * FROM DailyReadings ORDER BY date DESC'
      );

      // 3. Fetch bills (ordered by month descending)
      const rawBills = await db.getAllAsync<Bill>(
        'SELECT * FROM Bills ORDER BY month DESC'
      );

      set({
        settings: parsedSettings,
        readings: rawReadings || [],
        bills: rawBills || [],
        isLoading: false,
      });
      console.log('[Store] Loaded settings, readings, and bills successfully.');
    } catch (error) {
      console.error('[Store] Error loading from SQLite database:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (db: SQLiteDatabase, newSettings: Partial<Settings>) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };

    try {
      await db.runAsync(
        `UPDATE Settings 
         SET tariff = ?, currency = ?, netMeteringMethod = ?, darkMode = ?, notificationEnabled = ? 
         WHERE id = 1`,
        [
          updated.tariff,
          updated.currency,
          updated.netMeteringMethod,
          updated.darkMode,
          updated.notificationEnabled ? 1 : 0,
        ]
      );

      set({ settings: updated });
      console.log('[Store] Settings updated in SQLite & state.');
    } catch (error) {
      console.error('[Store] Failed to update settings in database:', error);
      throw error;
    }
  },

  addReading: async (db: SQLiteDatabase, input) => {
    const { tariff } = get().settings;

    // Automated calculations
    const solarUsed = Math.max(0, input.solarGenerated - input.gridExport);
    const houseConsumption = Math.max(0, input.solarGenerated + input.gridImport - input.gridExport);
    const moneySaved = solarUsed * tariff;

    try {
      const result = await db.runAsync(
        `INSERT INTO DailyReadings (date, solarGenerated, gridImport, gridExport, houseConsumption, moneySaved, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.date,
          input.solarGenerated,
          input.gridImport,
          input.gridExport,
          houseConsumption,
          moneySaved,
          input.notes || null,
        ]
      );

      const newReading: DailyReading = {
        id: result.lastInsertRowId,
        date: input.date,
        solarGenerated: input.solarGenerated,
        gridImport: input.gridImport,
        gridExport: input.gridExport,
        houseConsumption,
        moneySaved,
        notes: input.notes,
      };

      // Keep sorted list
      const updatedReadings = [newReading, ...get().readings].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      set({ readings: updatedReadings });
      console.log('[Store] Reading added successfully:', newReading.date);
    } catch (error) {
      console.error('[Store] Failed to add reading to database:', error);
      throw error;
    }
  },

  updateReading: async (db: SQLiteDatabase, id, input) => {
    const { tariff } = get().settings;

    // Automated calculations
    const solarUsed = Math.max(0, input.solarGenerated - input.gridExport);
    const houseConsumption = Math.max(0, input.solarGenerated + input.gridImport - input.gridExport);
    const moneySaved = solarUsed * tariff;

    try {
      await db.runAsync(
        `UPDATE DailyReadings
         SET date = ?, solarGenerated = ?, gridImport = ?, gridExport = ?, houseConsumption = ?, moneySaved = ?, notes = ?
         WHERE id = ?`,
        [
          input.date,
          input.solarGenerated,
          input.gridImport,
          input.gridExport,
          houseConsumption,
          moneySaved,
          input.notes || null,
          id,
        ]
      );

      const updatedReadings = get().readings.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            date: input.date,
            solarGenerated: input.solarGenerated,
            gridImport: input.gridImport,
            gridExport: input.gridExport,
            houseConsumption,
            moneySaved,
            notes: input.notes,
          };
        }
        return r;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      set({ readings: updatedReadings });
      console.log('[Store] Reading updated successfully, ID:', id);
    } catch (error) {
      console.error('[Store] Failed to update reading in database:', error);
      throw error;
    }
  },

  deleteReading: async (db: SQLiteDatabase, id) => {
    try {
      await db.runAsync('DELETE FROM DailyReadings WHERE id = ?', [id]);
      set({ readings: get().readings.filter((r) => r.id !== id) });
      console.log('[Store] Reading deleted successfully, ID:', id);
    } catch (error) {
      console.error('[Store] Failed to delete reading from database:', error);
      throw error;
    }
  },

  addBill: async (db: SQLiteDatabase, input) => {
    try {
      const result = await db.runAsync(
        `INSERT INTO Bills (month, amount, importedUnits, exportedUnits, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [input.month, input.amount, input.importedUnits, input.exportedUnits, input.notes || null]
      );

      const newBill: Bill = {
        id: result.lastInsertRowId,
        month: input.month,
        amount: input.amount,
        importedUnits: input.importedUnits,
        exportedUnits: input.exportedUnits,
        notes: input.notes,
      };

      const updatedBills = [newBill, ...get().bills].sort(
        (a, b) => b.month.localeCompare(a.month)
      );

      set({ bills: updatedBills });
      console.log('[Store] Bill added successfully:', newBill.month);
    } catch (error) {
      console.error('[Store] Failed to add bill to database:', error);
      throw error;
    }
  },

  updateBill: async (db: SQLiteDatabase, id, input) => {
    try {
      await db.runAsync(
        `UPDATE Bills
         SET month = ?, amount = ?, importedUnits = ?, exportedUnits = ?, notes = ?
         WHERE id = ?`,
        [input.month, input.amount, input.importedUnits, input.exportedUnits, input.notes || null, id]
      );

      const updatedBills = get().bills.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            month: input.month,
            amount: input.amount,
            importedUnits: input.importedUnits,
            exportedUnits: input.exportedUnits,
            notes: input.notes,
          };
        }
        return b;
      }).sort((a, b) => b.month.localeCompare(a.month));

      set({ bills: updatedBills });
      console.log('[Store] Bill updated successfully, ID:', id);
    } catch (error) {
      console.error('[Store] Failed to update bill in database:', error);
      throw error;
    }
  },

  deleteBill: async (db: SQLiteDatabase, id) => {
    try {
      await db.runAsync('DELETE FROM Bills WHERE id = ?', [id]);
      set({ bills: get().bills.filter((b) => b.id !== id) });
      console.log('[Store] Bill deleted successfully, ID:', id);
    } catch (error) {
      console.error('[Store] Failed to delete bill from database:', error);
      throw error;
    }
  },
}));
