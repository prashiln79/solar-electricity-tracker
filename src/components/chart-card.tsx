import React, { useState } from 'react';
import { StyleSheet, View, useColorScheme, Pressable } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface ChartDataPoint {
  label: string;
  value: number;
  displayValue?: string;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  type: 'line' | 'bar'; // 'line' is rendered as a smooth high-density hourly solar curve; 'bar' as monthly blocks
  yUnit: string;
}

export function ChartCard({ title, subtitle, data, type, yUnit }: ChartCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1); // Avoid division by zero

  const handlePressPoint = (point: ChartDataPoint) => {
    setSelectedPoint(point === selectedPoint ? null : point);
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View>
          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText type="code" themeColor="textSecondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          )}
        </View>
        {selectedPoint && (
          <View style={[styles.tooltip, { backgroundColor: colors.primaryLight }]}>
            <ThemedText type="code" style={{ color: colors.primary, fontSize: 11 }}>
              {selectedPoint.label}: {selectedPoint.value} {yUnit}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        {type === 'line' ? (
          // Hourly Bell Curve (Rendered as dense solar power bars)
          <View style={styles.hourlyChart}>
            {data.map((item, idx) => {
              const heightPercent = `${(item.value / maxValue) * 80 + 5}%` as any; // Leave room at top
              const isSelected = selectedPoint?.label === item.label;

              return (
                <Pressable
                  key={idx}
                  style={styles.hourlyColumn}
                  onPress={() => handlePressPoint(item)}
                >
                  <View
                    style={[
                      styles.hourlyBar,
                      {
                        height: heightPercent,
                        backgroundColor: isSelected ? colors.primary : colors.accent,
                        opacity: isSelected ? 1 : 0.8,
                      },
                    ]}
                  />
                  {/* Render sparse labels for hourly view */}
                  {(idx % 3 === 0 || idx === data.length - 1) && (
                    <ThemedText type="code" themeColor="textSecondary" style={styles.xAxisLabel}>
                      {item.label}
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          // Monthly/Yearly Blocks
          <View style={styles.barChart}>
            {data.map((item, idx) => {
              const heightPercent = `${(item.value / maxValue) * 75 + 5}%` as any;
              const isSelected = selectedPoint?.label === item.label;

              return (
                <Pressable
                  key={idx}
                  style={styles.barColumn}
                  onPress={() => handlePressPoint(item)}
                >
                  <ThemedText type="code" themeColor="textSecondary" style={styles.barValueText}>
                    {item.value.toFixed(0)}
                  </ThemedText>
                  <View
                    style={[
                      styles.barItem,
                      {
                        height: heightPercent,
                        backgroundColor: isSelected ? colors.accent : colors.primary,
                        opacity: isSelected ? 1 : 0.85,
                      },
                    ]}
                  />
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.xAxisLabel}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      
      <View style={styles.yAxisGuide}>
        <View style={styles.guideLine} />
        <ThemedText type="code" themeColor="textSecondary" style={styles.guideText}>
          Max: {maxValue.toFixed(1)} {yUnit}
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
    alignItems: 'flex-start',
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 12,
    marginTop: Spacing.half,
  },
  tooltip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
  },
  chartContainer: {
    height: 180,
    justifyContent: 'flex-end',
    marginBottom: Spacing.two,
  },
  hourlyChart: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  hourlyColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hourlyBar: {
    width: '70%',
    minWidth: 4,
    maxWidth: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barChart: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.one,
  },
  barItem: {
    width: '60%',
    maxWidth: 28,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '600',
  },
  xAxisLabel: {
    fontSize: 10,
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  yAxisGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    paddingTop: Spacing.two,
  },
  guideLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
  },
  guideText: {
    fontSize: 10,
    marginLeft: Spacing.two,
  },
});
