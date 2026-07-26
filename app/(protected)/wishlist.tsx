import { ActivityIndicator, FlatList, View } from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import { ProductCard } from "@/components/product/product-card";
import { useWishlistItems } from "@/hooks/useWishlist";

export default function Wishlist() {
	const { data: items, isLoading, isError } = useWishlistItems();
	const products =
		items?.map((i) => i.product).filter((p): p is NonNullable<typeof p> => !!p) ??
		[];

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen options={{ headerShown: true, headerTitle: "Wishlist" }} />

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator />
				</View>
			) : isError ? (
				<View className="flex-1 items-center justify-center p-4 gap-2">
					<Text className="text-base font-semibold">
						Couldn&apos;t load wishlist
					</Text>
					<Muted className="text-center">Something went wrong.</Muted>
				</View>
			) : products.length === 0 ? (
				<View className="flex-1 items-center justify-center p-6 gap-3">
					<Feather name="heart" size={40} color="#9ca3af" />
					<Text className="text-base font-semibold">
						Your wishlist is empty
					</Text>
					<Muted className="text-center">
						Tap the heart on a product to save it here.
					</Muted>
					<Button variant="default" size="default" onPress={() => router.back()}>
						<Text>Browse Products</Text>
					</Button>
				</View>
			) : (
				<FlatList
					data={products}
					keyExtractor={(item) => item.id}
					numColumns={2}
					columnWrapperClassName="gap-3 px-4"
					contentContainerClassName="gap-4 py-4"
					showsVerticalScrollIndicator={false}
					renderItem={({ item }) => (
						<View className="flex-1">
							<ProductCard product={item} widthClassName="w-full" />
						</View>
					)}
				/>
			)}
		</View>
	);
}
