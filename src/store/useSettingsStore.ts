/**
 * Settings store — manages user preferences, theme, and app settings.
 */

import { create } from 'zustand';
import { Appearance, type ColorSchemeName } from 'react-native';
import { ThemeType, CurrencyCode } from '@/types/enums';

interface SettingsState {
  // Theme
  themeMode: ThemeType;
  colorScheme: 'light' | 'dark';

  // Currency
  currency: string;
  currencySymbol: string;

  // App preferences
  language: string;
  hapticFeedback: boolean;
  pinEnabled: boolean;
  isFamilyMode: boolean;
  activeFamilyId: string | null;
  appView: 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  // Actions
  setThemeMode: (mode: ThemeType) => void;
  setCurrency: (code: string) => void;
  setLanguage: (lang: string) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setPinEnabled: (enabled: boolean) => void;
  setFamilyMode: (enabled: boolean, familyId?: string | null) => void;
  setAppView: (view: 'WEEKLY' | 'MONTHLY' | 'YEARLY') => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  BRL: 'R$',
  MXN: 'MX$',
  THB: '฿',
  AED: 'د.إ',
  SAR: 'ر.س',
};

function getSystemScheme(): 'light' | 'dark' {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

function resolveScheme(mode: ThemeType): 'light' | 'dark' {
  if (mode === ThemeType.AUTO) return getSystemScheme();
  return mode === ThemeType.DARK ? 'dark' : 'light';
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: ThemeType.AUTO,
  colorScheme: getSystemScheme(),
  currency: CurrencyCode.INR,
  currencySymbol: '₹',
  language: 'en',
  hapticFeedback: true,
  pinEnabled: false,
  isFamilyMode: false,
  activeFamilyId: null,
  appView: 'MONTHLY',

  setThemeMode: (mode) =>
    set({ themeMode: mode, colorScheme: resolveScheme(mode) }),

  setCurrency: (code) =>
    set({ currency: code, currencySymbol: CURRENCY_SYMBOLS[code] || code }),

  setLanguage: (lang) => set({ language: lang }),

  setHapticFeedback: (enabled) => set({ hapticFeedback: enabled }),

  setPinEnabled: (enabled) => set({ pinEnabled: enabled }),

  setFamilyMode: (enabled, familyId) =>
    set({ isFamilyMode: enabled, activeFamilyId: familyId ?? null }),

  setAppView: (view) => set({ appView: view }),
}));
