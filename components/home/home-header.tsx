import { Alert, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";

function comingSoon(feature: string) {
	Alert.alert(feature, `${feature} is coming in a future update.`);
}

export function HomeHeader() {
	const insets = useSafeAreaInsets();

	return (
		<View className="bg-brand" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
				<Pressable
					className="flex-1 flex-row items-center gap-2 rounded-lg bg-white px-3 h-11"
					onPress={() => comingSoon("Search")}
				>
					<Feather name="search" size={18} color="#6b7280" />
					<Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
						Search for products, brands and more
					</Text>
				</Pressable>

				<Pressable
					onPress={() => router.push("/wishlist")}
					hitSlop={8}
					accessibilityLabel="Wishlist"
				>
					<Feather name="heart" size={24} color="#ffffff" />
				</Pressable>

				<Pressable
					onPress={() => router.push("/cart")}
					hitSlop={8}
					accessibilityLabel="Cart"
				>
					<Feather name="shopping-cart" size={24} color="#ffffff" />
				</Pressable>
			</View>
		</View>
	);
}
