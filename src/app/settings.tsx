import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext, IndianState } from '@/context/AppContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const STATES: IndianState[] = ['Maharashtra', 'Karnataka', 'Goa', 'Gujarat', 'Tamil Nadu', 'Delhi'];

export default function SettingsScreen() {
  const { settings, updateSettings, resetAllData } = useAppContext();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const [capacity, setCapacity] = useState(settings.solarCapacity.toString());
  const [tariff, setTariff] = useState(settings.electricityTariff.toString());
  const [exportTariff, setExportTariff] = useState(settings.exportTariff.toString());
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    const parsedCapacity = parseFloat(capacity);
    const parsedTariff = parseFloat(tariff);
    const parsedExport = parseFloat(exportTariff);

    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      setMessage('⚠️ Please enter a valid solar plant capacity (kW).');
      return;
    }
    if (isNaN(parsedTariff) || parsedTariff <= 0) {
      setMessage('⚠️ Please enter a valid electricity import tariff (₹/kWh).');
      return;
    }
    if (isNaN(parsedExport) || parsedExport < 0) {
      setMessage('⚠️ Please enter a valid grid export tariff (₹/kWh).');
      return;
    }

    updateSettings({
      solarCapacity: parsedCapacity,
      electricityTariff: parsedTariff,
      exportTariff: parsedExport,
    });
    
    setMessage('✅ Settings updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleStateSelect = (state: IndianState) => {
    updateSettings({ selectedState: state });
    setShowStateDropdown(false);
    setMessage(`📍 State updated to ${state}`);
    setTimeout(() => setMessage(''), 2000);
  };

  const handleReset = () => {
    resetAllData();
    setCapacity('5.0');
    setTariff('7.5');
    setExportTariff('4.5');
    setMessage('🔄 Reset all values to defaults.');
    setTimeout(() => setMessage(''), 3000);
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
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                ⚙ Settings
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Configure tariffs and plant parameters
              </ThemedText>
            </View>

            {message !== '' && (
              <View style={[styles.messageBanner, { backgroundColor: message.startsWith('✅') || message.startsWith('📍') ? colors.primaryLight : colors.errorLight }]}>
                <ThemedText type="smallBold" style={{ color: message.startsWith('✅') || message.startsWith('📍') ? colors.primary : colors.error, textAlign: 'center' }}>
                  {message}
                </ThemedText>
              </View>
            )}

            {/* Solar Plant Configuration */}
            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.primary }]}>
                Solar Plant details
              </ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Solar Plant Capacity (kW)
                </ThemedText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                  keyboardType="numeric"
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="e.g. 5.0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Installation State (Net Meter Policy)
                </ThemedText>
                <Pressable 
                  style={[styles.selectTrigger, { borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                  onPress={() => setShowStateDropdown(!showStateDropdown)}
                >
                  <ThemedText type="default">{settings.selectedState}</ThemedText>
                  <ThemedText type="default">▼</ThemedText>
                </Pressable>
                
                {showStateDropdown && (
                  <View style={[styles.dropdown, { backgroundColor: colors.backgroundElement }]}>
                    {STATES.map((state) => (
                      <Pressable 
                        key={state} 
                        style={[
                          styles.dropdownItem, 
                          settings.selectedState === state && { backgroundColor: colors.backgroundSelected }
                        ]}
                        onPress={() => handleStateSelect(state)}
                      >
                        <ThemedText type="default">{state}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </ThemedView>

            {/* Tariff Configuration */}
            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.primary }]}>
                Net Metering Tariffs (DISCOM)
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Grid Import Tariff (₹ / kWh)
                </ThemedText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                  keyboardType="numeric"
                  value={tariff}
                  onChangeText={setTariff}
                  placeholder="e.g. 7.5"
                  placeholderTextColor={colors.textSecondary}
                />
                <ThemedText type="code" themeColor="textSecondary" style={styles.inputHint}>
                  Rate charged by state utility for electricity consumed.
                </ThemedText>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Grid Export Tariff / Feed-in (₹ / kWh)
                </ThemedText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.textSecondary, backgroundColor: colors.background }]}
                  keyboardType="numeric"
                  value={exportTariff}
                  onChangeText={setExportTariff}
                  placeholder="e.g. 4.5"
                  placeholderTextColor={colors.textSecondary}
                />
                <ThemedText type="code" themeColor="textSecondary" style={styles.inputHint}>
                  Rate paid by state utility for solar energy sent to grid.
                </ThemedText>
              </View>
            </ThemedView>

            {/* Actions */}
            <View style={styles.actionContainer}>
              <Pressable 
                style={[styles.btn, styles.btnSave, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <ThemedText type="smallBold" style={styles.btnText}>Save Changes</ThemedText>
              </Pressable>

              <Pressable 
                style={[styles.btn, styles.btnReset, { borderColor: colors.error }]}
                onPress={handleReset}
              >
                <ThemedText type="smallBold" style={{ color: colors.error }}>Reset to Defaults</ThemedText>
              </Pressable>
            </View>

            {/* Info Card */}
            <ThemedView type="backgroundElement" style={styles.infoCard}>
              <ThemedText type="smallBold" style={{ color: colors.primary, marginBottom: Spacing.one }}>
                ℹ About Indian Net Metering
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary" style={styles.infoText}>
                In India, rooftop solar owners use net-meters to track both imports (consumption from grid) and exports (solar sent to grid). If exports exceed imports, the net balance is credited to the monthly bill, or rolled over until the settlement period (usually March). Credits are settled at the state-defined grid export tariff.
              </ThemedText>
            </ThemedView>

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
    marginBottom: Spacing.two,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 32,
    marginBottom: Spacing.one,
  },
  messageBanner: {
    padding: Spacing.two,
    borderRadius: 12,
    marginBottom: Spacing.one,
  },
  section: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: Spacing.one,
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
  inputHint: {
    fontSize: 11,
    marginTop: 2,
  },
  selectTrigger: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdown: {
    borderRadius: 12,
    marginTop: Spacing.one,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: Spacing.three,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  actionContainer: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  btn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSave: {
    elevation: 2,
  },
  btnReset: {
    borderWidth: 1.5,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
