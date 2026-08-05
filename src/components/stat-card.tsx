import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: string; // Emoji or Icon character
  type?: 'primary' | 'accent' | 'info' | 'error';
  subtitle?: string;
}

export function StatCard({ title, value, unit, icon, type = 'primary', subtitle }: StatCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  // Map card type to background and text colors
  const typeColors = {
    primary: {
      bg: colors.primaryLight,
      text: colors.primary,
    },
    accent: {
      bg: colors.accentLight,
      text: colors.accent,
    },
    info: {
      bg: colors.infoLight,
      text: colors.info,
    },
    error: {
      bg: colors.errorLight,
      text: colors.error,
    },
  };

  const selectedColors = typeColors[type];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: selectedColors.bg }]}>
          <ThemedText style={[styles.icon, { color: selectedColors.text }]}>{icon}</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
      </View>
      <View style={styles.valueContainer}>
        <ThemedText type="subtitle" style={styles.value}>
          {value}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.unit}>
          {unit}
        </ThemedText>
      </View>
      {subtitle && (
        <ThemedText type="code" themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 20,
    flex: 1,
    minWidth: 140,
    margin: Spacing.one,
    // Material Design 3 elevation / shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    fontSize: 13,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: Spacing.one,
    fontSize: 11,
  },
});
