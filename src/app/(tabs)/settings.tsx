import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, useColorScheme, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEnergyStore } from '@/store/useEnergyStore';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { settings, updateSettings } = useEnergyStore();
  
  const [tariff, setTariff] = useState(settings.tariff.toString());
  const [currency, setCurrency] = useState(settings.currency);
  const [netMeteringMethod, setNetMeteringMethod] = useState(settings.netMeteringMethod);
  const [darkMode, setDarkMode] = useState(settings.darkMode);
  const [notificationEnabled, setNotificationEnabled] = useState(settings.notificationEnabled);

  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setMessage('');
    const parsedTariff = parseFloat(tariff);

    if (isNaN(parsedTariff) || parsedTariff <= 0) {
      setMessage('⚠️ Please enter a valid electricity tariff per unit.');
      return;
    }

    if (!currency.trim()) {
      setMessage('⚠️ Please enter a currency symbol.');
      return;
    }

    try {
      await updateSettings(db, {
        tariff: parsedTariff,
        currency: currency.trim(),
        netMeteringMethod,
        darkMode,
        notificationEnabled,
      });

      setMessage('✅ Settings saved successfully!');
      setTimeout(() => setMessage(''), 2000);
    } catch (e) {
      console.error(e);
      setMessage('⚠️ Failed to save settings.');
    }
  };

  const handleResetData = async () => {
    // Standard SQLite reset
    try {
      await db.runAsync('DELETE FROM DailyReadings');
      await db.runAsync('DELETE FROM Bills');
      await db.runAsync(`
        UPDATE Settings 
        SET tariff = 7.5, currency = '₹', netMeteringMethod = 'Net Metering', darkMode = 'system', notificationEnabled = 1 
        WHERE id = 1
      `);
      
      setTariff('7.5');
      setCurrency('₹');
      setNetMeteringMethod('Net Metering');
      setDarkMode('system');
      setNotificationEnabled(true);

      // Force reload state
      await useEnergyStore.getState().loadStore(db);

      setMessage('🔄 App database reset to defaults.');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setMessage('⚠️ Failed to reset data.');
    }
  };

  const handleGenerateMockData = async () => {
    try {
      setMessage('⌛ Generating mock data...');
      
      // Clear existing first
      await db.runAsync('DELETE FROM DailyReadings');
      await db.runAsync('DELETE FROM Bills');

      const tariffVal = parseFloat(tariff) || 7.5;
      const baseDate = new Date();
      const currentMonthStr = baseDate.toLocaleDateString('sv-SE').substring(0, 7);
      
      // 1. Generate 30 days of daily readings
      for (let i = 29; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dateStr = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD

        // Generation curve around 14-22 kWh
        const solarGenerated = Math.round((14 + Math.random() * 8) * 10) / 10;
        // Import is around 3-8 kWh
        const gridImport = Math.round((3 + Math.random() * 5) * 10) / 10;
        // Export around 60% of solar
        const gridExport = Math.round((solarGenerated * 0.55 + Math.random() * 2) * 10) / 10;
        
        const houseConsumption = Math.round(Math.max(0, solarGenerated + gridImport - gridExport) * 10) / 10;
        const solarUsed = Math.max(0, solarGenerated - gridExport);
        const moneySaved = Math.round(solarUsed * tariffVal * 10) / 10;

        const notesList = [
          'Panel cleaning completed in morning',
          'Slight cloud cover in afternoon',
          'Heavy laundry run today',
          'Perfect sunny afternoon',
          'Minimal home usage, peak grid exports',
          'Rainy overcast sky',
        ];
        const notes = Math.random() > 0.65 ? notesList[Math.floor(Math.random() * notesList.length)] : '';

        await db.runAsync(
          `INSERT INTO DailyReadings (date, solarGenerated, gridImport, gridExport, houseConsumption, moneySaved, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [dateStr, solarGenerated, gridImport, gridExport, houseConsumption, moneySaved, notes || null]
        );
      }

      // 2. Generate monthly bills
      const lastMonthDate = new Date(baseDate);
      lastMonthDate.setMonth(baseDate.getMonth() - 1);
      const lastMonthStr = lastMonthDate.toLocaleDateString('sv-SE').substring(0, 7);

      // Log bill for current month (estimate)
      await db.runAsync(
        `INSERT INTO Bills (month, amount, importedUnits, exportedUnits, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [currentMonthStr, 1250.0, 160.0, 290.0, 'Interim estimate for active billing cycle']
      );

      // Log bill for last month (settled)
      await db.runAsync(
        `INSERT INTO Bills (month, amount, importedUnits, exportedUnits, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [lastMonthStr, 1540.0, 210.0, 340.0, 'DISCOM Settled Bill Invoice']
      );

      // Reload store state
      await useEnergyStore.getState().loadStore(db);

      setMessage('✨ Generated 30 days of mock metrics!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setMessage('⚠️ Failed to generate mock data.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              ⚙ Settings
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Configure electricity tariffs and application preferences
            </ThemedText>
          </View>

          {message !== '' && (
            <View style={[styles.banner, { backgroundColor: message.startsWith('✅') ? colors.primaryLight : colors.errorLight }]}>
              <ThemedText type="smallBold" style={{ color: message.startsWith('✅') ? colors.primary : colors.error, textAlign: 'center' }}>
                {message}
              </ThemedText>
            </View>
          )}

          {/* Electricity Settings */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={[styles.cardTitle, { color: colors.primary }]}>
              Electricity Settings
            </ThemedText>

            {/* Tariff */}
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" themeColor="textSecondary">Tariff per Unit (Import Rate)</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                keyboardType="numeric"
                value={tariff}
                onChangeText={setTariff}
                placeholder="e.g. 7.50"
                placeholderTextColor={colors.textSecondary}
              />
              <ThemedText type="code" themeColor="textSecondary" style={styles.hint}>
                The cost you pay per kWh imported from the grid.
              </ThemedText>
            </View>

            {/* Currency */}
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" themeColor="textSecondary">Currency Symbol</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                value={currency}
                onChangeText={setCurrency}
                placeholder="e.g. ₹ or $"
                maxLength={3}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Net Metering Method */}
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" themeColor="textSecondary">Net Metering Policy</ThemedText>
              <View style={[styles.toggleBtnGroup, { backgroundColor: colors.background }]}>
                {(['Net Metering', 'Net Billing'] as const).map((method) => {
                  const isActive = netMeteringMethod === method;
                  return (
                    <Pressable
                      key={method}
                      style={[styles.toggleBtn, isActive && { backgroundColor: colors.backgroundSelected }]}
                      onPress={() => setNetMeteringMethod(method)}
                    >
                      <ThemedText type="code" style={{ color: isActive ? colors.primary : colors.textSecondary, fontWeight: '700' }}>
                        {method}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <ThemedText type="code" themeColor="textSecondary" style={styles.hint}>
                Net Metering offset counts units directly; Net Billing applies separate export rates.
              </ThemedText>
            </View>
          </ThemedView>

          {/* Application Preference Settings */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={[styles.cardTitle, { color: colors.primary }]}>
              Application Preferences
            </ThemedText>

            {/* Dark Mode Selector */}
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" themeColor="textSecondary">Theme Mode</ThemedText>
              <View style={[styles.toggleBtnGroup, { backgroundColor: colors.background }]}>
                {(['system', 'light', 'dark'] as const).map((mode) => {
                  const isActive = darkMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      style={[styles.toggleBtn, isActive && { backgroundColor: colors.backgroundSelected }]}
                      onPress={() => setDarkMode(mode)}
                    >
                      <ThemedText type="code" style={{ color: isActive ? colors.primary : colors.textSecondary, textTransform: 'capitalize', fontWeight: '700' }}>
                        {mode}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Notifications Toggle */}
            <View style={styles.rowSetting}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" themeColor="textSecondary">Daily Reminder Notifications</ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>
                  Remind to log readings daily at 7:00 PM
                </ThemedText>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{ false: colors.backgroundElement, true: colors.primaryLight }}
                thumbColor={notificationEnabled ? colors.primary : colors.textSecondary}
              />
            </View>

            {/* Backup & Restore (future) */}
            <View style={[styles.rowSetting, { opacity: 0.5 }]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" themeColor="textSecondary">Cloud Backup & Restore</ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>
                  Sync data to Google Drive / iCloud (Future Feature)
                </ThemedText>
              </View>
              <Switch value={false} disabled />
            </View>
          </ThemedView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable 
              style={[styles.btn, styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Save Settings</ThemedText>
            </Pressable>

            <Pressable 
              style={[styles.btn, styles.resetBtn, { borderColor: colors.primary }]}
              onPress={handleGenerateMockData}
            >
              <ThemedText type="smallBold" style={{ color: colors.primary }}>Generate Mock Test Data</ThemedText>
            </Pressable>

            <Pressable 
              style={[styles.btn, styles.resetBtn, { borderColor: colors.error }]}
              onPress={handleResetData}
            >
              <ThemedText type="smallBold" style={{ color: colors.error }}>Reset Database Data</ThemedText>
            </Pressable>
          </View>

          {/* About Section */}
          <ThemedView type="backgroundElement" style={styles.aboutCard}>
            <ThemedText type="smallBold" style={{ color: colors.primary, marginBottom: 4 }}>
              ℹ About Solar Tracker App
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary" style={styles.aboutText}>
              Version 1.0.0 (Offline-First){'\n'}
              Built with React Native, Expo Router, Zustand, and SQLite database storage.{'\n'}
              Helps you easily track solar generation offset savings and utility bill comparisons in real-time.
            </ThemedText>
          </ThemedView>

          <View style={{ height: Spacing.four }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  header: {
    marginBottom: Spacing.one,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 32,
    marginBottom: Spacing.one,
  },
  banner: {
    padding: Spacing.two,
    borderRadius: 12,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleBtnGroup: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    marginTop: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  actionRow: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  btn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    elevation: 2,
  },
  resetBtn: {
    borderWidth: 1.5,
  },
  aboutCard: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    marginTop: Spacing.one,
  },
  aboutText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
