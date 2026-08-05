import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, useColorScheme, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEnergyStore, DailyReading } from '@/store/useEnergyStore';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChartCard } from '@/components/chart-card';
import { Ionicons } from '@expo/vector-icons';

type TimeFilter = 'Today' | 'Week' | 'Month' | 'Year' | 'Custom';

export default function AnalyticsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { readings, settings } = useEnergyStore();
  const [filter, setFilter] = useState<TimeFilter>('Week');
  
  // Custom range states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Grid Import vs Export Sub-toggle
  const [gridChartToggle, setGridChartToggle] = useState<'import' | 'export'>('export');

  // Today's hourly bell curve simulation (scaled by capacity)
  const todayHourlyData = useMemo(() => {
    const scale = settings.tariff > 0 ? settings.tariff / 7.5 : 1; // scale factor
    return [
      { label: '06:00', value: Math.round(0.1 * scale * 10) / 10 },
      { label: '08:00', value: Math.round(1.1 * scale * 10) / 10 },
      { label: '10:00', value: Math.round(2.6 * scale * 10) / 10 },
      { label: '12:00', value: Math.round(3.6 * scale * 10) / 10 }, // Peak
      { label: '14:00', value: Math.round(3.0 * scale * 10) / 10 },
      { label: '16:00', value: Math.round(1.4 * scale * 10) / 10 },
      { label: '18:00', value: Math.round(0.1 * scale * 10) / 10 },
    ];
  }, [settings.tariff]);

  // Filtered readings based on selection
  const filteredReadings = useMemo(() => {
    const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date)); // chronological order for charts
    
    if (filter === 'Today') {
      const todayStr = new Date().toLocaleDateString('sv-SE');
      return sorted.filter((r) => r.date === todayStr);
    }
    
    if (filter === 'Week') {
      // Past 7 records
      return sorted.slice(-7);
    }
    
    if (filter === 'Month') {
      // Past 30 records
      return sorted.slice(-30);
    }
    
    if (filter === 'Year') {
      // Group by month
      const monthlyGroups: { [key: string]: DailyReading[] } = {};
      sorted.forEach((r) => {
        const monthKey = r.date.substring(0, 7); // YYYY-MM
        if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = [];
        monthlyGroups[monthKey].push(r);
      });

      // Map back to a list of average/sum records per month
      return Object.keys(monthlyGroups).map((month, idx) => {
        const group = monthlyGroups[month];
        const count = group.length;
        const solarGenerated = group.reduce((sum, r) => sum + r.solarGenerated, 0);
        const gridImport = group.reduce((sum, r) => sum + r.gridImport, 0);
        const gridExport = group.reduce((sum, r) => sum + r.gridExport, 0);
        const houseConsumption = group.reduce((sum, r) => sum + r.houseConsumption, 0);
        const moneySaved = group.reduce((sum, r) => sum + r.moneySaved, 0);

        return {
          id: idx,
          date: month, // label is YYYY-MM
          solarGenerated,
          gridImport,
          gridExport,
          houseConsumption,
          moneySaved,
        } as DailyReading;
      }).slice(-12); // Past 12 months
    }

    if (filter === 'Custom') {
      if (!startDate || !endDate) return sorted;
      return sorted.filter((r) => r.date >= startDate && r.date <= endDate);
    }

    return sorted;
  }, [readings, filter, startDate, endDate]);

  // Chart data mapping
  const solarChartData = useMemo(() => {
    if (filter === 'Today') return todayHourlyData;
    return filteredReadings.map((r) => ({
      label: filter === 'Year' 
        ? new Date(r.date + '-01').toLocaleDateString([], { month: 'short' }) 
        : r.date.substring(5), // MM-DD
      value: r.solarGenerated,
    }));
  }, [filteredReadings, filter, todayHourlyData]);

  const consumptionChartData = useMemo(() => {
    return filteredReadings.map((r) => ({
      label: filter === 'Year' 
        ? new Date(r.date + '-01').toLocaleDateString([], { month: 'short' }) 
        : r.date.substring(5), 
      value: r.houseConsumption,
    }));
  }, [filteredReadings, filter]);

  const savingsChartData = useMemo(() => {
    return filteredReadings.map((r) => ({
      label: filter === 'Year' 
        ? new Date(r.date + '-01').toLocaleDateString([], { month: 'short' }) 
        : r.date.substring(5),
      value: r.moneySaved,
    }));
  }, [filteredReadings, filter]);

  const gridChartData = useMemo(() => {
    return filteredReadings.map((r) => ({
      label: filter === 'Year' 
        ? new Date(r.date + '-01').toLocaleDateString([], { month: 'short' }) 
        : r.date.substring(5),
      value: gridChartToggle === 'export' ? r.gridExport : r.gridImport,
    }));
  }, [filteredReadings, filter, gridChartToggle]);

  const selfConsumptionChartData = useMemo(() => {
    return filteredReadings.map((r) => {
      const selfConsumption = r.solarGenerated > 0 
        ? Math.round(((r.solarGenerated - r.gridExport) / r.solarGenerated) * 100)
        : 0;
      return {
        label: filter === 'Year' 
          ? new Date(r.date + '-01').toLocaleDateString([], { month: 'short' }) 
          : r.date.substring(5),
        value: Math.max(0, Math.min(100, selfConsumption)), // clamp 0-100%
      };
    });
  }, [filteredReadings, filter]);

  // Total sums for active range
  const rangeTotals = useMemo(() => {
    const totalSolar = filteredReadings.reduce((sum, r) => sum + r.solarGenerated, 0);
    const totalImport = filteredReadings.reduce((sum, r) => sum + r.gridImport, 0);
    const totalExport = filteredReadings.reduce((sum, r) => sum + r.gridExport, 0);
    const totalConsumption = filteredReadings.reduce((sum, r) => sum + r.houseConsumption, 0);
    const totalSavings = filteredReadings.reduce((sum, r) => sum + r.moneySaved, 0);
    const avgSelfConsumption = filteredReadings.length > 0
      ? Math.round((filteredReadings.reduce((sum, r) => {
          const self = r.solarGenerated > 0 ? ((r.solarGenerated - r.gridExport) / r.solarGenerated) : 1;
          return sum + self;
        }, 0) / filteredReadings.length) * 100)
      : 0;

    return {
      solar: totalSolar,
      import: totalImport,
      export: totalExport,
      consumption: totalConsumption,
      savings: totalSavings,
      selfConsumption: avgSelfConsumption,
    };
  }, [filteredReadings]);

  // List log logs sorted by date descending (for list view)
  const listLogs = useMemo(() => {
    return [...filteredReadings].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredReadings]);

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
              📊 Analytics
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Analyze solar yields and grid interactions
            </ThemedText>
          </View>

          {/* Time Filter Buttons */}
          <View style={[styles.filterContainer, { backgroundColor: colors.backgroundElement }]}>
            {(['Today', 'Week', 'Month', 'Year', 'Custom'] as TimeFilter[]).map((t) => {
              const isActive = filter === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.filterBtn,
                    isActive && { backgroundColor: colors.backgroundSelected }
                  ]}
                  onPress={() => setFilter(t)}
                >
                  <ThemedText 
                    type="smallBold" 
                    style={{ color: isActive ? colors.primary : colors.textSecondary }}
                  >
                    {t}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Date Picker Inputs */}
          {filter === 'Custom' && (
            <ThemedView type="backgroundElement" style={styles.customDateCard}>
              <ThemedText type="smallBold" style={{ color: colors.primary, marginBottom: 8 }}>
                Filter by Custom Date Range
              </ThemedText>
              <View style={styles.dateInputsRow}>
                <View style={styles.inputCol}>
                  <ThemedText type="code" themeColor="textSecondary">Start (YYYY-MM-DD)</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                    placeholder="e.g. 2026-08-01"
                    placeholderTextColor={colors.textSecondary}
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={styles.inputCol}>
                  <ThemedText type="code" themeColor="textSecondary">End (YYYY-MM-DD)</ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                    placeholder="e.g. 2026-08-31"
                    placeholderTextColor={colors.textSecondary}
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
            </ThemedView>
          )}

          {/* Range Performance Summary */}
          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="smallBold" style={{ color: colors.primary, fontSize: 13, marginBottom: Spacing.two }}>
              Range Summary Indicators
            </ThemedText>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Total Solar Gen</ThemedText>
                <ThemedText type="smallBold" style={styles.summaryVal}>{rangeTotals.solar.toFixed(1)} kWh</ThemedText>
              </View>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Total Consumed</ThemedText>
                <ThemedText type="smallBold" style={styles.summaryVal}>{rangeTotals.consumption.toFixed(1)} kWh</ThemedText>
              </View>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Total Savings</ThemedText>
                <ThemedText type="smallBold" style={[styles.summaryVal, { color: colors.primary }]}>
                  {settings.currency}{Math.round(rangeTotals.savings).toLocaleString('en-IN')}
                </ThemedText>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Grid Import</ThemedText>
                <ThemedText type="smallBold" style={[styles.summaryVal, { color: colors.info }]}>{rangeTotals.import.toFixed(1)} kWh</ThemedText>
              </View>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Grid Export</ThemedText>
                <ThemedText type="smallBold" style={[styles.summaryVal, { color: colors.accent }]}>{rangeTotals.export.toFixed(1)} kWh</ThemedText>
              </View>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Self-Consumption</ThemedText>
                <ThemedText type="smallBold" style={styles.summaryVal}>{rangeTotals.selfConsumption}%</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Render Charts */}
          {filteredReadings.length === 0 && filter !== 'Today' ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <Ionicons name="bar-chart" size={40} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <ThemedText type="smallBold" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
                No readings available inside this range.
              </ThemedText>
            </ThemedView>
          ) : (
            <View style={{ gap: Spacing.two }}>
              {/* Daily/Monthly Solar Gen Chart */}
              <ChartCard
                title={filter === 'Year' ? 'Monthly Solar Generation' : 'Daily Solar Generation'}
                subtitle={filter === 'Today' ? 'Today\'s Simulated Bell Curve (kW)' : `Solar Generation yield over this period`}
                data={solarChartData}
                type={filter === 'Today' ? 'line' : 'bar'}
                yUnit={filter === 'Today' ? 'kW' : 'kWh'}
              />

              {/* Grid Import vs Export Toggle Card */}
              <ThemedView type="backgroundElement" style={styles.toggleChartCard}>
                <View style={styles.toggleHeader}>
                  <ThemedText type="smallBold">Grid Interactions</ThemedText>
                  <View style={[styles.toggleBtnGroup, { backgroundColor: colors.background }]}>
                    <Pressable
                      style={[styles.toggleBtn, gridChartToggle === 'export' && { backgroundColor: colors.backgroundSelected }]}
                      onPress={() => setGridChartToggle('export')}
                    >
                      <ThemedText type="code" style={{ color: gridChartToggle === 'export' ? colors.primary : colors.textSecondary }}>Export</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleBtn, gridChartToggle === 'import' && { backgroundColor: colors.backgroundSelected }]}
                      onPress={() => setGridChartToggle('import')}
                    >
                      <ThemedText type="code" style={{ color: gridChartToggle === 'import' ? colors.primary : colors.textSecondary }}>Import</ThemedText>
                    </Pressable>
                  </View>
                </View>
                <ChartCard
                  title={`Grid ${gridChartToggle === 'export' ? 'Export' : 'Import'} (kWh)`}
                  subtitle={`Electricity ${gridChartToggle === 'export' ? 'sent to' : 'drawn from'} the state utility grid`}
                  data={gridChartData}
                  type="bar"
                  yUnit="kWh"
                />
              </ThemedView>

              {/* House Consumption Chart */}
              {filter !== 'Today' && (
                <ChartCard
                  title="House Electricity Consumption"
                  subtitle="Calculated house usage (Solar Gen + Import - Export) in kWh"
                  data={consumptionChartData}
                  type="bar"
                  yUnit="kWh"
                />
              )}

              {/* Savings Chart */}
              {filter !== 'Today' && (
                <ChartCard
                  title="Earnings & Savings"
                  subtitle={`Valued in ${settings.currency} using tariff settings`}
                  data={savingsChartData}
                  type="bar"
                  yUnit={settings.currency}
                />
              )}

              {/* Self-consumption percentage chart */}
              {filter !== 'Today' && (
                <ChartCard
                  title="Self-Consumption %"
                  subtitle="Percentage of solar energy offset by home usage directly"
                  data={selfConsumptionChartData}
                  type="bar"
                  yUnit="%"
                />
              )}
            </View>
          )}

          {/* History log logs list (excluding 'Year' view which is grouped) */}
          {filter !== 'Year' && listLogs.length > 0 && (
            <View style={styles.logSection}>
              <ThemedText type="smallBold" style={[styles.logTitle, { color: colors.primary }]}>
                Daily Readings Log ({listLogs.length})
              </ThemedText>
              
              <View style={styles.logHeaderRow}>
                <ThemedText type="code" themeColor="textSecondary">Date</ThemedText>
                <ThemedText type="code" themeColor="textSecondary">Solar/Usage</ThemedText>
                <ThemedText type="code" themeColor="textSecondary">Savings</ThemedText>
              </View>

              {listLogs.map((log) => (
                <Pressable
                  key={log.id}
                  style={({ pressed }) => [styles.logRow, pressed && { opacity: 0.7 }]}
                  onPress={() => router.push(`/reading/${log.id}`)}
                >
                  <View>
                    <ThemedText type="smallBold">
                      {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                    </ThemedText>
                    {log.notes && (
                      <ThemedText type="code" themeColor="textSecondary" numberOfLines={1} style={{ fontSize: 10, maxWidth: 100 }}>
                        {log.notes}
                      </ThemedText>
                    )}
                  </View>
                  
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText type="default" style={{ fontSize: 13 }}>
                      ☀️ {log.solarGenerated.toFixed(1)} | 🏠 {log.houseConsumption.toFixed(1)}
                    </ThemedText>
                    <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>
                      ⬇️ {log.gridImport.toFixed(1)} | ⬆️ {log.gridExport.toFixed(1)}
                    </ThemedText>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    <ThemedText type="smallBold" style={{ color: colors.primary }}>
                      {settings.currency}{Math.round(log.moneySaved)}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

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
  filterContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: Spacing.one,
    marginVertical: Spacing.one,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDateCard: {
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.15)',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
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
    gap: Spacing.two,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyCard: {
    height: 150,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  toggleChartCard: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: 4,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  toggleBtnGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logSection: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  logTitle: {
    fontSize: 15,
    marginBottom: Spacing.one,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(128, 128, 128, 0.03)',
    borderRadius: 12,
  },
});
