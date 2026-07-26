import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import { formatPrice } from "@/lib/format";
import { cartLinePrice, useCartItems } from "@/hooks/useCart";
import { useAddresses, type Address } from "@/hooks/useAddresses";
import { usePlaceOrder } from "@/hooks/useOrders";

function formatAddress(a: Address) {
	return [a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
		.filter(Boolean)
		.join(", ");
}

export default function Checkout() {
	const insets = useSafeAreaInsets();
	const { data: cart, isLoading: cartLoading } = useCartItems();
	const { data: addresses, isLoading: addrLoading } = useAddresses();
	const placeOrder = usePlaceOrder();

	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
		null,
	);

	// Default the selection to the user's default address (or the first one).
	useEffect(() => {
		if (addresses && addresses.length > 0 && !selectedAddressId) {
			const def = addresses.find((a) => a.is_default) ?? addresses[0];
			setSelectedAddressId(def.id);
		}
	}, [addresses]); // eslint-disable-line react-hooks/exhaustive-deps

	const subtotal = useMemo(
		() =>
			cart?.reduce(
				(sum, item) => sum + cartLinePrice(item) * item.quantity,
				0,
			) ?? 0,
		[cart],
	);
	const itemCount =
		cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

	function handlePlaceOrder() {
		if (!selectedAddressId) {
			Alert.alert("Select an address", "Please choose a delivery address.");
			return;
		}
		placeOrder.mutate(
			{ addressId: selectedAddressId, paymentMethod: "cod" },
			{
				onSuccess: (orderId) => {
					router.replace({
						pathname: "/orders/[id]",
						params: { id: orderId, placed: "1" },
					});
				},
				onError: (e: any) =>
					Alert.alert("Couldn't place order", e.message ?? "Try again."),
			},
		);
	}

	if (cartLoading || addrLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Stack.Screen options={{ headerShown: true, headerTitle: "Checkout" }} />
				<ActivityIndicator />
			</View>
		);
	}

	const cartEmpty = !cart || cart.length === 0;

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen options={{ headerShown: true, headerTitle: "Checkout" }} />

			{cartEmpty ? (
				<View className="flex-1 items-center justify-center p-6 gap-2">
					<Feather name="shopping-cart" size={40} color="#9ca3af" />
					<Text className="text-base font-semibold">Your cart is empty</Text>
					<Muted className="text-center">
						Add items to your cart before checking out.
					</Muted>
				</View>
			) : (
				<>
					<ScrollView contentContainerClassName="p-4 gap-6">
						<View className="gap-3">
							<Text className="text-base font-semibold">Delivery address</Text>
							{!addresses || addresses.length === 0 ? (
								<View className="rounded-xl border border-border p-4 gap-2">
									<Muted>You don&apos;t have any saved addresses.</Muted>
									<Button
										variant="secondary"
										size="default"
										onPress={() => router.push("/address/edit")}
									>
										<Text>Add Address</Text>
									</Button>
								</View>
							) : (
								addresses.map((a) => {
									const selected = a.id === selectedAddressId;
									return (
										<Pressable
											key={a.id}
											onPress={() => setSelectedAddressId(a.id)}
											className={
												selected
													? "rounded-xl border-2 border-brand p-4 gap-1"
													: "rounded-xl border border-border p-4 gap-1"
											}
										>
											<View className="flex-row items-center gap-2">
												<Feather
													name={selected ? "check-circle" : "circle"}
													size={16}
													color={selected ? "#059669" : "#9ca3af"}
												/>
												<Text className="font-semibold">
													{a.label || a.full_name}
												</Text>
												{a.is_default && (
													<View className="rounded bg-brand px-1.5 py-0.5">
														<Text className="text-xs font-semibold text-brand-foreground">
															Default
														</Text>
													</View>
												)}
											</View>
											<Muted className="text-sm">{a.full_name} · {a.phone}</Muted>
											<Muted className="text-sm leading-5">
												{formatAddress(a)}
											</Muted>
										</Pressable>
									);
								})
							)}
						</View>

						<View className="gap-3">
							<Text className="text-base font-semibold">Payment method</Text>
							<View className="rounded-xl border border-border p-4 flex-row items-center gap-2">
								<Feather name="dollar-sign" size={18} color="#059669" />
								<Text className="text-sm">Cash on delivery</Text>
							</View>
						</View>

						<View className="gap-3">
							<Text className="text-base font-semibold">Order summary</Text>
							<View className="rounded-xl border border-border p-4 gap-2">
								{cart.map((item) => (
									<View
										key={item.id}
										className="flex-row justify-between gap-3"
									>
										<Muted className="flex-1 text-sm" numberOfLines={1}>
											{item.product?.name ?? "Item"} × {item.quantity}
										</Muted>
										<Text className="text-sm">
											{formatPrice(cartLinePrice(item) * item.quantity)}
										</Text>
									</View>
								))}
								<View className="h-px bg-border my-1" />
								<View className="flex-row justify-between">
									<Text className="font-semibold">
										Total ({itemCount} {itemCount === 1 ? "item" : "items"})
									</Text>
									<Text className="font-bold">{formatPrice(subtotal)}</Text>
								</View>
							</View>
						</View>
					</ScrollView>

					<View
						className="border-t border-border bg-background px-4 pt-3"
						style={{ paddingBottom: insets.bottom + 12 }}
					>
						<Button
							size="default"
							variant="default"
							disabled={placeOrder.isPending || !selectedAddressId}
							onPress={handlePlaceOrder}
						>
							{placeOrder.isPending ? (
								<ActivityIndicator size="small" />
							) : (
								<Text>Place Order · {formatPrice(subtotal)}</Text>
							)}
						</Button>
					</View>
				</>
			)}
		</View>
	);
}
