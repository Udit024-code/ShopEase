import { FlatList, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import { ProductCard } from "@/components/product/product-card";
import { useCategory } from "@/hooks/useCategories";
import { useProductsByCategory } from "@/hooks/useProducts";

function GridSkeleton() {
	return (
		<View className="flex-row flex-wrap gap-3 px-4 pt-4">
			{[1, 2, 3, 4].map((i) => (
				<View key={i} className="flex-1 min-w-[45%] gap-2">
					<View className="w-full aspect-square rounded-lg bg-muted" />
					<View className="h-3 w-3/4 rounded bg-muted" />
					<View className="h-3 w-1/2 rounded bg-muted" />
				</View>
			))}
		</View>
	);
}

export default function CategoryListing() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { data: category } = useCategory(id);
	const {
		data: products,
		isLoading,
		isError,
	} = useProductsByCategory(id);

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen
				options={{
					headerShown: true,
					headerTitle: category?.name ?? "Category",
				}}
			/>

			{isLoading ? (
				<GridSkeleton />
			) : isError ? (
				<View className="flex-1 items-center justify-center p-4 gap-2">
					<Text className="text-base font-semibold">
						Couldn&apos;t load products
					</Text>
					<Muted className="text-center">
						Something went wrong. Pull back and try again.
					</Muted>
				</View>
			) : !products || products.length === 0 ? (
				<View className="flex-1 items-center justify-center p-4 gap-2">
					<Text className="text-base font-semibold">No products yet</Text>
					<Muted className="text-center">
						There are no products in this category right now.
					</Muted>
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
