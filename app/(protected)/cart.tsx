import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Image } from "@/components/image";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import { formatPrice } from "@/lib/format";
import {
	cartLinePrice,
	useCartItems,
	useRemoveCartItem,
	useUpdateCartQuantity,
	type CartItem,
} from "@/hooks/useCart";

function variantLabel(variant: CartItem["variant"]) {
	if (!variant) return null;
	return [variant.size, variant.color].filter(Boolean).join(" / ") || null;
}

function CartRow({ item }: { item: CartItem }) {
	const updateQuantity = useUpdateCartQuantity();
	const removeItem = useRemoveCartItem();
	const unitPrice = cartLinePrice(item);
	const label = variantLabel(item.variant);

	if (!item.product) return null;

	return (
		<View className="flex-row gap-3 px-4 py-3">
			<View className="w-20 h-20 rounded-lg bg-muted overflow-hidden">
				<Image
					source={{ uri: item.product.images[0] }}
					className="w-full h-full"
					contentFit="cover"
					accessibilityLabel={item.product.name}
				/>
			</View>

			<View className="flex-1 gap-1">
				{!!item.product.brand && (
					<Text className="text-xs text-muted-foreground">
						{item.product.brand}
					</Text>
				)}
				<Text className="text-sm" numberOfLines={2}>
					{item.product.name}
				</Text>
				{!!label && <Muted className="text-xs">{label}</Muted>}
				<Text className="text-base font-semibold">
					{formatPrice(unitPrice)}
				</Text>

				<View className="flex-row items-center justify-between pt-1">
					<View className="flex-row items-center gap-3 rounded-md border border-border px-2 py-1">
						<Pressable
							hitSlop={8}
							disabled={updateQuantity.isPending}
							onPress={() =>
								updateQuantity.mutate({
									id: item.id,
									quantity: Math.max(1, item.quantity - 1),
								})
							}
						>
							<Feather name="minus" size={16} />
						</Pressable>
						<Text className="text-sm font-semibold w-5 text-center">
							{item.quantity}
						</Text>
						<Pressable
							hitSlop={8}
							disabled={updateQuantity.isPending}
							onPress={() =>
								updateQuantity.mutate({
									id: item.id,
									quantity: item.quantity + 1,
								})
							}
						>
							<Feather name="plus" size={16} />
						</Pressable>
					</View>

					<Pressable
						hitSlop={8}
						onPress={() => removeItem.mutate(item.id)}
						accessibilityLabel="Remove from cart"
					>
						<Feather name="trash-2" size={18} color="#6b7280" />
					</Pressable>
				</View>
			</View>
		</View>
	);
}

export default function Cart() {
	const insets = useSafeAreaInsets();
	const { data: items, isLoading, isError } = useCartItems();

	const subtotal =
		items?.reduce(
			(sum, item) => sum + cartLinePrice(item) * item.quantity,
			0,
		) ?? 0;
	const itemCount =
		items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen options={{ headerShown: true, headerTitle: "Cart" }} />

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator />
				</View>
			) : isError ? (
				<View className="flex-1 items-center justify-center p-4 gap-2">
					<Text className="text-base font-semibold">Couldn&apos;t load cart</Text>
					<Muted className="text-center">Something went wrong.</Muted>
				</View>
			) : !items || items.length === 0 ? (
				<View className="flex-1 items-center justify-center p-6 gap-3">
					<Feather name="shopping-cart" size={40} color="#9ca3af" />
					<Text className="text-base font-semibold">Your cart is empty</Text>
					<Muted className="text-center">
						Browse products and add items to your cart.
					</Muted>
					<Button variant="default" size="default" onPress={() => router.back()}>
						<Text>Continue Shopping</Text>
					</Button>
				</View>
			) : (
				<>
					<FlatList
						data={items}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => <CartRow item={item} />}
						ItemSeparatorComponent={() => (
							<View className="h-px bg-border mx-4" />
						)}
						showsVerticalScrollIndicator={false}
					/>

					<View
						className="border-t border-border bg-background px-4 pt-3 gap-3"
						style={{ paddingBottom: insets.bottom + 12 }}
					>
						<View className="flex-row items-center justify-between">
							<Muted>
								Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
							</Muted>
							<Text className="text-lg font-bold">{formatPrice(subtotal)}</Text>
						</View>
						<Button
							size="default"
							variant="default"
							onPress={() => router.push("/checkout")}
						>
							<Text>Proceed to Checkout</Text>
						</Button>
					</View>
				</>
			)}
		</View>
	);
}
