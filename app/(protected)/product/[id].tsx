import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Image } from "@/components/image";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import { formatPrice, discountPercent } from "@/lib/format";
import { useProduct } from "@/hooks/useProducts";
import { useProductVariants } from "@/hooks/useProductVariants";
import { useIsWishlisted, useToggleWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useCart";
import { ReviewsSection } from "@/components/product/reviews-section";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function variantLabel(v: { size: string | null; color: string | null }) {
	return [v.size, v.color].filter(Boolean).join(" / ") || "Option";
}

export default function ProductDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();

	const { data: product, isLoading, isError } = useProduct(id);
	const { data: variants } = useProductVariants(id);
	const { data: isWishlisted } = useIsWishlisted(id);
	const toggleWishlist = useToggleWishlist(id!);
	const addToCart = useAddToCart();

	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		null,
	);
	const [quantity, setQuantity] = useState(1);

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Stack.Screen options={{ headerShown: true, headerTitle: "" }} />
				<ActivityIndicator />
			</View>
		);
	}

	if (isError || !product) {
		return (
			<View className="flex-1 items-center justify-center bg-background p-4 gap-2">
				<Stack.Screen options={{ headerShown: true, headerTitle: "" }} />
				<Text className="text-base font-semibold">Product not found</Text>
				<Muted className="text-center">
					This product couldn&apos;t be loaded.
				</Muted>
			</View>
		);
	}

	const selectedVariant = variants?.find((v) => v.id === selectedVariantId);
	const basePrice =
		selectedVariant?.price_override ?? product.discount_price ?? product.price;
	const hasDiscount =
		product.discount_price != null &&
		product.discount_price < product.price &&
		!selectedVariant?.price_override;
	const percentOff = hasDiscount
		? discountPercent(product.price, product.discount_price!)
		: 0;
	const outOfStock = product.stock <= 0;
	const needsVariant = !!variants && variants.length > 0 && !selectedVariantId;

	function handleAddToCart() {
		if (needsVariant) {
			Alert.alert("Select an option", "Please choose a variant first.");
			return;
		}
		addToCart.mutate(
			{ productId: product!.id, variantId: selectedVariantId, quantity },
			{
				onSuccess: () =>
					Alert.alert("Added to cart", `${product!.name} × ${quantity}`),
				onError: (e: any) =>
					Alert.alert("Couldn't add to cart", e.message ?? "Try again."),
			},
		);
	}

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen options={{ headerShown: true, headerTitle: "" }} />

			<ScrollView contentContainerClassName="pb-6">
				<ScrollView
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
				>
					{product.images.map((uri, index) => (
						<Image
							key={index}
							source={{ uri }}
							style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
							className="bg-muted"
							contentFit="cover"
							accessibilityLabel={product.name}
						/>
					))}
				</ScrollView>

				<View className="p-4 gap-3">
					{!!product.brand && (
						<Text className="text-sm text-muted-foreground">
							{product.brand}
						</Text>
					)}
					<Text className="text-xl font-semibold">{product.name}</Text>

					<View className="flex-row items-center gap-2">
						<View className="flex-row items-center gap-1 rounded bg-brand px-1.5 py-0.5">
							<Text className="text-xs font-semibold text-brand-foreground">
								{product.rating.toFixed(1)}
							</Text>
							<Feather name="star" size={10} color="#ffffff" />
						</View>
						{product.rating_count > 0 && (
							<Muted className="text-xs">
								{product.rating_count}{" "}
								{product.rating_count === 1 ? "review" : "reviews"}
							</Muted>
						)}
						{percentOff > 0 && (
							<Text className="text-xs font-semibold text-brand">
								{percentOff}% off
							</Text>
						)}
					</View>

					<View className="flex-row items-baseline gap-2">
						<Text className="text-2xl font-bold">{formatPrice(basePrice)}</Text>
						{hasDiscount && (
							<Text className="text-base text-muted-foreground line-through">
								{formatPrice(product.price)}
							</Text>
						)}
					</View>

					<Text
						className={
							outOfStock
								? "text-sm font-medium text-destructive"
								: "text-sm text-muted-foreground"
						}
					>
						{outOfStock ? "Out of stock" : `In stock: ${product.stock}`}
					</Text>

					{!!variants && variants.length > 0 && (
						<View className="gap-2">
							<Text className="text-sm font-semibold">Options</Text>
							<View className="flex-row flex-wrap gap-2">
								{variants.map((v) => {
									const selected = v.id === selectedVariantId;
									return (
										<Pressable
											key={v.id}
											onPress={() => setSelectedVariantId(v.id)}
											className={
												selected
													? "rounded-md border border-brand bg-brand/10 px-3 py-2"
													: "rounded-md border border-border px-3 py-2"
											}
										>
											<Text
												className={selected ? "text-sm text-brand" : "text-sm"}
											>
												{variantLabel(v)}
											</Text>
										</Pressable>
									);
								})}
							</View>
						</View>
					)}

					<View className="flex-row items-center gap-3 pt-1">
						<Text className="text-sm font-semibold">Quantity</Text>
						<View className="flex-row items-center gap-3 rounded-md border border-border px-2 py-1">
							<Pressable
								onPress={() => setQuantity((q) => Math.max(1, q - 1))}
								hitSlop={8}
							>
								<Feather name="minus" size={18} />
							</Pressable>
							<Text className="text-base font-semibold w-6 text-center">
								{quantity}
							</Text>
							<Pressable onPress={() => setQuantity((q) => q + 1)} hitSlop={8}>
								<Feather name="plus" size={18} />
							</Pressable>
						</View>
					</View>

					{!!product.description && (
						<View className="gap-1 pt-2">
							<Text className="text-sm font-semibold">Description</Text>
							<Muted className="leading-5">{product.description}</Muted>
						</View>
					)}

					<ReviewsSection productId={product.id} />
				</View>
			</ScrollView>

			<View
				className="flex-row items-center gap-3 border-t border-border bg-background px-4 pt-3"
				style={{ paddingBottom: insets.bottom + 12 }}
			>
				<Pressable
					onPress={() => toggleWishlist.mutate(!!isWishlisted)}
					className="h-12 w-12 items-center justify-center rounded-md border border-border"
					accessibilityLabel={
						isWishlisted ? "Remove from wishlist" : "Add to wishlist"
					}
				>
					<Feather
						name="heart"
						size={22}
						color={isWishlisted ? "#059669" : "#6b7280"}
					/>
				</Pressable>
				<Button
					className="flex-1"
					size="default"
					variant="default"
					disabled={outOfStock || addToCart.isPending}
					onPress={handleAddToCart}
				>
					{addToCart.isPending ? (
						<ActivityIndicator size="small" />
					) : (
						<Text>{outOfStock ? "Out of Stock" : "Add to Cart"}</Text>
					)}
				</Button>
			</View>
		</View>
	);
}
