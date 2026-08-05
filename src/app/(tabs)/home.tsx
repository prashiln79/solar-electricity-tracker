import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEnergyStore } from '@/store/useEnergyStore';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

type Period = 'Today' | 'This Month' | 'This Year' | 'Lifetime';

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const { readings, settings } = useEnergyStore();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('This Month');

  // Get current date string in local YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const currentYearStr = todayStr.substring(0, 4); // YYYY

  // Calculate aggregates for today comparison sub-labels
  const todayReading = readings.find((r) => r.date === todayStr);
  const todaySavings = todayReading ? todayReading.moneySaved : 0;
  const todaySolar = todayReading ? todayReading.solarGenerated : 0;
  const todayExport = todayReading ? todayReading.gridExport : 0;
  const todayImport = todayReading ? todayReading.gridImport : 0;

  // Calculate monthly totals for money saved sub-label
  const monthReadings = readings.filter((r) => r.date.startsWith(currentMonthStr));
  const monthSavings = monthReadings.reduce((sum, r) => sum + r.moneySaved, 0);

  // Compute stats based on the selected period
  const periodStats = useMemo(() => {
    let filtered = readings;
    if (selectedPeriod === 'Today') {
      filtered = readings.filter((r) => r.date === todayStr);
    } else if (selectedPeriod === 'This Month') {
      filtered = readings.filter((r) => r.date.startsWith(currentMonthStr));
    } else if (selectedPeriod === 'This Year') {
      filtered = readings.filter((r) => r.date.startsWith(currentYearStr));
    }

    const moneySaved = filtered.reduce((sum, r) => sum + r.moneySaved, 0);
    const solarProduced = filtered.reduce((sum, r) => sum + r.solarGenerated, 0);
    const unitsSent = filtered.reduce((sum, r) => sum + r.gridExport, 0);
    const unitsTaken = filtered.reduce((sum, r) => sum + r.gridImport, 0);

    return {
      moneySaved,
      solarProduced,
      unitsSent,
      unitsTaken,
    };
  }, [readings, selectedPeriod, todayStr, currentMonthStr, currentYearStr]);

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
                Last updated: {lastUpdated}
              </ThemedText>
            </View>
          </View>

          {/* Warning Banner if today's reading is missing */}
          {!todayReading && (
            <ThemedView type="backgroundElement" style={[styles.alertBanner, { borderColor: colors.error }]}>
              <Ionicons name="warning" size={18} color={colors.error} />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={{ color: colors.error }}>
                  No reading logged today
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 11 }}>
                  Tap Add Reading below to enter today's metrics.
                </ThemedText>
              </View>
            </ThemedView>
          )}

          {/* Period Selector Tabs */}
          <View style={[styles.periodContainer, { backgroundColor: colors.backgroundElement }]}>
            {(['Today', 'This Month', 'This Year', 'Lifetime'] as Period[]).map((period) => {
              const isActive = selectedPeriod === period;
              return (
                <Pressable
                  key={period}
                  style={[
                    styles.periodBtn,
                    isActive && { backgroundColor: colors.backgroundSelected }
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <ThemedText 
                    type="smallBold" 
                    style={[styles.periodBtnText, { color: isActive ? colors.primary : colors.textSecondary }]}
                  >
                    {period === 'This Month' ? 'Month' : period === 'This Year' ? 'Year' : period}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Dashboard Grid - Exactly Four Large Cards */}
          <View style={styles.gridContainer}>
            
            {/* 1. Money Saved Card */}
            <ThemedView type="backgroundElement" style={[styles.largeCard, { borderLeftColor: colors.primary }]}>
              <View style={styles.cardHeaderRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">💰 Total Money Saved</ThemedText>
                <Ionicons name="cash" size={20} color={colors.primary} />
              </View>
              <ThemedText type="subtitle" style={[styles.largeValText, { color: colors.primary }]}>
                {settings.currency}{Math.round(periodStats.moneySaved).toLocaleString('en-IN')}
              </ThemedText>
              <View style={styles.subInfoBox}>
                <ThemedText type="code" themeColor="textSecondary">
                  Today {settings.currency}{Math.round(todaySavings)}
                </ThemedText>
                {selectedPeriod === 'Lifetime' && (
                  <ThemedText type="code" themeColor="textSecondary" style={{ marginLeft: 8 }}>
                    • Month {settings.currency}{Math.round(monthSavings).toLocaleString('en-IN')}
                  </ThemedText>
                )}
              </View>
            </ThemedView>

            {/* 2. Solar Produced Card */}
            <ThemedView type="backgroundElement" style={[styles.largeCard, { borderLeftColor: colors.primary }]}>
              <View style={styles.cardHeaderRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">☀️ Total Solar Produced</ThemedText>
                <Ionicons name="sunny" size={20} color={colors.primary} />
              </View>
              <ThemedText type="subtitle" style={[styles.largeValText, { color: colors.primary }]}>
                {Math.round(periodStats.solarProduced).toLocaleString('en-IN')} Units
              </ThemedText>
              <View style={styles.subInfoBox}>
                <ThemedText type="code" themeColor="textSecondary">
                  Today {todaySolar.toFixed(1)} Units
                </ThemedText>
              </View>
            </ThemedView>

            {/* 3. Sent to Grid Card */}
            <ThemedView type="backgroundElement" style={[styles.largeCard, { borderLeftColor: colors.accent }]}>
              <View style={styles.cardHeaderRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">⬆️ Total Units Sent to Grid</ThemedText>
                <Ionicons name="arrow-up-circle" size={20} color={colors.accent} />
              </View>
              <ThemedText type="subtitle" style={[styles.largeValText, { color: colors.accent }]}>
                {Math.round(periodStats.unitsSent).toLocaleString('en-IN')} Units
              </ThemedText>
              <View style={styles.subInfoBox}>
                <ThemedText type="code" themeColor="textSecondary">
                  Today {todayExport.toFixed(1)} Units
                </ThemedText>
              </View>
            </ThemedView>

            {/* 4. Taken from Grid Card */}
            <ThemedView type="backgroundElement" style={[styles.largeCard, { borderLeftColor: colors.info }]}>
              <View style={styles.cardHeaderRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">⬇️ Total Units Taken from Grid</ThemedText>
                <Ionicons name="arrow-down-circle" size={20} color={colors.info} />
              </View>
              <ThemedText type="subtitle" style={[styles.largeValText, { color: colors.info }]}>
                {Math.round(periodStats.unitsTaken).toLocaleString('en-IN')} Units
              </ThemedText>
              <View style={styles.subInfoBox}>
                <ThemedText type="code" themeColor="textSecondary">
                  Today {todayImport.toFixed(1)} Units
                </ThemedText>
              </View>
            </ThemedView>

          </View>

          {/* Quick Actions Row */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={{ color: colors.primary }}>
              ⚡ Quick Actions
            </ThemedText>
          </View>

          <View style={styles.actionsRow}>
            {/* Add Reading */}
            <Pressable 
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(tabs)/add')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <ThemedText type="code" style={styles.actionLabel}>Add Reading</ThemedText>
            </Pressable>

            {/* View History (Takes them to Analytics which has the logs list) */}
            <Pressable 
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="time-outline" size={22} color={colors.primary} />
              </View>
              <ThemedText type="code" style={styles.actionLabel}>View History</ThemedText>
            </Pressable>

            {/* Bills */}
            <Pressable 
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(tabs)/bills')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="receipt-outline" size={22} color={colors.info} />
              </View>
              <ThemedText type="code" style={styles.actionLabel}>Bills</ThemedText>
            </Pressable>

            {/* Analytics */}
            <Pressable 
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="bar-chart-outline" size={22} color={colors.accent} />
              </View>
              <ThemedText type="code" style={styles.actionLabel}>Analytics</ThemedText>
            </Pressable>
          </View>

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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  periodContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: Spacing.one,
    marginVertical: Spacing.one,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodBtnText: {
    fontSize: 12,
  },
  gridContainer: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  largeCard: {
    padding: Spacing.four,
    borderRadius: 20,
    borderLeftWidth: 5,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeValText: {
    fontSize: 28,
    fontWeight: '800',
  },
  subInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    marginTop: Spacing.three,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
    marginTop: Spacing.one,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.one,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
