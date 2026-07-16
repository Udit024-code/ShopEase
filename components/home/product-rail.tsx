import { ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/hooks/useProducts";

type ProductRailProps = {
	title: string;
	products: Product[] | undefined;
	isLoading: boolean;
	isError: boolean;
};

function ProductRailSkeleton() {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerClassName="px-4 gap-3"
		>
			{[1, 2, 3].map((i) => (
				<View key={i} className="w-40 gap-2">
					<View className="w-full aspect-square rounded-lg bg-muted" />
					<View className="h-3 w-3/4 rounded bg-muted" />
					<View className="h-3 w-1/2 rounded bg-muted" />
				</View>
			))}
		</ScrollView>
	);
}

export function ProductRail({
	title,
	products,
	isLoading,
	isError,
}: ProductRailProps) {
	if (isError) return null;

	return (
		<View className="gap-3">
			<Text className="px-4 text-base font-semibold">{title}</Text>

			{isLoading ? (
				<ProductRailSkeleton />
			) : !products || products.length === 0 ? null : (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="px-4 gap-3"
				>
					{products.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</ScrollView>
			)}
		</View>
	);
}
