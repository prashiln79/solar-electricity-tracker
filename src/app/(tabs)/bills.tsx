import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useEnergyStore } from '@/store/useEnergyStore';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

interface BillFormData {
  month: string; // YYYY-MM
  amount: string;
  importedUnits: string;
  exportedUnits: string;
  notes: string;
}

export default function BillsScreen() {
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { bills, readings, settings, addBill, deleteBill } = useEnergyStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const currentYearStr = new Date().getFullYear().toString();

  // Form setup
  const currentMonthStr = new Date().toLocaleDateString('sv-SE').substring(0, 7); // YYYY-MM
  const { control, handleSubmit, reset, formState: { errors } } = useForm<BillFormData>({
    defaultValues: {
      month: currentMonthStr,
      amount: '',
      importedUnits: '',
      exportedUnits: '',
      notes: '',
    }
  });

  // Calculate Annual Metrics (Current Year)
  const currentYearBills = bills.filter((b) => b.month.startsWith(currentYearStr));
  const totalAnnualBill = currentYearBills.reduce((sum, b) => sum + b.amount, 0);

  const currentYearReadings = readings.filter((r) => r.date.startsWith(currentYearStr));
  const totalAnnualSavings = currentYearReadings.reduce((sum, r) => sum + r.moneySaved, 0);

  const onSubmit = async (data: BillFormData) => {
    setFormError('');
    setFormSuccess('');

    const amt = parseFloat(data.amount);
    const imp = parseFloat(data.importedUnits);
    const exp = parseFloat(data.exportedUnits);

    if (amt < 0 || imp < 0 || exp < 0) {
      setFormError('⚠️ Values cannot be negative.');
      return;
    }

    // Check if month already has a bill
    const monthExists = bills.some((b) => b.month === data.month);
    if (monthExists) {
      setFormError(`⚠️ A bill for ${data.month} has already been logged.`);
      return;
    }

    try {
      await addBill(db, {
        month: data.month,
        amount: amt,
        importedUnits: imp,
        exportedUnits: exp,
        notes: data.notes,
      });

      setFormSuccess('✅ Bill logged successfully!');
      reset({
        month: currentMonthStr,
        amount: '',
        importedUnits: '',
        exportedUnits: '',
        notes: '',
      });

      setTimeout(() => {
        setFormSuccess('');
        setShowAddForm(false);
      }, 1500);

    } catch (e: any) {
      console.error(e);
      setFormError(e.message || 'Failed to save bill. Try again.');
    }
  };

  const handleDelete = async (id: number, month: string) => {
    try {
      await deleteBill(db, id);
      console.log('Deleted bill for', month);
    } catch (e) {
      console.error('Failed to delete bill:', e);
    }
  };

  // Monthly comparison: Combine bill amount and solar savings per month for list rendering
  const monthlyComparisonList = React.useMemo(() => {
    const monthsSet = new Set<string>();
    bills.forEach((b) => monthsSet.add(b.month));
    readings.forEach((r) => monthsSet.add(r.date.substring(0, 7)));

    const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).slice(0, 6); // past 6 months

    return sortedMonths.map((m) => {
      const monthBill = bills.find((b) => b.month === m);
      const monthReadings = readings.filter((r) => r.date.startsWith(m));
      const monthSavings = monthReadings.reduce((sum, r) => sum + r.moneySaved, 0);

      return {
        month: m,
        billAmount: monthBill ? monthBill.amount : 0,
        solarSavings: monthSavings,
      };
    });
  }, [bills, readings]);

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
                🧾 Bills
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Manage utility electricity bills and track net expenses
              </ThemedText>
            </View>
            <Pressable 
              style={[styles.toggleFormBtn, { backgroundColor: showAddForm ? colors.backgroundElement : colors.primary }]}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Ionicons 
                name={showAddForm ? 'close' : 'add'} 
                size={18} 
                color={showAddForm ? colors.text : '#ffffff'} 
              />
              <ThemedText 
                type="smallBold" 
                style={{ color: showAddForm ? colors.text : '#ffffff', fontSize: 13 }}
              >
                {showAddForm ? 'Close Form' : 'Log Bill'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Form to Log Bill */}
          {showAddForm && (
            <ThemedView type="backgroundElement" style={styles.formCard}>
              <ThemedText type="smallBold" style={[styles.formTitle, { color: colors.primary }]}>
                Log Monthly Electricity Bill
              </ThemedText>

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

              {/* Month Picker/Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Month (YYYY-MM)</ThemedText>
                <Controller
                  control={control}
                  rules={{ 
                    required: 'Month is required', 
                    pattern: {
                      value: /^\d{4}-\d{2}$/,
                      message: 'Month must be in YYYY-MM format'
                    }
                  }}
                  name="month"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="e.g. 2026-08"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                {errors.month && (
                  <ThemedText type="code" style={{ color: colors.error }}>{errors.month.message}</ThemedText>
                )}
              </View>

              {/* Bill Amount */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Bill Amount ({settings.currency})</ThemedText>
                <Controller
                  control={control}
                  rules={{ 
                    required: 'Bill amount is required',
                    validate: val => !isNaN(parseFloat(val)) || 'Must be a valid number'
                  }}
                  name="amount"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      placeholder="e.g. 1450"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                {errors.amount && (
                  <ThemedText type="code" style={{ color: colors.error }}>{errors.amount.message}</ThemedText>
                )}
              </View>

              {/* Imported Units */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Imported Units (kWh)</ThemedText>
                <Controller
                  control={control}
                  rules={{ 
                    required: 'Imported units is required',
                    validate: val => !isNaN(parseFloat(val)) || 'Must be a valid number'
                  }}
                  name="importedUnits"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      placeholder="e.g. 220"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                {errors.importedUnits && (
                  <ThemedText type="code" style={{ color: colors.error }}>{errors.importedUnits.message}</ThemedText>
                )}
              </View>

              {/* Exported Units */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Exported Units (kWh)</ThemedText>
                <Controller
                  control={control}
                  rules={{ 
                    required: 'Exported units is required',
                    validate: val => !isNaN(parseFloat(val)) || 'Must be a valid number'
                  }}
                  name="exportedUnits"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      placeholder="e.g. 180"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
                {errors.exportedUnits && (
                  <ThemedText type="code" style={{ color: colors.error }}>{errors.exportedUnits.message}</ThemedText>
                )}
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">Billing Notes (Optional)</ThemedText>
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
                      placeholder="e.g. Meter reading actuals"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                />
              </View>

              <Pressable 
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit(onSubmit)}
              >
                <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Save Bill</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {/* Annual Dashboard Highlights */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.primary }]}>
              Annual Summary ({currentYearStr})
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Total Annual Bill</ThemedText>
                <ThemedText type="subtitle" style={[styles.summaryVal, { color: colors.error }]}>
                  {settings.currency}{totalAnnualBill.toLocaleString('en-IN')}
                </ThemedText>
              </View>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Total Solar Savings</ThemedText>
                <ThemedText type="subtitle" style={[styles.summaryVal, { color: colors.primary }]}>
                  {settings.currency}{totalAnnualSavings.toLocaleString('en-IN')}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.background }]} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <ThemedText type="code" themeColor="textSecondary">Net Annual Cost</ThemedText>
                <ThemedText type="subtitle" style={[styles.summaryVal, { color: totalAnnualBill - totalAnnualSavings >= 0 ? colors.info : colors.primary }]}>
                  {settings.currency}{(totalAnnualBill - totalAnnualSavings).toLocaleString('en-IN')}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 2 }}>
                  Net Amount = Bill Cost − Solar Savings
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Monthly Comparison */}
          {monthlyComparisonList.length > 0 && (
            <View style={styles.logSection}>
              <ThemedText type="smallBold" style={[styles.logTitle, { color: colors.primary }]}>
                Monthly Comparison (Bill vs. Solar Savings)
              </ThemedText>
              
              <View style={styles.comparisonHeaderRow}>
                <ThemedText type="code" themeColor="textSecondary">Month</ThemedText>
                <ThemedText type="code" themeColor="textSecondary">Utility Bill</ThemedText>
                <ThemedText type="code" themeColor="textSecondary">Solar Savings</ThemedText>
              </View>

              {monthlyComparisonList.map((item, idx) => {
                const dateObj = new Date(item.month + '-02'); // Add buffer to avoid timezone shifting
                const label = dateObj.toLocaleDateString([], { month: 'long', year: '2-digit' });

                return (
                  <View key={idx} style={styles.comparisonRow}>
                    <ThemedText type="smallBold" style={{ flex: 1 }}>{label}</ThemedText>
                    <ThemedText type="smallBold" style={{ flex: 1, color: colors.error }}>
                      {settings.currency}{Math.round(item.billAmount)}
                    </ThemedText>
                    <ThemedText type="smallBold" style={{ flex: 1, color: colors.primary, textAlign: 'right' }}>
                      {settings.currency}{Math.round(item.solarSavings)}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}

          {/* Bill History Logs */}
          <View style={styles.logSection}>
            <ThemedText type="smallBold" style={[styles.logTitle, { color: colors.primary }]}>
              Electricity Bills History ({bills.length})
            </ThemedText>

            {bills.length === 0 ? (
              <ThemedView type="backgroundElement" style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                <ThemedText type="smallBold" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
                  No bill records logged yet.
                </ThemedText>
              </ThemedView>
            ) : (
              <View style={{ gap: Spacing.two }}>
                {bills.map((bill) => {
                  const dateObj = new Date(bill.month + '-02');
                  const monthLabel = dateObj.toLocaleDateString([], { month: 'long', year: 'numeric' });

                  return (
                    <ThemedView key={bill.id} type="backgroundElement" style={styles.billRowCard}>
                      <View style={styles.billRowHeader}>
                        <View>
                          <ThemedText type="default" style={{ fontWeight: '700' }}>{monthLabel}</ThemedText>
                          <ThemedText type="subtitle" style={[styles.billAmtText, { color: colors.error }]}>
                            {settings.currency}{bill.amount.toFixed(2)}
                          </ThemedText>
                        </View>
                        <Pressable 
                          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                          onPress={() => handleDelete(bill.id, bill.month)}
                        >
                          <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </Pressable>
                      </View>

                      <View style={styles.billRowDetails}>
                        <View style={styles.detailCol}>
                          <ThemedText type="code" themeColor="textSecondary">Imported Units</ThemedText>
                          <ThemedText type="smallBold">{bill.importedUnits} kWh</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText type="code" themeColor="textSecondary">Exported Units</ThemedText>
                          <ThemedText type="smallBold">{bill.exportedUnits} kWh</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText type="code" themeColor="textSecondary">Net Metered</ThemedText>
                          <ThemedText type="smallBold">{(bill.importedUnits - bill.exportedUnits).toFixed(1)} kWh</ThemedText>
                        </View>
                      </View>

                      {bill.notes && (
                        <View style={styles.notesBox}>
                          <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>
                            📝 {bill.notes}
                          </ThemedText>
                        </View>
                      )}
                    </ThemedView>
                  );
                })}
              </View>
            )}
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
  toggleFormBtn: {
    flexDirection: 'row',
    height: 38,
    borderRadius: 19,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  formCard: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 15,
  },
  banner: {
    padding: Spacing.two,
    borderRadius: 10,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    height: 60,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  saveBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  sectionHeader: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryCard: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  summaryCol: {
    flex: 1,
    gap: 2,
  },
  summaryVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  logSection: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  logTitle: {
    fontSize: 15,
    marginBottom: Spacing.one,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(128, 128, 128, 0.03)',
    borderRadius: 12,
  },
  emptyCard: {
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billRowCard: {
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  billRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  billAmtText: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  deleteBtn: {
    padding: Spacing.one,
  },
  billRowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(128, 128, 128, 0.03)',
    padding: Spacing.two,
    borderRadius: 10,
  },
  detailCol: {
    alignItems: 'center',
    flex: 1,
  },
  notesBox: {
    marginTop: 2,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    paddingTop: Spacing.two,
  },
});
