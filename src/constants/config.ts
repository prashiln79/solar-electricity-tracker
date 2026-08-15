/**
 * Application configuration constants.
 */

export const APP_CONFIG = {
  APP_NAME: 'Money Manager',
  APP_VERSION: '1.0.0',
  DB_NAME: 'money_manager.db',
  DEFAULT_CURRENCY: 'INR',
  DEFAULT_LANGUAGE: 'en',
  WELCOME_MESSAGE:
    'Welcome to Money Manager! Track your income, expenses, budgets, and financial goals — all in one place.',
  MAX_FREE_ACCOUNTS: 3,
  MAX_FREE_CATEGORIES: 20,
  MAX_FREE_BUDGETS: 3,
  MAX_FREE_GOALS: 3,
} as const;
