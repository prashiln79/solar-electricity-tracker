/**
 * Application-wide enums for type safety and maintainability.
 * Ported from Angular Money Manager.
 */

/** User role types */
export enum UserRole {
  FREE = 'free',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

/** Account types */
export enum AccountType {
  BANK = 'bank',
  CASH = 'cash',
  CREDIT = 'credit',
  LOAN = 'loan',
  INVESTMENT = 'investment',
}

/** Transaction types */
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

/** Recurring transaction intervals */
export enum RecurringInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/** Sync status for offline operations */
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  FAILED = 'failed',
}

/** Operation types for offline queue */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

/** Notification types */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/** Theme types */
export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

/** Budget periods */
export enum BudgetPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/** Goal types */
export enum GoalType {
  SAVINGS = 'savings',
  DEBT_PAYOFF = 'debt_payoff',
  INVESTMENT = 'investment',
  PURCHASE = 'purchase',
}

/** Goal status */
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

/** Transaction status */
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  DELETED = 'deleted',
}

/** Export formats */
export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
}

/** Chart types for reports */
export enum ChartType {
  PIE = 'pie',
  BAR = 'bar',
  LINE = 'line',
  DOUGHNUT = 'doughnut',
  AREA = 'area',
}

/** Date range presets */
export enum DateRangePreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

/** Settlement payment methods */
export enum SettlementMethod {
  CASH = 'cash',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
}

/** Family member roles */
export enum FamilyMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

/** Family group mode */
export enum FamilyMode {
  COMMON = 'common',
  SPLIT = 'split',
}

/** Currency codes */
export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  INR = 'INR',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
  CNY = 'CNY',
  CHF = 'CHF',
  SEK = 'SEK',
  NOK = 'NOK',
  DKK = 'DKK',
  PLN = 'PLN',
  RUB = 'RUB',
  TRY = 'TRY',
  BRL = 'BRL',
  ARS = 'ARS',
  MXN = 'MXN',
  KRW = 'KRW',
  THB = 'THB',
  IDR = 'IDR',
  MYR = 'MYR',
  PHP = 'PHP',
  VND = 'VND',
  SAR = 'SAR',
  AED = 'AED',
  ILS = 'ILS',
  NZD = 'NZD',
  HKD = 'HKD',
  SGD = 'SGD',
  ZAR = 'ZAR',
  NGN = 'NGN',
  EGP = 'EGP',
  KES = 'KES',
}
