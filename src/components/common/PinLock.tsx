import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';

interface PinLockProps {
  onSuccess: () => void;
  correctPin?: string;
  title?: string;
}

export function PinLock({ onSuccess, correctPin = '1234', title = 'Enter PIN' }: PinLockProps) {
  const colors = useThemeColors();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: error ? colors.expense : colors.textSecondary }]}>
          {error ? 'Incorrect PIN. Try again.' : 'Enter your 4-digit security PIN'}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((index) => {
          const filled = pin.length > index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: filled
                    ? error
                      ? colors.expense
                      : colors.primary
                    : colors.surfaceVariant,
                  borderColor: error ? colors.expense : colors.border,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Numpad */}
      <View style={styles.numpad}>
        {keys.map((key, idx) => {
          if (key === '') return <View key={idx} style={styles.key} />;
          if (key === 'delete') {
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.key, { backgroundColor: colors.surfaceVariant }]}
                onPress={handleDelete}
              >
                <Ionicons name="backspace-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.key, { backgroundColor: colors.surface }]}
              onPress={() => handleKeyPress(key)}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  title: {
    ...Typography.headlineLarge,
    marginTop: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyMedium,
    marginTop: Spacing.xs,
  },

  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginVertical: Spacing.xxl,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },

  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    ...Typography.displayMedium,
  },
});
