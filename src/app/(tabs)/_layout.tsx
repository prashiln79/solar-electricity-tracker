import { useState } from 'react';
import { useThemeColors } from "@/theme";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { Platform, StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddTransactionBottomSheet from '@/components/transaction/AddTransactionBottomSheet';
import { useAuthStore } from '@/store/useAuthStore';
import SideDrawer from '@/components/navigation/SideDrawer';
import { useSettingsStore } from '@/store/useSettingsStore';
import { db as firestore } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

interface TabConfig {
	label: string;
	iconName: MaterialIconName;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
	index: {
		label: "Home",
		iconName: "home",
	},
	transactions: {
		label: "Expense",
		iconName: "trending-up",
	},
	add: {
		label: "Add",
		iconName: "add",
	},
	budgets: {
		label: "Summary",
		iconName: "bar-chart",
	},
	more: {
		label: "Profile",
		iconName: "person",
	},
};

function CustomTabBar({ state, descriptors, navigation }: any) {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { isFamilyMode } = useSettingsStore();

	// Ensure safe padding at the bottom of the screen on devices like iPhone with Home Indicator
	const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 20 : 12) + 8;

	return (
		<View
			style={[
				styles.tabContainer,
				{
					backgroundColor: colors.background,
					borderTopColor: colors.borderLight,
					paddingBottom: bottomPadding,
					shadowColor: colors.shadow,
				},
			]}
		>
			{state.routes.map((route: any, index: number) => {
				const { options } = descriptors[route.key];
				const isFocused = state.index === index;
				const config = { ...TAB_CONFIGS[route.name] };

				if (!config.iconName) return null;

				// Dynamic adjustments in family mode
				if (isFamilyMode && route.name === "more") {
					config.label = "Family";
					config.iconName = "groups";
				}

				const onPress = () => {
					const event = navigation.emit({
						type: "tabPress",
						target: route.key,
						canPreventDefault: true,
					});

					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name);
					}
				};

				const isAdd = route.name === "add";

				// Styling rules matching the user's reference image
				let iconBgColor = colors.surfaceVariant;
				let contentColor = colors.textSecondary;
				let labelColor = colors.textSecondary;

				if (isAdd) {
					iconBgColor = colors.text; // Charcoal/Black in light mode, Off-white in dark mode
					contentColor = colors.background; // Inverted high-contrast color for the icon
					labelColor = colors.text;
				} else if (isFocused) {
					iconBgColor = colors.primary; // Active green
					contentColor = "#FFFFFF"; // White icon
					labelColor = colors.primary; // Active green text
				}

				return (
					<TouchableOpacity
						key={route.key}
						accessibilityRole="button"
						accessibilityState={isFocused ? { selected: true } : {}}
						accessibilityLabel={options.tabBarAccessibilityLabel}
						testID={options.tabBarTestID}
						onPress={onPress}
						style={styles.tabItem}
						activeOpacity={0.8}
					>
						<View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
							<MaterialIcons name={config.iconName} size={24} color={contentColor} />
						</View>
						<Text style={[styles.label, { color: labelColor }]}>{config.label}</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

export default function TabLayout() {
	const [isAddVisible, setIsAddVisible] = useState(false);
	const [isDrawerVisible, setIsDrawerVisible] = useState(false);
	const colors = useThemeColors();
	const user = useAuthStore((s) => s.user);
	const { isFamilyMode, activeFamilyId } = useSettingsStore();
	const [familyName, setFamilyName] = useState('');

	useEffect(() => {
		async function loadFamilyName() {
			if (isFamilyMode && activeFamilyId) {
				try {
					const docRef = doc(firestore, 'family-groups', activeFamilyId);
					const docSnap = await getDoc(docRef);
					if (docSnap.exists()) {
						setFamilyName(docSnap.data().name || 'Family');
					}
				} catch (e) {
					console.error(e);
				}
			} else {
				setFamilyName('');
			}
		}
		loadFamilyName();
	}, [isFamilyMode, activeFamilyId]);

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			{/* Shared Global Top Header */}
			<View style={[styles.header, { backgroundColor: colors.background }]}>
				<TouchableOpacity
					style={[styles.menuButton, { backgroundColor: colors.surface }]}
					onPress={() => setIsDrawerVisible(true)}
				>
					<Ionicons name="menu-outline" size={24} color={colors.text} />
				</TouchableOpacity>

				{isFamilyMode && (
					<View style={styles.headerCenter} pointerEvents="none">
						<View style={[styles.familyBadge, { backgroundColor: colors.primaryContainer }]}>
							<Text style={[styles.familyBadgeText, { color: colors.primary }]}>
								👨‍👩‍👧‍👦 {familyName || 'Family'}
							</Text>
						</View>
					</View>
				)}

				<TouchableOpacity
					style={[styles.avatarContainer, { borderColor: '#FFFFFF', backgroundColor: colors.surfaceVariant }]}
					onPress={() => router.push('/more' as any)}
				>
					<Image
						source={{ uri: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' }}
						style={styles.avatarImage}
					/>
				</TouchableOpacity>
			</View>

			<Tabs
				tabBar={(props) => <CustomTabBar {...props} />}
				screenOptions={{
					headerShown: false,
				}}
			>
				<Tabs.Screen name="index" />
				<Tabs.Screen name="transactions" />
				<Tabs.Screen
					name="add"
					listeners={{
						tabPress: (e) => {
							e.preventDefault();
							setIsAddVisible(true);
						},
					}}
				/>
				<Tabs.Screen name="budgets" />
				<Tabs.Screen name="more" />
			</Tabs>

			<AddTransactionBottomSheet
				visible={isAddVisible}
				onClose={() => setIsAddVisible(false)}
			/>

			<SideDrawer
				visible={isDrawerVisible}
				onClose={() => setIsDrawerVisible(false)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	tabContainer: {
		flexDirection: "row",
		borderTopWidth: 1,
		paddingTop: 10,
		paddingHorizontal: 8,
		elevation: 8,
		shadowOffset: { width: 0, height: -3 },
		shadowOpacity: 0.08,
		shadowRadius: 5,
	},
	tabItem: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	iconContainer: {
		width: 56,
		height: 56,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	label: {
		fontSize: 11,
		fontWeight: "600",
		marginTop: 6,
		textAlign: "center",
	},
	header: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
		paddingBottom: 8,
	},
	menuButton: {
		width: 48,
		height: 48,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
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
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 4,
	},
	avatarImage: {
		width: '100%',
		height: '100%',
	},
	headerCenter: {
		position: 'absolute',
		left: 80,
		right: 80,
		justifyContent: 'center',
		alignItems: 'center',
		height: '100%',
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
	},
	familyBadge: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 14,
	},
	familyBadgeText: {
		fontSize: 12,
		fontWeight: '700',
	},
});
