/**
 * Data models for the Money Manager app.
 * Ported from Angular Money Manager TypeScript interfaces.
 * Timestamps use `number` (Unix ms) instead of Firestore Timestamp.
 */

import {
  AccountType,
  BudgetPeriod,
  FamilyMemberRole,
  FamilyMode,
  GoalStatus,
  GoalType,
  RecurringInterval,
  SettlementMethod,
  SyncStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
} from './enums';

// ─── User ──────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  defaultCurrency: string;
  timezone: string;
  language?: string;
  country?: string;
  notifications: boolean;
  emailUpdates: boolean;
  categoryListViewMode?: boolean;
  appView?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  theme?: string;
  pinEnabled?: boolean;
  pinHash?: string;
  isFamilyMode?: boolean;
  activeFamilyId?: string | null;
  hapticFeedback?: boolean;
  hasSeenWelcome?: boolean;
  captureLocationByDefault?: boolean;
  openaiApiKey?: string;
  geminiApiKey?: string;
  yearlyBudget?: any;
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: number;
  occupation?: string;
  monthlyIncome?: number;
  preferences?: UserPreferences;
  updatedAt?: number;
  lastLoginAt?: number;
  loginCount?: number;
  photoURL?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  providerId?: string;
  displayName?: string;
  profilePicture?: string;
  fcmToken?: string;
}

// ─── Account ───────────────────────────────────────────────────────────────────

export interface LoanDetails {
  lenderName: string;
  loanAmount: number;
  interestRate: number;
  startDate: number;
  durationMonths: number;
  repaymentFrequency: 'monthly' | 'weekly';
  status: 'active' | 'closed' | 'defaulted';
  totalPaid?: number;
  remainingBalance?: number;
  nextDueDate: number;
  showReminder: boolean;
  monthlyPayment: number;
  endDate: number;
}

export interface Account {
  accountId: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: number;
  updatedAt?: number;
  description?: string;
  accountNumber?: string;
  institution?: string;
  currency?: string;
  isActive?: boolean;
  icon?: string;
  color?: string;
  lastSyncAt?: number;
  syncStatus?: SyncStatus;
  familyId: string;
  loanDetails?: LoanDetails;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  balance: number;
  description?: string;
  accountNumber?: string;
  institution?: string;
  currency?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: AccountType;
  balance?: number;
  description?: string;
  accountNumber?: string;
  institution?: string;
  currency?: string;
  isActive?: boolean;
}

// ─── Category ──────────────────────────────────────────────────────────────────

export interface CategoryBudget {
  hasBudget?: boolean;
  budgetAmount?: number;
  budgetPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  budgetStartDate?: number;
  budgetEndDate?: number;
  budgetAlertThreshold?: number;
  budgetAlertEnabled?: boolean;
}

export interface Category {
  id?: string;
  userId: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  createdAt: number;
  budget?: CategoryBudget;
  parentCategoryId?: string;
  isSubCategory?: boolean;
  subCategories?: string[];
  group?: string;
  groupIcon?: string;
  isSystem: boolean;
  syncStatus?: string;
  lastSyncAt?: number;
  familyId: string;
}

// ─── Transaction ───────────────────────────────────────────────────────────────

export interface TaxComponent {
  name: string;
  rate: number;
  amount: number;
}

export interface SplitBetweenMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  percentage: number;
  amount: number;
}

export interface PaidByMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  amount: number;
}

export interface SplitTransactionData {
  paidByUserId: string;
  paidByDisplayName: string;
  paidByPhotoURL?: string;
  paidBy?: PaidByMember[];
  splitBetween: SplitBetweenMember[];
}

export interface CategorySplit {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  notes?: string;
}

export interface Transaction {
  id?: string;
  userId: string;
  accountId?: string;
  categoryId: string;
  category: string;
  payee?: string;
  amount: number;
  type: TransactionType;
  date: number;
  notes?: string;
  status: TransactionStatus;

  tags?: string[];
  isSplitTransaction?: boolean;
  splitGroupId?: string;
  fromAccountId?: string;
  toAccountId?: string;

  // Recurrence
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval | null;
  recurringEndDate?: number | null;
  nextOccurrence?: number | null;

  // Family
  familyId: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  splitData?: SplitTransactionData;

  // Category split
  isCategorySplit?: boolean;
  categorySplits?: CategorySplit[];
  totalSplitAmount?: number;

  // Tax
  taxAmount?: number;
  taxPercentage?: number;
  taxes?: TaxComponent[];

  // Offline sync
  syncStatus: SyncStatus;
  isPending?: boolean;
  lastSyncedAt?: number;

  // Settlement link
  settlementId?: string;
  settlementFamilyId?: string;
  settlementFromUserId?: string;
  settlementToUserId?: string;

  // Flagging
  flagged?: boolean;
  flagMessage?: string;
  flaggedBy?: string | null;
  flaggedAt?: number | null;

  // Location
  placeName?: string;

