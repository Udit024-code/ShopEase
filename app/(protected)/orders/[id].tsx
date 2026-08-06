import {
	ActivityIndicator,
	Alert,
	ScrollView,
	View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Image } from "@/components/image";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderStatusTimeline } from "@/components/order-status-timeline";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import { formatPrice } from "@/lib/format";
import {
	useCancelOrder,
	useOrder,
	useReorder,
	type OrderDetail,
} from "@/hooks/useOrders";

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function formatOrderAddress(a: OrderDetail["address"]) {
	if (!a) return "";
	return [a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
		.filter(Boolean)
		.join(", ");
}

export default function OrderDetailScreen() {
	const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
	const { data: order, isLoading, isError } = useOrder(id);
	const cancelOrder = useCancelOrder();
	const reorder = useReorder();

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Stack.Screen options={{ headerShown: true, headerTitle: "Order" }} />
				<ActivityIndicator />
			</View>
		);
	}

	if (isError || !order) {
		return (
			<View className="flex-1 items-center justify-center bg-background p-4 gap-2">
				<Stack.Screen options={{ headerShown: true, headerTitle: "Order" }} />
				<Text className="text-base font-semibold">Order not found</Text>
				<Muted className="text-center">This order couldn&apos;t be loaded.</Muted>
			</View>
		);
	}

	function handleCancel() {
		Alert.alert("Cancel order", "Cancel this order? Items will be restocked.", [
			{ text: "Keep order", style: "cancel" },
			{
				text: "Cancel order",
				style: "destructive",
				onPress: () =>
					cancelOrder.mutate(id!, {
						onError: (e: any) =>
							Alert.alert("Couldn't cancel", e.message ?? "Try again."),
					}),
			},
		]);
	}

	function handleReorder() {
		reorder.mutate(id!, {
			onSuccess: () => router.push("/cart"),
			onError: (e: any) =>
				Alert.alert("Couldn't reorder", e.message ?? "Try again."),
		});
	}

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen
				options={{
					headerShown: true,
					headerTitle: placed === "1" ? "Order placed" : "Order",
				}}
			/>
			<ScrollView contentContainerClassName="p-4 gap-6">
				{placed === "1" && (
					<View className="items-center gap-2 py-2">
						<Feather name="check-circle" size={44} color="#059669" />
						<Text className="text-lg font-semibold">Thank you for your order!</Text>
						<Muted className="text-center">
							Your order has been placed and is now pending.
						</Muted>
					</View>
				)}

				<View className="gap-2">
					<View className="flex-row items-center justify-between">
						<Text className="text-base font-semibold">
							Order #{order.id.slice(0, 8)}
						</Text>
						<OrderStatusBadge status={order.status} />
					</View>
					<Muted className="text-sm">Placed on {formatDate(order.created_at)}</Muted>
				</View>

				<View className="gap-2">
					<Text className="text-base font-semibold">Status</Text>
					<OrderStatusTimeline
						status={order.status}
						placedAt={order.created_at}
					/>
				</View>

				<View className="gap-3">
					<Text className="text-base font-semibold">Items</Text>
					{order.items.map((item) => {
						const label = item.variant
							? [item.variant.size, item.variant.color]
									.filter(Boolean)
									.join(" / ")
							: null;
						return (
							<View key={item.id} className="flex-row gap-3">
								<View className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
									<Image
										source={{ uri: item.product?.images?.[0] }}
										className="w-full h-full"
										contentFit="cover"
										accessibilityLabel={item.product?.name}
									/>
								</View>
								<View className="flex-1 gap-0.5">
									{!!item.product?.brand && (
										<Muted className="text-xs">{item.product.brand}</Muted>
									)}
									<Text className="text-sm" numberOfLines={2}>
										{item.product?.name ?? "Item"}
									</Text>
									{!!label && <Muted className="text-xs">{label}</Muted>}
									<Text className="text-sm">
										{formatPrice(item.price)} × {item.quantity}
									</Text>
								</View>
							</View>
						);
					})}
				</View>

				{order.address && (
					<View className="gap-2">
						<Text className="text-base font-semibold">Delivery address</Text>
						<View className="rounded-xl border border-border p-4 gap-1">
							<Text className="text-sm">{order.address.full_name}</Text>
							<Muted className="text-sm">{order.address.phone}</Muted>
							<Muted className="text-sm leading-5">
								{formatOrderAddress(order.address)}
							</Muted>
						</View>
					</View>
				)}

				<View className="rounded-xl border border-border p-4 gap-2">
					<View className="flex-row justify-between">
						<Muted>Payment</Muted>
						<Text className="text-sm capitalize">
							{order.payment_method === "cod"
								? "Cash on delivery"
								: order.payment_method}
						</Text>
					</View>
					<View className="flex-row justify-between">
						<Text className="font-semibold">Total</Text>
						<Text className="font-bold">{formatPrice(order.total_amount)}</Text>
					</View>
				</View>

				<Button
					variant="default"
					size="default"
					disabled={reorder.isPending}
					onPress={handleReorder}
				>
					{reorder.isPending ? (
						<ActivityIndicator size="small" />
					) : (
						<Text>Reorder</Text>
					)}
				</Button>

				{order.status === "pending" && (
					<Button
						variant="secondary"
						size="default"
						disabled={cancelOrder.isPending}
						onPress={handleCancel}
					>
						{cancelOrder.isPending ? (
							<ActivityIndicator size="small" />
						) : (
							<Text>Cancel Order</Text>
						)}
					</Button>
				)}
			</ScrollView>
		</View>
	);
}
