import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAccountStore } from '@/store/useAccountStore';
import { useAuthStore } from '@/store/useAuthStore';
import { AccountType } from '@/types/enums';

export default function AddAccountScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const colors = useThemeColors();

  const user = useAuthStore((s) => s.user);
  const addAccount = useAccountStore((s) => s.addAccount);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(AccountType.BANK);
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const accountTypes = [
    { key: AccountType.BANK, label: 'Bank Account', icon: 'business-outline' },
    { key: AccountType.CASH, label: 'Cash Wallet', icon: 'cash-outline' },
    { key: AccountType.CREDIT, label: 'Credit Card', icon: 'card-outline' },
    { key: AccountType.INVESTMENT, label: 'Investment', icon: 'trending-up-outline' },
    { key: AccountType.LOAN, label: 'Loan', icon: 'document-text-outline' },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an account name.');
      return;
    }
    if (!user?.uid) return;

    setLoading(true);
    try {
      await addAccount(db, user.uid, {
        name: name.trim(),
        type,
        balance: balance ? parseFloat(balance) : 0,
        institution: institution.trim() || undefined,
        description: description.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add New Account</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          label="Account Name"
          placeholder="e.g. HDFC Bank, Cash Wallet"
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account Type</Text>
        <View style={styles.typeGrid}>
          {accountTypes.map((item) => {
            const isSelected = type === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setType(item.key)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeCardText,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Initial Balance"
          placeholder="0.00"
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
        />

        <Input
          label="Institution (Optional)"
          placeholder="e.g. Chase, SBI, ICICI"
          value={institution}
          onChangeText={setInstitution}
        />

        <Input
          label="Description (Optional)"
          placeholder="Short note about this account"
          value={description}
          onChangeText={setDescription}
        />

        <Button
          title="Save Account"
          onPress={handleSave}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.titleLarge },

  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  sectionLabel: { ...Typography.labelMedium, marginBottom: Spacing.sm },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  typeCard: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeCardText: { ...Typography.labelMedium },

  submitButton: { marginTop: Spacing.lg, marginBottom: Spacing.xxl },
});
