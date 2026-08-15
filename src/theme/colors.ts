/**
 * Color palette for Money Manager.
 * Inspired by modern finance apps with a premium dark/light mode.
 */

export const Colors = {
  light: {
    // Backgrounds
    background: '#F8F9FE',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F3F9',
    surfaceElevated: '#FFFFFF',

    // Text
    text: '#1A1D29',
    textSecondary: '#6B7194',
    textTertiary: '#9CA3C4',
    textInverse: '#FFFFFF',

    // Primary
    primary: '#4F46E5',
    primaryLight: '#818CF8',
    primaryDark: '#3730A3',
    primaryContainer: '#EEF2FF',

    // Accent
    accent: '#06B6D4',
    accentLight: '#67E8F9',
    accentContainer: '#ECFEFF',

    // Semantic
    income: '#10B981',
    incomeLight: '#D1FAE5',
    expense: '#EF4444',
    expenseLight: '#FEE2E2',
    transfer: '#8B5CF6',
    transferLight: '#EDE9FE',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // UI Elements
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#E2E8F0',
    icon: '#64748B',
    iconActive: '#4F46E5',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    tabBarInactive: '#94A3B8',
    tabBarActive: '#4F46E5',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(15, 23, 42, 0.08)',

    // Cards
    cardGradientStart: '#FFFFFF',
    cardGradientEnd: '#F8FAFC',
  },

  dark: {
    // Backgrounds
    background: '#0F1117',
    surface: '#1A1D2E',
    surfaceVariant: '#232640',
    surfaceElevated: '#252A3E',

    // Text
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#0F172A',

    // Primary
    primary: '#818CF8',
    primaryLight: '#A5B4FC',
    primaryDark: '#6366F1',
    primaryContainer: '#312E81',

    // Accent
    accent: '#22D3EE',
    accentLight: '#67E8F9',
    accentContainer: '#164E63',

    // Semantic
    income: '#34D399',
    incomeLight: '#064E3B',
    expense: '#F87171',
    expenseLight: '#7F1D1D',
    transfer: '#A78BFA',
    transferLight: '#4C1D95',
    warning: '#FBBF24',
    warningLight: '#78350F',
    info: '#60A5FA',
    infoLight: '#1E3A5F',

    // UI Elements
    border: '#2D3250',
    borderLight: '#1E2139',
    divider: '#2D3250',
    icon: '#94A3B8',
    iconActive: '#818CF8',
    tabBar: '#1A1D2E',
    tabBarBorder: '#2D3250',
    tabBarInactive: '#64748B',
    tabBarActive: '#818CF8',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',

    // Cards
    cardGradientStart: '#1A1D2E',
    cardGradientEnd: '#232640',
  },
} as const;

export type ThemeColors = typeof Colors.light;
