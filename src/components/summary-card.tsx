import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface SummaryCardProps {
  lifetimeSavings: number;
  billSavingsPercent: number;
  co2Reduced: number;
  treesEquivalent: number;
}

export function SummaryCard({ lifetimeSavings, billSavingsPercent, co2Reduced, treesEquivalent }: SummaryCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="smallBold" style={{ color: colors.primary }}>
          🌱 Lifetime Impact
        </ThemedText>
        <View style={styles.badge}>
          <ThemedText type="code" style={{ color: colors.primary, fontSize: 11 }}>
            Net Meter Active
          </ThemedText>
        </View>
      </View>

      <View style={styles.mainValueSection}>
        <ThemedText type="small" themeColor="textSecondary">
          Total Lifetime Savings
        </ThemedText>
        <ThemedText type="subtitle" style={[styles.mainValue, { color: colors.primary }]}>
          ₹{lifetimeSavings.toLocaleString('en-IN')}
        </ThemedText>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <ThemedText style={styles.gridIcon}>⚡</ThemedText>
          <View style={styles.gridDetails}>
            <ThemedText type="small" themeColor="textSecondary">
              Bill Saved
            </ThemedText>
            <ThemedText type="default" style={styles.gridValue}>
              ~{billSavingsPercent}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.gridItem}>
          <ThemedText style={styles.gridIcon}>💨</ThemedText>
          <View style={styles.gridDetails}>
            <ThemedText type="small" themeColor="textSecondary">
              CO₂ Reduced
            </ThemedText>
            <ThemedText type="default" style={styles.gridValue}>
              {co2Reduced.toLocaleString('en-IN')} kg
            </ThemedText>
          </View>
        </View>

        <View style={styles.gridItem}>
          <ThemedText style={styles.gridIcon}>🌳</ThemedText>
          <View style={styles.gridDetails}>
            <ThemedText type="small" themeColor="textSecondary">
              Trees Saved
            </ThemedText>
            <ThemedText type="default" style={styles.gridValue}>
              {treesEquivalent} trees
            </ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: 24,
    alignSelf: 'stretch',
    marginVertical: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  badge: {
    backgroundColor: 'rgba(27, 94, 32, 0.08)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mainValueSection: {
    alignItems: 'center',
    marginVertical: Spacing.two,
  },
  mainValue: {
    fontSize: 36,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  grid: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    padding: Spacing.two,
    borderRadius: 16,
    gap: Spacing.three,
  },
  gridIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  gridDetails: {
    flex: 1,
  },
  gridValue: {
    fontWeight: '700',
    fontSize: 15,
  },
});
