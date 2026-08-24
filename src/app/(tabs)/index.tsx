/**
 * Home Dashboard — main overview screen.
 * Shows: greeting, total balance, income/expense summary, recent transactions.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAccountStore } from "@/store/useAccountStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { BorderRadius, Spacing, Typography, useThemeColors } from "@/theme";
import { TransactionType } from "@/types/enums";
import type { Transaction } from "@/types/models";

function formatCurrency(amount: number, symbol: string): string {
	const absAmount = Math.abs(amount);
	if (absAmount >= 10000000) return `${symbol}${(absAmount / 10000000).toFixed(2)}Cr`;
	if (absAmount >= 100000) return `${symbol}${(absAmount / 100000).toFixed(2)}L`;
	if (absAmount >= 1000) return `${symbol}${(absAmount / 1000).toFixed(1)}K`;
	return `${symbol}${absAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "Good Morning";
	if (hour < 17) return "Good Afternoon";
	return "Good Evening";
}

function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const isToday = date.toDateString() === now.toDateString();
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	const isYesterday = date.toDateString() === yesterday.toDateString();

	if (isToday) return "Today";
	if (isYesterday) return "Yesterday";
	return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function SummaryCard({
	title,
	amount,
	icon,
	iconColor,
	bgColor,
	colors,
	symbol,
}: {
	title: string;
	amount: number;
	icon: string;
	iconColor: string;
	bgColor: string;
	colors: ReturnType<typeof useThemeColors>;
	symbol: string;
}) {
	return (
		<View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
			<View style={[styles.summaryIconContainer, { backgroundColor: bgColor }]}>
				<Ionicons name={icon as any} size={20} color={iconColor} />
			</View>
			<Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{title}</Text>
			<Text style={[styles.summaryAmount, { color: colors.text }]}>{formatCurrency(amount, symbol)}</Text>
		</View>
	);
}

function TransactionItem({ transaction, colors, symbol }: { transaction: Transaction; colors: ReturnType<typeof useThemeColors>; symbol: string }) {
	const isIncome = transaction.type === TransactionType.INCOME;
	const amountColor = isIncome ? colors.income : colors.expense;
	const prefix = isIncome ? "+" : "-";

	return (
		<View style={[styles.txnItem, { borderBottomColor: colors.borderLight }]}>
			<View style={[styles.txnIconContainer, { backgroundColor: colors.surfaceVariant }]}>
				<Text style={styles.txnIcon}>{transaction.type === TransactionType.TRANSFER ? "↔️" : isIncome ? "📈" : "📉"}</Text>
			</View>
			<View style={styles.txnDetails}>
				<Text style={[styles.txnCategory, { color: colors.text }]} numberOfLines={1}>
					{transaction.category}
				</Text>
				<Text style={[styles.txnMeta, { color: colors.textTertiary }]}>
					{transaction.payee ? `${transaction.payee} · ` : ""}
					{formatDate(transaction.date)}
				</Text>
			</View>
			<Text style={[styles.txnAmount, { color: amountColor }]}>
				{prefix}
				{formatCurrency(transaction.amount, symbol)}
			</Text>
		</View>
	);
}

export default function HomeScreen() {
	const db = useSQLiteContext();
	const router = useRouter();
	const colors = useThemeColors();

	const user = useAuthStore((s) => s.user);
	const { transactions, summary, isLoading, loadTransactions } = useTransactionStore();
	const { totalBalance } = useAccountStore();
	const { currencySymbol, isFamilyMode } = useSettingsStore();

	const recentTransactions = transactions.slice(0, 5);

	const onRefresh = useCallback(async () => {
		if (user?.uid) {
			await loadTransactions(db, user.uid);
		}
	}, [db, user?.uid]);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
				showsVerticalScrollIndicator={false}
			>
				{/* Greeting Banner */}
				<View style={styles.greetingBanner}>
					<Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()} 👋</Text>
					<Text style={[styles.userName, { color: colors.text }]}>{isFamilyMode ? "Family Dashboard" : user?.displayName || "Guest"}</Text>
				</View>

				{/* Total Balance Card */}
				<View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
					<Text style={styles.balanceLabel}>Total Balance</Text>
					<Text style={styles.balanceAmount}>{formatCurrency(totalBalance, currencySymbol)}</Text>
					<View style={styles.balanceRow}>
						<View style={styles.balanceStat}>
							<Ionicons name="trending-up" size={16} color="#34D399" />
							<Text style={styles.balanceStatText}>{formatCurrency(summary.totalIncome, currencySymbol)} income</Text>
						</View>
						<View style={styles.balanceStat}>
							<Ionicons name="trending-down" size={16} color="#F87171" />
							<Text style={styles.balanceStatText}>{formatCurrency(summary.totalExpense, currencySymbol)} spent</Text>
						</View>
					</View>
				</View>

				{/* Quick Summary Cards */}
				<View style={styles.summaryRow}>
					<SummaryCard title="Income" amount={summary.totalIncome} icon="arrow-down-circle" iconColor={colors.income} bgColor={colors.incomeLight} colors={colors} symbol={currencySymbol} />
					<SummaryCard title="Expense" amount={summary.totalExpense} icon="arrow-up-circle" iconColor={colors.expense} bgColor={colors.expenseLight} colors={colors} symbol={currencySymbol} />
				</View>

				{/* Recent Transactions */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
						{transactions.length > 5 && (
							<TouchableOpacity onPress={() => router.push("/transactions" as any)}>
								<Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
							</TouchableOpacity>
						)}
					</View>
					<View style={[styles.txnList, { backgroundColor: colors.surface }]}>
						{recentTransactions.length === 0 ? (
							<View style={styles.emptyState}>
								<Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
								<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet</Text>
								<Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Tap the + button to add your first transaction</Text>
							</View>
						) : (
							recentTransactions.map((txn) => <TransactionItem key={txn.id} transaction={txn} colors={colors} symbol={currencySymbol} />)
						)}
					</View>
				</View>

				{/* Quick Stats */}
				{summary.transactionCount > 0 && (
					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Stats</Text>
						<View style={[styles.statsGrid, { backgroundColor: colors.surface }]}>
							<View style={styles.statItem}>
								<Text style={[styles.statValue, { color: colors.text }]}>{summary.transactionCount}</Text>
								<Text style={[styles.statLabel, { color: colors.textSecondary }]}>Transactions</Text>
							</View>
							<View style={[styles.statDivider, { backgroundColor: colors.border }]} />
							<View style={styles.statItem}>
								<Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(summary.averageAmount, currencySymbol)}</Text>
								<Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
							</View>
							<View style={[styles.statDivider, { backgroundColor: colors.border }]} />
							<View style={styles.statItem}>
								<Text style={[styles.statValue, { color: summary.netAmount >= 0 ? colors.income : colors.expense }]}>{formatCurrency(summary.netAmount, currencySymbol)}</Text>
								<Text style={[styles.statLabel, { color: colors.textSecondary }]}>Net</Text>
							</View>
						</View>
					</View>
				)}

				<View style={{ height: 24 }} />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: Spacing.lg,
		paddingTop: Platform.OS === "ios" ? 120 : 100,
		paddingBottom: 110,
	},

	// Header
	header: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: Spacing.lg,
		paddingTop: Platform.OS === "ios" ? 60 : 40,
		paddingBottom: Spacing.sm,
	},
	greeting: { ...Typography.bodyMedium, marginBottom: 2 },
	userName: { ...Typography.headlineMedium },
	menuButton: {
		width: 48,
		height: 48,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 3,
	},
	avatarContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		borderWidth: 2.5,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 4,
	},
	avatarImage: {
		width: "100%",
		height: "100%",
	},
	greetingBanner: {
		marginBottom: Spacing.xl,
	},

	// Balance Card
	balanceCard: {
		borderRadius: BorderRadius.xl,
		padding: Spacing.xxl,
		marginBottom: Spacing.lg,
		overflow: "hidden",
	},
	balanceLabel: {
		...Typography.labelMedium,
		color: "rgba(255,255,255,0.7)",
		marginBottom: Spacing.xs,
	},
	balanceAmount: {
		...Typography.amountLarge,
		color: "#FFFFFF",
		marginBottom: Spacing.lg,
	},
	balanceRow: {
		flexDirection: "row",
		gap: Spacing.xl,
	},
	balanceStat: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.xs,
	},
	balanceStatText: {
		...Typography.labelSmall,
		color: "rgba(255,255,255,0.85)",
	},

	// Summary Cards
	summaryRow: {
		flexDirection: "row",
		gap: Spacing.md,
		marginBottom: Spacing.xxl,
	},
	summaryCard: {
		flex: 1,
		borderRadius: BorderRadius.lg,
		padding: Spacing.lg,
	},
	summaryIconContainer: {
		width: 36,
		height: 36,
		borderRadius: BorderRadius.md,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: Spacing.sm,
	},
	summaryLabel: { ...Typography.labelSmall, marginBottom: Spacing.xxs },
	summaryAmount: { ...Typography.amountSmall },

	// Section
	section: { marginBottom: Spacing.xxl },
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacing.md,
	},
	sectionTitle: { ...Typography.titleLarge },
	seeAll: { ...Typography.labelMedium },

	// Transaction List
	txnList: {
		borderRadius: BorderRadius.lg,
		overflow: "hidden",
	},
	txnItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: Spacing.lg,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	txnIconContainer: {
		width: 40,
		height: 40,
		borderRadius: BorderRadius.md,
		justifyContent: "center",
		alignItems: "center",
		marginRight: Spacing.md,
	},
	txnIcon: { fontSize: 18 },
	txnDetails: { flex: 1 },
	txnCategory: { ...Typography.titleSmall, marginBottom: 2 },
	txnMeta: { ...Typography.labelSmall },
	txnAmount: { ...Typography.amountSmall },

	// Empty State
	emptyState: {
		alignItems: "center",
		padding: Spacing.xxxl,
	},
	emptyText: {
		...Typography.titleMedium,
		marginTop: Spacing.md,
	},
	emptySubtext: {
		...Typography.bodySmall,
		textAlign: "center",
		marginTop: Spacing.xs,
	},

	// Stats Grid
	statsGrid: {
		flexDirection: "row",
		borderRadius: BorderRadius.lg,
		padding: Spacing.lg,
	},
	statItem: {
		flex: 1,
		alignItems: "center",
	},
	statValue: { ...Typography.titleLarge, marginBottom: 4 },
	statLabel: { ...Typography.labelSmall },
	statDivider: { width: 1, height: "80%", alignSelf: "center" },
});
