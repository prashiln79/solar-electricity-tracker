import { useThemeColors } from "@/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
				const config = TAB_CONFIGS[route.name];

				if (!config) return null;

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
	return (
		<Tabs
			tabBar={(props) => <CustomTabBar {...props} />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen name="index" />
			<Tabs.Screen name="transactions" />
			<Tabs.Screen name="add" />
			<Tabs.Screen name="budgets" />
			<Tabs.Screen name="more" />
		</Tabs>
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
});
