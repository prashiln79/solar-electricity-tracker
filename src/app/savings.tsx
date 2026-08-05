import React from 'react';
import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatCard } from '@/components/stat-card';
import { SummaryCard } from '@/components/summary-card';

export default function SavingsScreen() {
  const { settings, data } = useAppContext();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  // Grid electricity cost comparison (simulated)
  // Monthly bill without solar: (House usage 9.4kWh * 30 days) * tariff = ~282kWh * ₹7.5 = ₹2,115
  // Monthly bill with solar: offset of self consumption + export income.
  const monthlyBillNoSolar = Math.round(data.houseUsage * 30 * settings.electricityTariff);
  // Monthly solar offset savings: data.savingsMonth
  const monthlyBillWithSolar = Math.max(0, monthlyBillNoSolar - data.savingsMonth);
  const percentageBillSaved = Math.round((data.savingsMonth / monthlyBillNoSolar) * 100);

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
              💰 Savings
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your financial and environmental return on investment
            </ThemedText>
          </View>

          {/* Premium Environmental & Cumulative Impact Summary Card */}
          <SummaryCard 
            lifetimeSavings={data.savingsLifetime}
            billSavingsPercent={percentageBillSaved}
            co2Reduced={data.co2Reduced}
            treesEquivalent={data.treesEquivalent}
          />

          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.primary }]}>
              Financial Earnings (Net Metered)
            </ThemedText>
          </View>

          {/* Savings Grid Cards */}
          <View style={styles.grid}>
            <StatCard 
              title="Today's Savings"
              value={`₹${data.savingsToday}`}
              unit=""
              icon="💰"
              type="primary"
              subtitle={`Offset & Export credits`}
            />
            <StatCard 
              title="This Month"
              value={`₹${data.savingsMonth.toLocaleString('en-IN')}`}
              unit=""
              icon="📆"
              type="primary"
              subtitle={`Cumulative credit`}
            />
          </View>

          <View style={styles.grid}>
            <StatCard 
              title="Lifetime Savings"
              value={`₹${data.savingsLifetime.toLocaleString('en-IN')}`}
              unit=""
              icon="🏆"
              type="accent"
              subtitle={`Total system return`}
            />
            <StatCard 
              title="Electricity Saved"
              value={`₹${Math.round(data.totalGeneration * settings.electricityTariff).toLocaleString('en-IN')}`}
              unit=""
              icon="⚡"
              type="info"
              subtitle={`Valued at import rate`}
            />
          </View>

          {/* Bill Comparison Card */}
          <ThemedView type="backgroundElement" style={styles.comparisonCard}>
            <ThemedText type="smallBold" style={{ color: colors.primary, marginBottom: Spacing.two }}>
              📊 Average Monthly Bill Comparison
            </ThemedText>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonLabelCol}>
                <ThemedText type="small" themeColor="textSecondary">Without Solar</ThemedText>
                <ThemedText type="default" style={styles.billValue}>₹{monthlyBillNoSolar.toLocaleString('en-IN')}</ThemedText>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBar, { width: '100%', backgroundColor: colors.error }]} />
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonLabelCol}>
                <ThemedText type="small" style={{ color: colors.primary }}>With Solar (Net Metered)</ThemedText>
                <ThemedText type="default" style={[styles.billValue, { color: colors.primary }]}>
                  ₹{monthlyBillWithSolar.toLocaleString('en-IN')}
                </ThemedText>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBar, { width: `${100 - percentageBillSaved}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>

            <ThemedText type="code" themeColor="textSecondary" style={styles.comparisonHint}>
              🎉 Your net-metering setup cuts your average monthly electricity bill by {percentageBillSaved}%!
            </ThemedText>
          </ThemedView>

          {/* Environmental Offset Details */}
          <ThemedView type="backgroundElement" style={styles.ecoCard}>
            <View style={styles.ecoHeader}>
              <ThemedText style={{ fontSize: 26 }}>🌳</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText type="default" style={{ fontWeight: '700' }}>
                  Your Carbon Footprint Reduction
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary">
                  Indian Grid Average: 0.82 kg CO₂/kWh offset
                </ThemedText>
              </View>
            </View>
            <ThemedText type="code" themeColor="textSecondary" style={styles.ecoDetails}>
              By generating clean solar energy instead of drawing from the state coal-powered grid, you have offset **{data.co2Reduced.toLocaleString('en-IN')} kg** of CO₂ emissions. This is equivalent to growing **{data.treesEquivalent} mature trees** over a 10-year period. Keep shining!
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
  sectionHeader: {
    marginTop: Spacing.one,
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
  comparisonCard: {
    padding: Spacing.three,
    borderRadius: 20,
    marginTop: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.one,
    gap: Spacing.three,
  },
  comparisonLabelCol: {
    width: 140,
  },
  billValue: {
    fontWeight: '700',
    fontSize: 16,
    marginTop: 2,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  comparisonHint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: Spacing.two,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    paddingTop: Spacing.two,
  },
  ecoCard: {
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(46, 204, 113, 0.25)',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  ecoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  ecoDetails: {
    fontSize: 11,
    lineHeight: 16,
  },
});
