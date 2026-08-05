import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useEnergyStore } from '@/store/useEnergyStore';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

interface EditReadingFormData {
  date: string;
  solarGenerated: string;
  gridImport: string;
  gridExport: string;
  notes: string;
}

export default function ReadingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { readings, settings, updateReading, deleteReading } = useEnergyStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const readingId = parseInt(id || '', 10);
  const reading = readings.find((r) => r.id === readingId);

  // Initialize form if reading exists
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<EditReadingFormData>({
    values: reading ? {
      date: reading.date,
      solarGenerated: reading.solarGenerated.toString(),
      gridImport: reading.gridImport.toString(),
      gridExport: reading.gridExport.toString(),
      notes: reading.notes || '',
    } : {
      date: '',
      solarGenerated: '',
      gridImport: '',
      gridExport: '',
      notes: '',
    }
  });

  const watchedSolar = watch('solarGenerated');
  const watchedImport = watch('gridImport');
  const watchedExport = watch('gridExport');

  const estimatedConsumption = React.useMemo(() => {
    const s = parseFloat(watchedSolar) || 0;
    const i = parseFloat(watchedImport) || 0;
    const e = parseFloat(watchedExport) || 0;
    return Math.max(0, s + i - e);
  }, [watchedSolar, watchedImport, watchedExport]);

  if (!reading) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <ThemedText type="subtitle" style={{ marginTop: 12 }}>Reading Not Found</ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={{ textAlign: 'center', marginHorizontal: Spacing.four, marginTop: 4 }}>
          The reading log you are trying to view does not exist or has been deleted.
        </ThemedText>
        <Pressable 
          style={[styles.backBtn, { backgroundColor: colors.primary, marginTop: Spacing.three }]}
          onPress={() => router.push('/(tabs)/analytics')}
        >
          <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Back to Analytics</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const onUpdate = async (data: EditReadingFormData) => {
    setFormError('');
    setFormSuccess('');

    const solarVal = parseFloat(data.solarGenerated);
    const importVal = parseFloat(data.gridImport);
    const exportVal = parseFloat(data.gridExport);

    if (solarVal < 0 || importVal < 0 || exportVal < 0) {
      setFormError('⚠️ Values cannot be negative.');
      return;
    }

    // Verify if updating date doesn't collide with another record
    const dateExists = readings.some((r) => r.date === data.date && r.id !== readingId);
    if (dateExists) {
      setFormError('⚠️ A reading for this date already exists.');
      return;
    }

    try {
      await updateReading(db, readingId, {
        date: data.date,
        solarGenerated: solarVal,
        gridImport: importVal,
        gridExport: exportVal,
        notes: data.notes,
      });

      setFormSuccess('✅ Reading updated successfully!');
      setTimeout(() => {
        setFormSuccess('');
        setIsEditing(false);
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setFormError(e.message || 'Failed to update reading.');
    }
  };

  const handleDeleteConfirm = () => {
    // Standard cross-platform alert or direct action
    Alert.alert(
      'Delete Reading Log',
      'Are you sure you want to permanently delete this daily reading log?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReading(db, readingId);
              router.push('/(tabs)/analytics');
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Pressable 
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <ThemedText type="subtitle" style={{ fontSize: 20 }}>
              {isEditing ? 'Edit Reading' : 'Reading Details'}
            </ThemedText>
            {!isEditing ? (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Pressable 
                  style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="pencil-outline" size={22} color={colors.primary} />
                </Pressable>
                <Pressable 
                  style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
                  onPress={handleDeleteConfirm}
                >
                  <Ionicons name="trash-outline" size={22} color={colors.error} />
                </Pressable>
              </View>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* Edit Mode vs Details Mode */}
          {isEditing ? (
            <View style={{ gap: Spacing.three }}>
              {formError !== '' && (
                <View style={[styles.banner, { backgroundColor: colors.errorLight }]}>
                  <ThemedText type="smallBold" style={{ color: colors.error }}>{formError}</ThemedText>
                </View>
              )}

              {formSuccess !== '' && (
                <View style={[styles.banner, { backgroundColor: colors.primaryLight }]}>
                  <ThemedText type="smallBold" style={{ color: colors.primary }}>{formSuccess}</ThemedText>
                </View>
              )}

              <ThemedView type="backgroundElement" style={styles.card}>
                {/* Date */}
                <View style={styles.inputGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary">Date (YYYY-MM-DD)</ThemedText>
                  <Controller
                    control={control}
                    rules={{ 
                      required: 'Date is required',
                      pattern: { value: /^\d{4}-\d{2}-\d{2}$/, message: 'Must be in YYYY-MM-DD' }
                    }}
                    name="date"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.date && <ThemedText type="code" style={{ color: colors.error }}>{errors.date.message}</ThemedText>}
                </View>

                {/* Solar Generated */}
                <View style={styles.inputGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary">Solar Generated (kWh)</ThemedText>
                  <Controller
                    control={control}
                    rules={{ required: 'Required', validate: val => !isNaN(parseFloat(val)) || 'Must be a number' }}
                    name="solarGenerated"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="numeric"
                      />
                    )}
                  />
                  {errors.solarGenerated && <ThemedText type="code" style={{ color: colors.error }}>{errors.solarGenerated.message}</ThemedText>}
                </View>

                {/* Grid Import */}
                <View style={styles.inputGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary">Grid Import (kWh)</ThemedText>
                  <Controller
                    control={control}
                    rules={{ required: 'Required', validate: val => !isNaN(parseFloat(val)) || 'Must be a number' }}
                    name="gridImport"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="numeric"
                      />
                    )}
                  />
                  {errors.gridImport && <ThemedText type="code" style={{ color: colors.error }}>{errors.gridImport.message}</ThemedText>}
                </View>

                {/* Grid Export */}
                <View style={styles.inputGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary">Grid Export (kWh)</ThemedText>
                  <Controller
                    control={control}
                    rules={{ required: 'Required', validate: val => !isNaN(parseFloat(val)) || 'Must be a number' }}
                    name="gridExport"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="numeric"
                      />
                    )}
                  />
                  {errors.gridExport && <ThemedText type="code" style={{ color: colors.error }}>{errors.gridExport.message}</ThemedText>}
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary">Notes</ThemedText>
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, styles.notesInput, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        multiline
                      />
                    )}
                  />
                </View>

                {/* Preview */}
                <View style={[styles.calcBanner, { backgroundColor: colors.infoLight }]}>
                  <Ionicons name="calculator" size={18} color={colors.info} />
                  <ThemedText type="code" style={{ color: colors.info }}>
                    Consumption estimate: {estimatedConsumption.toFixed(1)} kWh
                  </ThemedText>
                </View>
              </ThemedView>

              {/* Form Buttons */}
              <View style={styles.formBtnRow}>
                <Pressable 
                  style={[styles.btn, styles.cancelBtn, { borderColor: colors.textSecondary }]}
                  onPress={() => {
                    setIsEditing(false);
                    reset();
                  }}
                >
                  <ThemedText type="smallBold" themeColor="textSecondary">Cancel</ThemedText>
                </Pressable>

                <Pressable 
                  style={[styles.btn, styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSubmit(onUpdate)}
                >
                  <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Save Changes</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={{ gap: Spacing.three }}>
              
              {/* Date Card */}
              <ThemedView type="backgroundElement" style={styles.detailCard}>
                <ThemedText type="code" themeColor="textSecondary">LOG DATE</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 24, fontWeight: '800', marginTop: 4 }}>
                  {new Date(reading.date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </ThemedText>
              </ThemedView>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                {/* Solar */}
                <View style={[styles.metricBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <ThemedText style={styles.boxEmoji}>☀️</ThemedText>
                  <ThemedText type="code" style={{ color: colors.primary }}>Solar Yield</ThemedText>
                  <ThemedText type="subtitle" style={{ color: colors.primary }}>{reading.solarGenerated.toFixed(1)} kWh</ThemedText>
                </View>

                {/* Consumption */}
                <View style={[styles.metricBox, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
                  <ThemedText style={styles.boxEmoji}>🏠</ThemedText>
                  <ThemedText type="code" style={{ color: colors.info }}>Home Usage</ThemedText>
                  <ThemedText type="subtitle" style={{ color: colors.info }}>{reading.houseConsumption.toFixed(1)} kWh</ThemedText>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                {/* Import */}
                <View style={[styles.metricBox, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
                  <ThemedText style={styles.boxEmoji}>⬇️</ThemedText>
                  <ThemedText type="code" style={{ color: colors.info }}>Grid Import</ThemedText>
                  <ThemedText type="subtitle" style={{ color: colors.info }}>{reading.gridImport.toFixed(1)} kWh</ThemedText>
                </View>

                {/* Export */}
                <View style={[styles.metricBox, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
                  <ThemedText style={styles.boxEmoji}>⬆️</ThemedText>
                  <ThemedText type="code" style={{ color: colors.accent }}>Grid Export</ThemedText>
                  <ThemedText type="subtitle" style={{ color: colors.accent }}>{reading.gridExport.toFixed(1)} kWh</ThemedText>
                </View>
              </View>

              {/* Financial Returns */}
              <ThemedView type="backgroundElement" style={styles.detailsBlockCard}>
                <ThemedText type="smallBold" style={{ color: colors.primary }}>Financial Benefits</ThemedText>
                <View style={styles.benefitRow}>
                  <View>
                    <ThemedText type="code" themeColor="textSecondary">Solar Offset Tariff</ThemedText>
                    <ThemedText type="smallBold">{settings.currency}{settings.tariff.toFixed(2)} / kWh</ThemedText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText type="code" themeColor="textSecondary">Estimated Saved Value</ThemedText>
                    <ThemedText type="subtitle" style={{ color: colors.primary }}>
                      {settings.currency}{reading.moneySaved.toFixed(2)}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 4 }}>
                  Calculation: (Solar Generated − Grid Export) × Tariff
                </ThemedText>
              </ThemedView>

              {/* Notes */}
              {reading.notes && (
                <ThemedView type="backgroundElement" style={styles.detailsBlockCard}>
                  <ThemedText type="smallBold" themeColor="textSecondary">Daily Journal Notes</ThemedText>
                  <ThemedText type="default" style={{ marginTop: 6, fontStyle: 'italic', lineHeight: 20 }}>
                    "{reading.notes}"
                  </ThemedText>
                </ThemedView>
              )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  backBtn: {
    height: 44,
    paddingHorizontal: Spacing.four,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    padding: Spacing.two,
    borderRadius: 12,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.three,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    fontWeight: '600',
  },
  notesInput: {
    height: 80,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  calcBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: 10,
    gap: Spacing.two,
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  saveBtn: {
    elevation: 2,
  },
  detailCard: {
    padding: Spacing.four,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metricBox: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  boxEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  detailsBlockCard: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  benefitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  aboutText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