  // Audit
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface CreateTransactionRequest {
  accountId?: string;
  familyId?: string;
  categoryId: string;
  category?: string;
  payee?: string;
  amount: number;
  type: TransactionType;
  date: number;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  recurringEndDate?: number;
  splitData?: SplitTransactionData;
  userDisplayName?: string;
  userPhotoURL?: string;
  taxAmount?: number;
  taxPercentage?: number;
  taxes?: TaxComponent[];
  settlementId?: string;
  settlementFamilyId?: string;
  settlementFromUserId?: string;
  settlementToUserId?: string;
  placeName?: string;
  fromAccountId?: string;
  toAccountId?: string;
}

export interface TransactionFilter {
  accountIds?: string[];
  categoryIds?: string[];
  types?: TransactionType[];
  dateFrom?: number;
  dateTo?: number;
  amountMin?: number;
  amountMax?: number;
  payee?: string;
  tags?: string[];
  status?: TransactionStatus[];
  isRecurring?: boolean;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  averageAmount: number;
  largestTransaction: number;
  smallestTransaction: number;
  totalTax?: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface TransactionTrend {
  period: string;
  income: number;
  expense: number;
  netAmount: number;
  transactionCount: number;
}

// ─── Budget ────────────────────────────────────────────────────────────────────

export interface Budget {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  period: BudgetPeriod;
  categoryIds: string[];
  startDate: number;
  endDate?: number;
  isActive: boolean;

  // Progress tracking
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;

  // Alerts
  alertThreshold: number;
  isAlertEnabled: boolean;

  // Offline sync
  syncStatus: SyncStatus;
  lastSyncedAt?: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface CreateBudgetRequest {
  name: string;
  description?: string;
  amount: number;
  period: BudgetPeriod;
  categoryIds: string[];
  startDate: number;
  endDate?: number;
  alertThreshold?: number;
  isAlertEnabled?: boolean;
}

export interface BudgetProgress {
  budgetId: string;
  budgetName: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  isOverBudget: boolean;
  daysRemaining: number;
  dailyAverage: number;
  projectedOverspend?: number;
}

// ─── Goal ──────────────────────────────────────────────────────────────────────

export interface GoalMilestone {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: number;
  isCompleted: boolean;
  completedDate?: number;
  reward?: string;
}

export interface Goal {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  status: GoalStatus;

  // Timeline
  startDate: number;
  targetDate?: number;
  completedDate?: number;

  // Progress tracking
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining?: number;
  isOnTrack: boolean;

  // Contribution settings
  monthlyContribution?: number;
  contributionFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  autoContribution: boolean;
  contributionAccountId?: string;

  // Milestones
  milestones: GoalMilestone[];
  nextMilestone?: GoalMilestone;

  // Alerts
  alertThreshold: number;
  isAlertEnabled: boolean;

  // Offline sync
  syncStatus: SyncStatus;
  lastSyncedAt?: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface CreateGoalRequest {
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  startDate: number;
  targetDate?: number;
  monthlyContribution?: number;
  contributionFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  autoContribution?: boolean;
  contributionAccountId?: string;
  alertThreshold?: number;
  isAlertEnabled?: boolean;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: number;
  description?: string;
  transactionId?: string;
  isAutomatic: boolean;
  createdAt: number;
  createdBy: string;
}

// ─── Recurring Template ────────────────────────────────────────────────────────

export interface RecurringTemplate {
  id?: string;
  userId: string;
  accountId?: string;
  categoryId: string;
  category: string;
  payee?: string;
  amount: number;
  type: TransactionType;
  categoryType: TransactionType;
  recurringInterval: RecurringInterval;
  recurringEndDate?: number | null;
  nextOccurrence: number;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  isRecurring: boolean;
  syncStatus?: SyncStatus;
  lastProcessedAt?: number | null;
  familyId?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

// ─── Family ────────────────────────────────────────────────────────────────────

export interface Family {
  id?: string;
  name: string;
  ownerUserId: string;
  inviteCode: string;
  mode?: FamilyMode;
  icon?: string;
  banner?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  memberIds?: string[];
}

export interface FamilyMember {
  id?: string;
  familyId: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: FamilyMemberRole;
  joinedAt: number;
  isActive: boolean;
}

export interface FamilyMemberStats {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalIncome: number;
  totalExpense: number;
  totalPaid: number;
  actualPaid: number;
  netBalance: number;
  transactionCount: number;
  paidCount: number;
  isActive: boolean;
  role: FamilyMemberRole;
}

export interface FamilyStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  memberBreakdown: FamilyMemberStats[];
  categoryBreakdown: CategoryBreakdownItem[];
  topSpender?: { name: string; amount: number };
  topCategory?: { name: string; amount: number; percentage: number };
  largestExpense?: { note: string; amount: number };
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface Settlement {
  id?: string;
  familyId: string;
  fromUserId: string;
  fromDisplayName: string;
  fromPhotoURL?: string;
  toUserId: string;
  toDisplayName: string;
  toPhotoURL?: string;
  amount: number;
  method: SettlementMethod;
  note?: string;
  settledAt: number;
  createdAt: number;
  linkedTransactionId?: string;
}

export interface BalanceEntry {
  fromUserId: string;
  fromDisplayName: string;
  fromPhotoURL?: string;
  toUserId: string;
  toDisplayName: string;
  toPhotoURL?: string;
  amount: number;
}

// ─── Offline Sync Queue ────────────────────────────────────────────────────────

export interface SyncQueueItem {
  id?: string;
  entityType: 'transaction' | 'account' | 'category' | 'budget' | 'goal' | 'family' | 'settlement';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: string; // JSON-stringified entity
  createdAt: number;
  retryCount: number;
  lastError?: string;
}
