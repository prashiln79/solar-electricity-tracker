import React from 'react';
import { StyleSheet, View, useColorScheme, Pressable } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface StatusCardProps {
  status: 'Online' | 'Offline';
  capacity: number;
  currentPower: number;
  lastUpdated: string;
  onRefresh?: () => void;
}

export function StatusCard({ status, capacity, currentPower, lastUpdated, onRefresh }: StatusCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  const isOnline = status === 'Online';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={[styles.dot, { backgroundColor: isOnline ? '#2ECC71' : '#E74C3C' }]} />
          <ThemedText type="smallBold" style={{ color: isOnline ? colors.primary : colors.error }}>
            Inverter {status}
          </ThemedText>
        </View>
        
        {onRefresh && (
          <Pressable style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]} onPress={onRefresh}>
            <ThemedText type="code" style={{ color: colors.primary }}>
              🔄 Refresh
            </ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <ThemedText type="small" themeColor="textSecondary">
            Plant Capacity
          </ThemedText>
          <ThemedText type="default" style={styles.metricVal}>
            {capacity} kW
          </ThemedText>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.gridCol}>
          <ThemedText type="small" themeColor="textSecondary">
            Current Generation
          </ThemedText>
          <ThemedText type="default" style={[styles.metricVal, { color: colors.accent }]}>
            {currentPower} kW
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText type="code" themeColor="textSecondary" style={styles.footerText}>
          Last updated: {lastUpdated}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 20,
    alignSelf: 'stretch',
    marginVertical: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  refreshBtn: {
    padding: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  gridCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    paddingTop: Spacing.two,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
  },
});
