import { Alert, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Image } from "@/components/image";
import { Text } from "@/components/ui/text";
import { formatPrice, discountPercent } from "@/lib/format";
import type { Product } from "@/hooks/useProducts";

type ProductCardProps = {
	product: Product;
	/** Fixed width so cards line up inside a horizontal rail. */
	widthClassName?: string;
};

export function ProductCard({
	product,
	widthClassName = "w-40",
}: ProductCardProps) {
	const hasDiscount =
		product.discount_price != null && product.discount_price < product.price;
	const displayPrice = hasDiscount ? product.discount_price! : product.price;
	const percentOff = hasDiscount
		? discountPercent(product.price, product.discount_price!)
		: 0;

	return (
		<Pressable
			className={`${widthClassName} gap-2`}
			onPress={() =>
				Alert.alert(
					product.name,
					"Product details are coming in a future update.",
				)
			}
		>
			<View className="w-full aspect-square rounded-lg bg-muted overflow-hidden">
				<Image
					source={{ uri: product.images[0] }}
					className="w-full h-full"
					contentFit="cover"
					accessibilityLabel={product.name}
				/>
			</View>

			<View className="gap-1">
				{!!product.brand && (
					<Text className="text-xs text-muted-foreground" numberOfLines={1}>
						{product.brand}
					</Text>
				)}
				<Text className="text-sm" numberOfLines={2}>
					{product.name}
				</Text>

				<View className="flex-row items-center gap-2">
					<Text className="text-base font-semibold">
						{formatPrice(displayPrice)}
					</Text>
					{hasDiscount && (
						<Text className="text-xs text-muted-foreground line-through">
							{formatPrice(product.price)}
						</Text>
					)}
				</View>

				<View className="flex-row items-center gap-2">
					<View className="flex-row items-center gap-1 rounded bg-brand px-1.5 py-0.5">
						<Text className="text-xs font-semibold text-brand-foreground">
							{product.rating.toFixed(1)}
						</Text>
						<Feather name="star" size={10} color="#ffffff" />
					</View>
					{percentOff > 0 && (
						<Text className="text-xs font-semibold text-brand">
							{percentOff}% off
						</Text>
					)}
				</View>
			</View>
		</Pressable>
	);
}
