import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChartCard } from '@/components/chart-card';

type HistoryPeriod = 'Day' | 'Month' | 'Year';

export default function HistoryScreen() {
  const { settings, data } = useAppContext();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const [activePeriod, setActivePeriod] = useState<HistoryPeriod>('Day');

  // Scale factor based on user's solar plant capacity settings
  const scale = settings.solarCapacity / 5.0;

  // 1. Day Data (Hourly bell curve)
  const hourlyData = [
    { label: '06:00', value: Math.round(0.1 * scale * 10) / 10 },
    { label: '07:00', value: Math.round(0.4 * scale * 10) / 10 },
    { label: '08:00', value: Math.round(1.1 * scale * 10) / 10 },
    { label: '09:00', value: Math.round(1.9 * scale * 10) / 10 },
    { label: '10:00', value: Math.round(2.6 * scale * 10) / 10 },
    { label: '11:00', value: Math.round(3.2 * scale * 10) / 10 },
    { label: '12:00', value: Math.round(3.6 * scale * 10) / 10 }, // Peak
    { label: '13:00', value: Math.round(3.5 * scale * 10) / 10 },
    { label: '14:00', value: Math.round(3.0 * scale * 10) / 10 },
    { label: '15:00', value: Math.round(2.2 * scale * 10) / 10 },
    { label: '16:00', value: Math.round(1.4 * scale * 10) / 10 },
    { label: '17:00', value: Math.round(0.6 * scale * 10) / 10 },
    { label: '18:00', value: Math.round(0.1 * scale * 10) / 10 },
  ];

  // 2. Month Data (Past 6 months generation)
  const monthlyData = [
    { label: 'Feb', value: Math.round(380 * scale) },
    { label: 'Mar', value: Math.round(480 * scale) },
    { label: 'Apr', value: Math.round(540 * scale) },
    { label: 'May', value: Math.round(590 * scale) },
    { label: 'Jun', value: Math.round(390 * scale) }, // Monsoon begins
    { label: 'Jul', value: Math.round(360 * scale) }, // Monsoon peak
  ];

  // 3. Year Data (Past 4 years generation)
  const yearlyData = [
    { label: '2023', value: Math.round(4800 * scale) },
    { label: '2024', value: Math.round(5300 * scale) },
    { label: '2025', value: Math.round(5700 * scale) },
    { label: '2026', value: Math.round(3400 * scale) }, // YTD
  ];

  // List of history logs underneath
  const renderLogItems = () => {
    if (activePeriod === 'Day') {
      return (
        <View style={styles.logList}>
          <ThemedText type="smallBold" style={[styles.logListTitle, { color: colors.primary }]}>
            Hourly Solar Intensity
          </ThemedText>
          <View style={styles.logHeaderRow}>
            <ThemedText type="code" themeColor="textSecondary">Time</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">Power Output</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">Inverter Temp</ThemedText>
          </View>
          {hourlyData.slice(4, 11).map((item, idx) => (
            <View key={idx} style={styles.logRow}>
              <ThemedText type="default" style={styles.logLabel}>{item.label}</ThemedText>
              <ThemedText type="smallBold">{item.value} kW</ThemedText>
              <ThemedText type="code" themeColor="textSecondary">{(32 + (item.value * 2.5)).toFixed(1)}°C</ThemedText>
            </View>
          ))}
        </View>
      );
    } else if (activePeriod === 'Month') {
      return (
        <View style={styles.logList}>
          <ThemedText type="smallBold" style={[styles.logListTitle, { color: colors.primary }]}>
            Monthly Savings Breakup
          </ThemedText>
          <View style={styles.logHeaderRow}>
            <ThemedText type="code" themeColor="textSecondary">Month</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">Generation</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">Est. Savings</ThemedText>
          </View>
          {[...monthlyData].reverse().map((item, idx) => {
            // Assume 75% was used to offset home (import tariff rate) and 25% exported (export tariff rate)
            const offestSavings = item.value * 0.7 * settings.electricityTariff;
            const exportSavings = item.value * 0.3 * settings.exportTariff;
            const totalSaved = Math.round(offestSavings + exportSavings);

            return (
              <View key={idx} style={styles.logRow}>
                <ThemedText type="default" style={styles.logLabel}>{item.label} 2026</ThemedText>
                <ThemedText type="smallBold">{item.value} kWh</ThemedText>
                <ThemedText type="smallBold" style={{ color: colors.primary }}>₹{totalSaved.toLocaleString('en-IN')}</ThemedText>
              </View>
            );
          })}
        </View>
      );
    } else {
      return (
        <View style={styles.logList}>
          <ThemedText type="smallBold" style={[styles.logListTitle, { color: colors.primary }]}>
            Annual Performance Records
          </ThemedText>
          <View style={styles.logHeaderRow}>
            <ThemedText type="code" themeColor="textSecondary">Year</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">Solar Yield</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">Total Savings</ThemedText>
          </View>
          {[...yearlyData].reverse().map((item, idx) => {
            const totalSaved = Math.round(
              item.value * 0.7 * settings.electricityTariff + 
              item.value * 0.3 * settings.exportTariff
            );

            return (
              <View key={idx} style={styles.logRow}>
                <ThemedText type="default" style={styles.logLabel}>{item.label}</ThemedText>
                <ThemedText type="smallBold">{item.value.toLocaleString('en-IN')} kWh</ThemedText>
                <ThemedText type="smallBold" style={{ color: colors.primary }}>₹{totalSaved.toLocaleString('en-IN')}</ThemedText>
              </View>
            );
          })}
        </View>
      );
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
              📊 History
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Solar plant generation history log
            </ThemedText>
          </View>

          {/* Segment Selector tabs */}
          <View style={[styles.segmentContainer, { backgroundColor: colors.backgroundElement }]}>
            {(['Day', 'Month', 'Year'] as HistoryPeriod[]).map((period) => {
              const isActive = activePeriod === period;
              return (
                <Pressable
                  key={period}
                  style={[
                    styles.segmentButton,
                    isActive && { backgroundColor: colors.backgroundSelected }
                  ]}
                  onPress={() => setActivePeriod(period)}
                >
                  <ThemedText 
                    type="smallBold" 
                    themeColor={isActive ? 'primary' : 'textSecondary'}
                    style={isActive && { color: colors.primary }}
                  >
                    {period}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Dynamic Chart card based on selected tab */}
          {activePeriod === 'Day' && (
            <ChartCard
              title="Today's Power Output Curve"
              subtitle={`Bell curve (Peak: ${Math.round(3.6 * scale * 10) / 10} kW at 12:00 PM)`}
              data={hourlyData}
              type="line"
              yUnit="kW"
            />
          )}

          {activePeriod === 'Month' && (
            <ChartCard
              title="Monthly Solar Generation"
              subtitle={`Past 6 Months (Total: ${Math.round(2560 * scale)} kWh)`}
              data={monthlyData}
              type="bar"
              yUnit="kWh"
            />
          )}

          {activePeriod === 'Year' && (
            <ChartCard
              title="Annual Generation Summary"
              subtitle={`Year-on-Year Growth Yield`}
              data={yearlyData}
              type="bar"
              yUnit="kWh"
            />
          )}

          {/* Historical Logs List */}
          {renderLogItems()}

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
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: Spacing.one,
    marginVertical: Spacing.one,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logList: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  logListTitle: {
    fontSize: 15,
    marginBottom: Spacing.two,
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
    marginVertical: 2,
  },
  logLabel: {
    fontWeight: '600',
  },
});
