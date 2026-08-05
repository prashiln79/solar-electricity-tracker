import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useEnergyStore } from '@/store/useEnergyStore';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

interface AddReadingFormData {
  date: string;
  solarGenerated: string;
  gridImport: string;
  gridExport: string;
  notes: string;
}

export default function AddReadingScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const { addReading, readings } = useEnergyStore();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Default to today's date in YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('sv-SE');

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<AddReadingFormData>({
    defaultValues: {
      date: todayStr,
      solarGenerated: '',
      gridImport: '',
      gridExport: '',
      notes: '',
    }
  });

  // Watch values to display real-time calculated house consumption estimate
  const watchedSolar = watch('solarGenerated');
  const watchedImport = watch('gridImport');
  const watchedExport = watch('gridExport');

  const estimatedConsumption = React.useMemo(() => {
    const s = parseFloat(watchedSolar) || 0;
    const i = parseFloat(watchedImport) || 0;
    const e = parseFloat(watchedExport) || 0;
    return Math.max(0, s + i - e);
  }, [watchedSolar, watchedImport, watchedExport]);

  const onSubmit = async (data: AddReadingFormData) => {
    setErrorMessage('');
    setSuccessMessage('');

    const solarVal = parseFloat(data.solarGenerated);
    const importVal = parseFloat(data.gridImport);
    const exportVal = parseFloat(data.gridExport);

    // Simple extra sanity checks
    if (solarVal < 0 || importVal < 0 || exportVal < 0) {
      setErrorMessage('⚠️ Values cannot be negative.');
      return;
    }

    // Check if reading for date already exists
    const dateExists = readings.some((r) => r.date === data.date);
    if (dateExists) {
      setErrorMessage('⚠️ A reading for this date already exists. Edit the existing reading in the Analytics history log instead.');
      return;
    }

    try {
      await addReading(db, {
        date: data.date,
        solarGenerated: solarVal,
        gridImport: importVal,
        gridExport: exportVal,
        notes: data.notes,
      });

      setSuccessMessage('✅ Reading logged successfully!');
      reset({
        date: todayStr,
        solarGenerated: '',
        gridImport: '',
        gridExport: '',
        notes: '',
      });
      
      // Redirect to Home dashboard after delay
      setTimeout(() => {
        setSuccessMessage('');
        router.push('/(tabs)/home');
      }, 1500);

    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || 'Failed to save reading. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1, width: '100%' }}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                ➕ Add Reading
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Manually record daily solar and grid metrics
              </ThemedText>
            </View>

            {/* Error / Success Banners */}
            {errorMessage !== '' && (
              <View style={[styles.banner, { backgroundColor: colors.errorLight }]}>
                <ThemedText type="smallBold" style={{ color: colors.error }}>{errorMessage}</ThemedText>
              </View>
            )}

            {successMessage !== '' && (
              <View style={[styles.banner, { backgroundColor: colors.primaryLight }]}>
                <ThemedText type="smallBold" style={{ color: colors.primary }}>{successMessage}</ThemedText>
              </View>
            )}

            {/* Form Fields */}
            <ThemedView type="backgroundElement" style={styles.card}>
              
              {/* Date Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Date (YYYY-MM-DD)</ThemedText>
                <Controller
                  control={control}
                  rules={{ 
                    required: 'Date is required', 
                    pattern: {
                      value: /^\d{4}-\d{2}-\d{2}$/,
                      message: 'Date must be in YYYY-MM-DD format'
                    }
                  }}
                  name="date"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="e.g. 2026-08-05"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                {errors.date && (
                  <ThemedText type="code" style={{ color: colors.error }}>{errors.date.message}</ThemedText>
                )}
              </View>

              {/* Solar Generated Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Solar Generated (kWh)</ThemedText>
                <Controller
                  control={control}
                  rules={{ 
                    required: 'Solar generation value is required',
                    validate: val => !isNaN(parseFloat(val)) || 'Must be a valid number'
                  }}
                  name="solarGenerated"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      placeholder="e.g. 18.5"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                {errors.solarGenerated && (
                  <ThemedText type="code" style={{ color: colors.error }}>{errors.solarGenerated.message}</ThemedText>
                )}
              </View>

              {/* Grid Import Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Grid Import (kWh)</ThemedText>
                <Controller
                  control={control}
                  rules={{ 
                    required: 'Grid import value is required',
                    validate: val => !isNaN(parseFloat(val)) || 'Must be a valid number'
                  }}
                  name="gridImport"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      placeholder="e.g. 4.2"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                {errors.gridImport && (
                  <ThemedText type="code" style={{ color: colors.error }}>{errors.gridImport.message}</ThemedText>
                )}
              </View>

              {/* Grid Export Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Grid Export (kWh)</ThemedText>
                <Controller
                  control={control}
                  rules={{ 
                    required: 'Grid export value is required',
                    validate: val => !isNaN(parseFloat(val)) || 'Must be a valid number'
                  }}
                  name="gridExport"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      placeholder="e.g. 12.1"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                {errors.gridExport && (
                  <ThemedText type="code" style={{ color: colors.error }}>{errors.gridExport.message}</ThemedText>
                )}
              </View>

              {/* Notes Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Notes (Optional)</ThemedText>
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
                      numberOfLines={3}
                      placeholder="e.g. Sunny day, ran AC in afternoon"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
              </View>

              {/* Automatic Calculation Preview banner */}
              <View style={[styles.calcBanner, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="calculator-outline" size={18} color={colors.info} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="code" style={{ color: colors.info, fontWeight: '700' }}>
                    Calculated House Consumption Estimate:
                  </ThemedText>
                  <ThemedText type="subtitle" style={{ color: colors.info, fontSize: 20, marginTop: 2 }}>
                    {estimatedConsumption.toFixed(1)} kWh
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 2 }}>
                    Formula: Solar Generated + Grid Import − Grid Export
                  </ThemedText>
                </View>
              </View>
            </ThemedView>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <Pressable 
                style={[styles.btn, styles.cancelBtn, { borderColor: colors.textSecondary }]}
                onPress={() => {
                  reset();
                  router.push('/(tabs)/home');
                }}
              >
                <ThemedText type="smallBold" themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>

              <Pressable 
                style={[styles.btn, styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit(onSubmit)}
              >
                <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Save Reading</ThemedText>
              </Pressable>
            </View>

            <View style={{ height: Spacing.four }} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  banner: {
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
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
});
