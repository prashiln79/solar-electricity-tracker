import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEnergyStore } from '@/store/useEnergyStore';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatCard } from '@/components/stat-card';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const { readings, settings } = useEnergyStore();

  // Get current date string in local YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('sv-SE'); // sv-SE returns YYYY-MM-DD format
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  // Find today's reading
  const todayReading = readings.find((r) => r.date === todayStr);

  // Calculations for Today
  const solarToday = todayReading ? todayReading.solarGenerated : 0;
  const importToday = todayReading ? todayReading.gridImport : 0;
  const exportToday = todayReading ? todayReading.gridExport : 0;
  const consumptionToday = todayReading ? todayReading.houseConsumption : 0;
  const savingsToday = todayReading ? todayReading.moneySaved : 0;

  // Filter current month's readings
  const monthlyReadings = readings.filter((r) => r.date.startsWith(currentMonthStr));
  
  // Calculate Monthly Totals
  const solarMonth = monthlyReadings.reduce((sum, r) => sum + r.solarGenerated, 0);
  const importMonth = monthlyReadings.reduce((sum, r) => sum + r.gridImport, 0);
  const exportMonth = monthlyReadings.reduce((sum, r) => sum + r.gridExport, 0);
  const consumptionMonth = monthlyReadings.reduce((sum, r) => sum + r.houseConsumption, 0);
  const savingsMonth = monthlyReadings.reduce((sum, r) => sum + r.moneySaved, 0);

  // Last updated timestamp
  const lastUpdated = todayReading && todayReading.createdAt 
    ? new Date(todayReading.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : readings.length > 0 && readings[0].createdAt
    ? new Date(readings[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'No data';

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
            <View>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                🏠 Solar Tracker
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Daily Energy & Savings Dashboard
              </ThemedText>
            </View>
            <View style={[styles.infoBadge, { backgroundColor: colors.primaryLight }]}>
              <ThemedText type="smallBold" style={{ color: colors.primary, fontSize: 12 }}>
                Last sync: {lastUpdated}
              </ThemedText>
            </View>
          </View>

          {/* Warning Banner if today's reading is missing */}
          {!todayReading && (
            <ThemedView type="backgroundElement" style={[styles.alertBanner, { borderColor: colors.error }]}>
              <Ionicons name="warning" size={20} color={colors.error} />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={{ color: colors.error }}>
                  No reading logged today
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 11 }}>
                  Tap the button below or the "+" tab to enter today's metrics and track your savings.
                </ThemedText>
              </View>
              <Pressable 
                style={[styles.addInlineBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/add')}
              >
                <ThemedText type="smallBold" style={{ color: '#ffffff', fontSize: 12 }}>Add</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {/* Grid of Today's Solar Metrics */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.primary }]}>
              Today's Energy Balance (kWh)
            </ThemedText>
            {todayReading && (
              <ThemedText type="code" themeColor="textSecondary">
                Logged for {new Date(todayReading.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </ThemedText>
            )}
          </View>

          <View style={styles.grid}>
            <StatCard 
              title="Solar Generated" 
              value={solarToday.toFixed(1)} 
              unit="kWh" 
              icon="☀️" 
              type="primary" 
              subtitle="Solar output today" 
            />
            <StatCard 
              title="House Usage" 
              value={consumptionToday.toFixed(1)} 
              unit="kWh" 
              icon="🏠" 
              type="info" 
              subtitle="Home consumption" 
            />
          </View>

          <View style={styles.grid}>
            <StatCard 
              title="Grid Import" 
              value={importToday.toFixed(1)} 
              unit="kWh" 
              icon="⬇️" 
              type="info" 
              subtitle="Pulled from grid" 
            />
            <StatCard 
              title="Grid Export" 
              value={exportToday.toFixed(1)} 
              unit="kWh" 
              icon="⬆️" 
              type="accent" 
              subtitle="Sent to grid" 
            />
          </View>

          <View style={styles.grid}>
            <StatCard 
              title="Money Saved Today" 
              value={`${settings.currency}${Math.round(savingsToday)}`} 
              unit="" 
              icon="💰" 
              type="primary" 
              subtitle="Direct solar offsets" 
            />
            <StatCard 
              title="Saved This Month" 
              value={`${settings.currency}${Math.round(savingsMonth).toLocaleString('en-IN')}`} 
              unit="" 
              icon="📆" 
              type="primary" 
              subtitle="Accumulated so far" 
            />
          </View>

          {/* Monthly Summary Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.primary }]}>
              Current Month Summary
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              Cumulative stats for {new Date().toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <ThemedText type="small" themeColor="textSecondary">Solar Gen</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 20 }}>{solarMonth.toFixed(1)} kWh</ThemedText>
              </View>
              <View style={styles.summaryCol}>
                <ThemedText type="small" themeColor="textSecondary">House Usage</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 20 }}>{consumptionMonth.toFixed(1)} kWh</ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.backgroundElement }]} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <ThemedText type="small" themeColor="textSecondary">Grid Import</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 20, color: colors.info }}>{importMonth.toFixed(1)} kWh</ThemedText>
              </View>
              <View style={styles.summaryCol}>
                <ThemedText type="small" themeColor="textSecondary">Grid Export</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 20, color: colors.accent }}>{exportMonth.toFixed(1)} kWh</ThemedText>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.backgroundElement }]} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <ThemedText type="small" themeColor="textSecondary">Net Imported Energy</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 18, color: importMonth - exportMonth >= 0 ? colors.info : colors.primary }}>
                  {(importMonth - exportMonth).toFixed(1)} kWh
                </ThemedText>
              </View>
              <View style={styles.summaryCol}>
                <ThemedText type="small" themeColor="textSecondary">Self-Consumption</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 18, color: colors.primary }}>
                  {solarMonth > 0 ? `${Math.round(((solarMonth - exportMonth) / solarMonth) * 100)}%` : '0%'}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Action button */}
          <Pressable 
            style={[styles.floatingActionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/add')}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <ThemedText type="smallBold" style={styles.btnText}>Add Daily Reading</ThemedText>
          </Pressable>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 32,
    marginBottom: Spacing.one,
  },
  infoBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  addInlineBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
  sectionHeader: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginHorizontal: -Spacing.one,
  },
  summaryCard: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  floatingActionBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
