/**
 * Color palette for Money Manager.
 * Matches the Angular Money Manager app theme (Teal / Emerald palette).
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryContainer: string;

  accent: string;
  accentLight: string;
  accentContainer: string;

  income: string;
  incomeLight: string;
  expense: string;
  expenseLight: string;
  transfer: string;
  transferLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;

  border: string;
  borderLight: string;
  divider: string;
  icon: string;
  iconActive: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarInactive: string;
  tabBarActive: string;

  overlay: string;
  shadow: string;

  cardGradientStart: string;
  cardGradientEnd: string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    // Backgrounds & Surfaces (Teal/Neutral tint)
    background: '#F4F7F5',
    surface: '#FFFFFF',
    surfaceVariant: '#EAEFE9',
    surfaceElevated: '#FFFFFF',

    // Text
    text: '#191C1A',
    textSecondary: '#56625C',
    textTertiary: '#8D918D',
    textInverse: '#FFFFFF',

    // Primary Brand (Angular Teal/Emerald Green #2D6A4F)
    primary: '#2D6A4F',
    primaryLight: '#52B788',
    primaryDark: '#1B4332',
    primaryContainer: '#D8F3DC',

    // Accent (Cyan Teal #006A67)
    accent: '#006A67',
    accentLight: '#56DAD5',
    accentContainer: '#E6FFFB',

    // Semantic
    income: '#10B981',
    incomeLight: '#D1FAE5',
    expense: '#BA1A1A',
    expenseLight: '#FFDAD6',
    transfer: '#6B4EAE',
    transferLight: '#EDE7F6',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    info: '#0284C7',
    infoLight: '#E0F2FE',

    // UI Elements
    border: '#D8E0DA',
    borderLight: '#E8EFEA',
    divider: '#D8E0DA',
    icon: '#56625C',
    iconActive: '#2D6A4F',
    tabBar: '#FFFFFF',
    tabBarBorder: '#D8E0DA',
    tabBarInactive: '#747774',
    tabBarActive: '#2D6A4F',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(27, 67, 50, 0.08)',

    // Cards
    cardGradientStart: '#FFFFFF',
    cardGradientEnd: '#F4F7F5',
  },

  dark: {
    // Backgrounds & Surfaces
    background: '#0F1412',
    surface: '#191C1A',
    surfaceVariant: '#232825',
    surfaceElevated: '#2A302C',

    // Text
    text: '#E0E3DE',
    textSecondary: '#A3AEA8',
    textTertiary: '#727A73',
    textInverse: '#191C1A',

    // Primary Brand (Emerald Green #52B788)
    primary: '#52B788',
    primaryLight: '#74C69D',
    primaryDark: '#2D6A4F',
    primaryContainer: '#1B4332',

    // Accent
    accent: '#56DAD5',
    accentLight: '#7AF7F1',
    accentContainer: '#003735',

    // Semantic
    income: '#34D399',
    incomeLight: '#064E3B',
    expense: '#FF5449',
    expenseLight: '#690005',
    transfer: '#B39DDB',
    transferLight: '#311B92',
    warning: '#FBBF24',
    warningLight: '#78350F',
    info: '#38BDF8',
    infoLight: '#075985',

    // UI Elements
    border: '#2E3530',
    borderLight: '#232925',
    divider: '#2E3530',
    icon: '#A3AEA8',
    iconActive: '#52B788',
    tabBar: '#191C1A',
    tabBarBorder: '#2E3530',
    tabBarInactive: '#727A73',
    tabBarActive: '#52B788',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.4)',

    // Cards
    cardGradientStart: '#191C1A',
    cardGradientEnd: '#232825',
  },
};
