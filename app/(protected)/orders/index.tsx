import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import { formatPrice } from "@/lib/format";
import { useOrders, type OrderSummary } from "@/hooks/useOrders";

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function OrderRow({ order }: { order: OrderSummary }) {
	return (
		<Pressable
			className="rounded-xl border border-border p-4 gap-2"
			onPress={() =>
				router.push({ pathname: "/orders/[id]", params: { id: order.id } })
			}
		>
			<View className="flex-row items-center justify-between">
				<Text className="font-semibold">Order #{order.id.slice(0, 8)}</Text>
				<OrderStatusBadge status={order.status} />
			</View>
			<View className="flex-row items-center justify-between">
				<Muted className="text-sm">
					{formatDate(order.created_at)} · {order.item_count}{" "}
					{order.item_count === 1 ? "item" : "items"}
				</Muted>
				<Text className="text-sm font-semibold">
					{formatPrice(order.total_amount)}
				</Text>
			</View>
		</Pressable>
	);
}

export default function OrderHistory() {
	const { data: orders, isLoading, isError } = useOrders();

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen options={{ headerShown: true, headerTitle: "My Orders" }} />

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator />
				</View>
			) : isError ? (
				<View className="flex-1 items-center justify-center p-4 gap-2">
					<Text className="text-base font-semibold">Couldn&apos;t load orders</Text>
					<Muted className="text-center">Something went wrong.</Muted>
				</View>
			) : !orders || orders.length === 0 ? (
				<View className="flex-1 items-center justify-center p-6 gap-3">
					<Feather name="package" size={40} color="#9ca3af" />
					<Text className="text-base font-semibold">No orders yet</Text>
					<Muted className="text-center">
						Your placed orders will show up here.
					</Muted>
					<Button
						variant="default"
						size="default"
						onPress={() => router.push("/(protected)/(tabs)")}
					>
						<Text>Start Shopping</Text>
					</Button>
				</View>
			) : (
				<FlatList
					data={orders}
					keyExtractor={(item) => item.id}
					contentContainerClassName="p-4 gap-3"
					showsVerticalScrollIndicator={false}
					renderItem={({ item }) => <OrderRow order={item} />}
				/>
			)}
		</View>
	);
}
