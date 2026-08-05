import React, { useEffect } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatCard } from '@/components/stat-card';
import { StatusCard } from '@/components/status-card';

export default function HomeScreen() {
  const { settings, data, refreshData } = useAppContext();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  // Calculate Net Energy (Import - Export)
  const netEnergy = Math.round((data.gridImport - data.gridExport) * 10) / 10;
  const isNetExport = netEnergy < 0;
  
  // Set up periodic live simulation checks (every 10 seconds, minor fluctuations to current power kW)
  useEffect(() => {
    const timer = setInterval(() => {
      refreshData();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header Dashboard section */}
          <View style={styles.header}>
            <View>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                🏠 Solar Tracker
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Live Rooftop Solar Dashboard
              </ThemedText>
            </View>
            <View style={[styles.stateBadge, { backgroundColor: colors.primaryLight }]}>
              <ThemedText type="smallBold" style={{ color: colors.primary, fontSize: 12 }}>
                📍 {settings.selectedState}
              </ThemedText>
            </View>
          </View>

          {/* Real-time Inverter Online card */}
          <StatusCard 
            status={data.status}
            capacity={settings.solarCapacity}
            currentPower={data.currentPower}
            lastUpdated={data.lastUpdated}
            onRefresh={refreshData}
          />

          {/* Grid of Solar Metrics */}
          <View style={styles.gridHeader}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.primary }]}>
              Today's Energy Balance
            </ThemedText>
          </View>

          <View style={styles.grid}>
            <StatCard 
              title="Today's Generation"
              value={data.todayGeneration}
              unit="kWh"
              icon="☀️"
              type="accent"
              subtitle={`Est. solar yield`}
            />
            <StatCard 
              title="Current Power"
              value={data.currentPower}
              unit="kW"
              icon="⚡"
              type="accent"
              subtitle={`Live inverter output`}
            />
          </View>

          <View style={styles.grid}>
            <StatCard 
              title="House Usage"
              value={data.houseUsage}
              unit="kWh"
              icon="🏠"
              type="info"
              subtitle={`Home consumption`}
            />
            <StatCard 
              title="Savings Today"
              value={`₹${data.savingsToday}`}
              unit=""
              icon="💰"
              type="primary"
              subtitle={`Net saved today`}
            />
          </View>

          <View style={styles.grid}>
            <StatCard 
              title="Grid Export"
              value={data.gridExport}
              unit="kWh"
              icon="⬆️"
              type="primary"
              subtitle={`Sent to Grid`}
            />
            <StatCard 
              title="Grid Import"
              value={data.gridImport}
              unit="kWh"
              icon="⬇️"
              type="error"
              subtitle={`Pulled from Grid`}
            />
          </View>

          {/* Net Energy Status banner */}
          <ThemedView type="backgroundElement" style={styles.netCard}>
            <View style={styles.netHeader}>
              <ThemedText type="smallBold">
                Net Energy (Import - Export)
              </ThemedText>
              <View style={[
                styles.netBadge, 
                { backgroundColor: isNetExport ? 'rgba(46, 204, 113, 0.1)' : 'rgba(31, 97, 141, 0.1)' }
              ]}>
                <ThemedText type="code" style={{ color: isNetExport ? colors.primary : colors.info, fontWeight: '700' }}>
                  {isNetExport ? '🟢 Net Exporter' : '🔵 Net Importer'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.netValueRow}>
              <ThemedText type="subtitle" style={[styles.netVal, { color: isNetExport ? colors.primary : colors.info }]}>
                {Math.abs(netEnergy)} kWh
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary" style={styles.netDetails}>
                {isNetExport 
                  ? `Your home is generated-surplus! You exported ${Math.abs(netEnergy)} kWh more than you consumed.` 
                  : `Your consumption exceeded solar production by ${netEnergy} kWh, metered from the grid.`
                }
              </ThemedText>
            </View>
          </ThemedView>

          {/* Footer space */}
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
  stateBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridHeader: {
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginHorizontal: -Spacing.one, // Offset card margins
  },
  netCard: {
    padding: Spacing.three,
    borderRadius: 20,
    marginTop: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  netHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  netBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 8,
  },
  netValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  netVal: {
    fontSize: 28,
    fontWeight: '800',
  },
  netDetails: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
